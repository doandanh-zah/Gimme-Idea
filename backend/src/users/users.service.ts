import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiResponse, User } from '../shared/types';

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get user by username
   */
  async findByUsername(username: string): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      throw new NotFoundException('User not found');
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

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileDto): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if username is taken (if updating username)
    if (updateDto.username) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', updateDto.username)
        .neq('id', userId)
        .single();

      if (existing) {
        throw new BadRequestException('Username already taken');
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({
        username: updateDto.username,
        bio: updateDto.bio,
        avatar: updateDto.avatar,
        social_links: updateDto.socialLinks,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
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
      message: 'Profile updated successfully',
    };
  }

  /**
   * Get user's projects
   */
  async getUserProjects(username: string): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get user first
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return {
      success: true,
      data: projects,
    };
  }
}
