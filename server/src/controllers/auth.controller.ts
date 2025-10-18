import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import authService from '../services/auth.service.js';
import logger from '../utils/logger.js';

/**
 * Register new user
 * POST /api/auth/register
 */
export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, username } = req.body;

    const result = await authService.register({ email, password, username });

    return sendSuccess(
      res,
      {
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
      'Registration successful! Please check your email to verify your account.',
    );
  } catch (error: any) {
    logger.error('Registration error:', error);

    if (error.message === 'EMAIL_EXISTS') {
      return sendError(res, 'Email already exists', 'EMAIL_EXISTS', null, 409);
    }
    if (error.message === 'USERNAME_EXISTS') {
      return sendError(res, 'Username already exists', 'USERNAME_EXISTS', null, 409);
    }

    return sendError(res, 'Registration failed', 'REGISTRATION_FAILED', error.message, 500);
  }
}

/**
 * Verify email with token
 * GET /api/auth/verify-email?token=xxx
 */
export async function verifyEmailHandler(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return sendError(res, 'Verification token is required', 'TOKEN_REQUIRED', null, 400);
    }

    const user = await authService.verifyEmail(token);

    return sendSuccess(res, { user }, 'Email verified successfully!');
  } catch (error: any) {
    logger.error('Email verification error:', error);

    if (error.message === 'TOKEN_EXPIRED') {
      return sendError(res, 'Verification token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    if (error.message === 'INVALID_TOKEN' || error.message === 'INVALID_TOKEN_TYPE') {
      return sendError(res, 'Invalid verification token', 'INVALID_TOKEN', null, 401);
    }

    return sendError(res, 'Email verification failed', 'VERIFICATION_FAILED', error.message, 500);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    return sendSuccess(
      res,
      {
        user: result.user,
        token: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
      'Login successful!',
    );
  } catch (error: any) {
    logger.error('Login error:', error);

    if (error.message === 'INVALID_CREDENTIALS') {
      return sendError(res, 'Invalid email or password', 'INVALID_CREDENTIALS', null, 401);
    }
    if (error.message === 'ACCOUNT_DISABLED') {
      return sendError(res, 'Account has been disabled', 'ACCOUNT_DISABLED', null, 403);
    }

    return sendError(res, 'Login failed', 'LOGIN_FAILED', error.message, 500);
  }
}

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', 'TOKEN_REQUIRED', null, 400);
    }

    const tokens = await authService.refreshAccessToken(refreshToken);

    return sendSuccess(
      res,
      {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      'Token refreshed successfully!',
    );
  } catch (error: any) {
    logger.error('Token refresh error:', error);

    if (error.message === 'TOKEN_EXPIRED') {
      return sendError(res, 'Refresh token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    if (error.message === 'INVALID_TOKEN') {
      return sendError(res, 'Invalid refresh token', 'INVALID_TOKEN', null, 401);
    }

    return sendError(res, 'Token refresh failed', 'REFRESH_FAILED', error.message, 500);
  }
}

/**
 * Logout user (client should discard tokens)
 * POST /api/auth/logout
 */
export async function logoutHandler(_req: Request, res: Response) {
  // For now, logout is handled client-side by discarding tokens
  // In the future, we can implement token blacklisting with Redis
  return sendSuccess(res, {}, 'Logged out successfully!');
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 'EMAIL_REQUIRED', null, 400);
    }

    await authService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    return sendSuccess(res, {}, 'If your email is registered, you will receive a password reset link.');
  } catch (error: any) {
    logger.error('Password reset request error:', error);

    if (error.message === 'EMAIL_SEND_FAILED') {
      return sendError(res, 'Failed to send reset email', 'EMAIL_SEND_FAILED', null, 500);
    }

    // Still return success to prevent email enumeration
    return sendSuccess(res, {}, 'If your email is registered, you will receive a password reset link.');
  }
}

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 'Token and new password are required', 'MISSING_FIELDS', null, 400);
    }

    await authService.resetPassword(token, newPassword);

    return sendSuccess(res, {}, 'Password reset successfully!');
  } catch (error: any) {
    logger.error('Password reset error:', error);

    if (error.message === 'TOKEN_EXPIRED') {
      return sendError(res, 'Reset token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    if (error.message === 'INVALID_TOKEN' || error.message === 'INVALID_TOKEN_TYPE') {
      return sendError(res, 'Invalid reset token', 'INVALID_TOKEN', null, 401);
    }

    return sendError(res, 'Password reset failed', 'RESET_FAILED', error.message, 500);
  }
}

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
export async function resendVerificationHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Email is required', 'EMAIL_REQUIRED', null, 400);
    }

    await authService.resendVerificationEmail(email);

    return sendSuccess(res, {}, 'Verification email sent!');
  } catch (error: any) {
    logger.error('Resend verification error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      return sendError(res, 'User not found', 'USER_NOT_FOUND', null, 404);
    }
    if (error.message === 'EMAIL_ALREADY_VERIFIED') {
      return sendError(res, 'Email is already verified', 'EMAIL_ALREADY_VERIFIED', null, 400);
    }
    if (error.message === 'EMAIL_SEND_FAILED') {
      return sendError(res, 'Failed to send verification email', 'EMAIL_SEND_FAILED', null, 500);
    }

    return sendError(res, 'Failed to resend verification email', 'RESEND_FAILED', error.message, 500);
  }
}

