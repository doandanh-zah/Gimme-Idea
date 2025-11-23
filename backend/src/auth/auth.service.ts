import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { SolanaService } from '../shared/solana.service';
import { SupabaseService } from '../shared/supabase.service';
import { LoginDto } from './dto/login.dto';
import { ApiResponse, User } from '../shared/types';

@Injectable()
export class AuthService {
  constructor(
    private solanaService: SolanaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService,
  ) {}

  /**
   * Login with Solana wallet signature (SIWS - Sign In With Solana)
   */
  async login(loginDto: LoginDto): Promise<ApiResponse<{ token: string; user: User }>> {
    const { publicKey, signature, message } = loginDto;

    // 1. Verify Solana signature
    const isValid = this.solanaService.verifySignature(publicKey, signature, message);
    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // 2. Check if user exists in database
    const supabase = this.supabaseService.getAdminClient();
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', publicKey)
      .single();

    // 3. If user doesn't exist, create new user
    if (error || !user) {
      const newUser = {
        wallet: publicKey,
        username: `user_${publicKey.slice(0, 8)}`,
        reputation_score: 0,
        login_count: 1,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      user = createdUser;
    } else {
      // 3b. If user exists, update last login time and increment login count
      const { error: updateError } = await supabase.rpc('increment_login_count', {
        user_id: user.id,
      });

      if (updateError) {
        console.warn('Failed to update login info:', updateError.message);
        // Don't throw error, just log warning and continue
      }

      // Fetch updated user data
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (updatedUser) {
        user = updatedUser;
      }
    }

    // 4. Generate JWT token
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpires = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    // 5. Map database user to User type
    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
    };

    return {
      success: true,
      data: {
        token,
        user: userResponse,
      },
      message: 'Login successful',
    };
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(userId: string): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('User not found');
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
    };

    return {
      success: true,
      data: userResponse,
    };
  }
}
