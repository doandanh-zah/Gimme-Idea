import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ApiResponse, User } from "../shared/types";

interface UserStats {
  reputation: number;
  ideasCount: number;
  projectsCount: number;
  feedbackCount: number;
  tipsReceived: number;
  likesReceived: number;
  votesReceived: number; // Total votes on user's ideas
}

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) { }

  /**
   * Get user by username or slug
   */
  async findByUsername(username: string): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();

    // First try to find by slug (clean URL)
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("slug", username)
      .single();

    // If not found by slug, try by exact username
    if (error || !user) {
      const result = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

      user = result.data;
      error = result.error;
    }

    // If still not found, try case-insensitive search
    if (error || !user) {
      const result = await supabase
        .from("users")
        .select("*")
        .ilike("username", username)
        .single();

      user = result.data;
      error = result.error;
    }

    if (error || !user) {
      throw new NotFoundException("User not found");
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      slug: user.slug,
      reputationScore: user.reputation_score || 0,
      balance: user.balance || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateProfileDto
  ): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if username is taken (if updating username)
    if (updateDto.username) {
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", updateDto.username)
        .neq("id", userId)
        .single();

      if (existing) {
        throw new BadRequestException("Username already taken");
      }
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({
        username: updateDto.username,
        bio: updateDto.bio,
        avatar: updateDto.avatar,
        cover_image: updateDto.coverImage,
        social_links: updateDto.socialLinks,
      })
      .eq("id", userId)
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
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      balance: user.balance || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
      message: "Profile updated successfully",
    };
  }

  /**
   * Get user's projects
   */
  async getUserProjects(username: string): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get user first
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get user's projects
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return {
      success: true,
      data: projects,
    };
  }

  /**
   * Get user stats (reputation, ideas count, projects count, feedback count)
   * Reputation is calculated based on:
   * - Ideas published: +10 points each
   * - Comments/Feedback given: +2 points each
   * - Likes received on comments: +1 point each
   * - Tips received: +5 points per tip transaction
   */
  async getUserStats(username: string): Promise<ApiResponse<UserStats>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get user first
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, wallet, balance")
      .eq("username", username)
      .single();

    if (userError || !user) {
      throw new NotFoundException("User not found");
    }

    // Get ideas count (type = 'idea')
    const { count: ideasCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("type", "idea");

    // Get projects count (type = 'project') - currently locked, but still track
    const { count: projectsCount } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id)
      .eq("type", "project");

    // Get feedback/comments count (total comments this user has made)
    const { count: feedbackCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // Get total likes received on user's comments
    const { data: userComments } = await supabase
      .from("comments")
      .select("id, likes")
      .eq("user_id", user.id);

    const likesReceived =
      userComments?.reduce((sum, c) => sum + (c.likes || 0), 0) || 0;

    // Get total votes received on user's ideas/projects
    const { data: userProjects } = await supabase
      .from("projects")
      .select("id, votes")
      .eq("author_id", user.id);

    const votesReceived =
      userProjects?.reduce((sum, p) => sum + (p.votes || 0), 0) || 0;

    // Get tips received count (transactions where user received tips)
    const { count: tipsCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("to_wallet", user.wallet)
      .eq("type", "tip")
      .eq("status", "confirmed");

    // Calculate reputation score
    // Formula:
    // - Ideas: 10 points each
    // - Feedback given: 2 points each
    // - Likes received: 1 point each
    // - Tips received: 5 points per transaction
    const reputation =
      (ideasCount || 0) * 10 +
      (feedbackCount || 0) * 2 +
      likesReceived * 1 +
      (tipsCount || 0) * 5;

    // Update reputation_score in database
    await supabase
      .from("users")
      .update({ reputation_score: reputation })
      .eq("id", user.id);

    return {
      success: true,
      data: {
        reputation,
        ideasCount: ideasCount || 0,
        projectsCount: projectsCount || 0,
        feedbackCount: feedbackCount || 0,
        tipsReceived: tipsCount || 0,
        likesReceived,
        votesReceived,
      },
    };
  }

  /**
   * Search users by username
   */
  async searchUsers(
    query: string,
    excludeUserIds?: string[],
    limit: number = 10
  ): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    let dbQuery = supabase
      .from("users")
      .select("id, username, avatar, bio, reputation_score")
      .ilike("username", `%${query.trim()}%`)
      .order("reputation_score", { ascending: false })
      .limit(limit);

    // Exclude specific user IDs (e.g., current team members)
    if (excludeUserIds && excludeUserIds.length > 0) {
      dbQuery = dbQuery.not("id", "in", `(${excludeUserIds.join(",")})`);
    }

    const { data: users, error } = await dbQuery;

    if (error) {
      console.error("Search users error:", error);
      return { success: true, data: [] };
    }

    return {
      success: true,
      data: users?.map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        reputationScore: u.reputation_score || 0,
      })) || [],
    };
  }
}
