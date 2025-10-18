import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import prisma from '../prisma/client.js';
import emailService from './email.service.js';
import logger from '../utils/logger.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
}

interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly ACCESS_TOKEN_EXPIRY = process.env.NODE_ENV === 'production' ? '15m' : '24h'; // 24h in dev
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly EMAIL_TOKEN_EXPIRY = '24h';
  private readonly RESET_TOKEN_EXPIRY = '1h';
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare password with hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate access and refresh tokens
   */
  generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    const refreshToken = jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Generate email verification token
   */
  generateEmailToken(userId: string, email: string): string {
    return jwt.sign({ userId, email, type: 'email-verification' }, this.JWT_SECRET, {
      expiresIn: this.EMAIL_TOKEN_EXPIRY,
    });
  }

  /**
   * Generate password reset token
   */
  generateResetToken(userId: string, email: string): string {
    return jwt.sign({ userId, email, type: 'password-reset' }, this.JWT_SECRET, {
      expiresIn: this.RESET_TOKEN_EXPIRY,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string, isRefreshToken = false): TokenPayload {
    const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const { email, password, username } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('EMAIL_EXISTS');
      }
      if (existingUser.username === username) {
        throw new Error('USERNAME_EXISTS');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        emailVerified: false,
        isActive: true,
      },
    });

    logger.info(`New user registered: ${user.id} (${user.email})`);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Generate email verification token
    const emailToken = this.generateEmailToken(user.id, user.email);

    // Send verification email (async, don't wait)
    emailService.sendVerificationEmail(user.email, emailToken, user.username).catch((err) => {
      logger.error('Failed to send verification email:', err);
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new Error('ACCOUNT_DISABLED');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    logger.info(`User logged in: ${user.id} (${user.email})`);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
    };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<Omit<User, 'password'>> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      if (decoded.type !== 'email-verification') {
        throw new Error('INVALID_TOKEN_TYPE');
      }

      // Update user
      const user = await prisma.user.update({
        where: { id: decoded.userId },
        data: { emailVerified: true },
      });

      logger.info(`Email verified for user: ${user.id} (${user.email})`);

      // Send welcome email (async)
      emailService.sendWelcomeEmail(user.email, user.username).catch((err) => {
        logger.error('Failed to send welcome email:', err);
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = this.verifyToken(refreshToken, true);

      // Get user to ensure they still exist and are active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new Error('INVALID_TOKEN');
      }

      // Generate new tokens (including new refresh token for rotation)
      const tokens = this.generateTokens(user);

      logger.info(`Tokens refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists or not (security)
    if (!user) {
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate reset token
    const resetToken = this.generateResetToken(user.id, user.email);

    // Send reset email
    const sent = await emailService.sendPasswordResetEmail(user.email, resetToken, user.username);

    if (sent) {
      logger.info(`Password reset email sent to: ${user.email}`);
    } else {
      logger.error(`Failed to send password reset email to: ${user.email}`);
      throw new Error('EMAIL_SEND_FAILED');
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;

      if (decoded.type !== 'password-reset') {
        throw new Error('INVALID_TOKEN_TYPE');
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      logger.info(`Password reset for user: ${decoded.userId}`);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    if (user.emailVerified) {
      throw new Error('EMAIL_ALREADY_VERIFIED');
    }

    const emailToken = this.generateEmailToken(user.id, user.email);

    const sent = await emailService.sendVerificationEmail(user.email, emailToken, user.username);

    if (!sent) {
      throw new Error('EMAIL_SEND_FAILED');
    }

    logger.info(`Verification email resent to: ${user.email}`);
  }
}

export default new AuthService();
