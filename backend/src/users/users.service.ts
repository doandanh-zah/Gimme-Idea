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

    // Read cached counters from the users table instead of recounting
    // projects/comments/transactions on every profile view.
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        reputation_score,
        ideas_count,
        projects_count,
        feedback_count,
        tips_received_count,
        likes_received_count,
        votes_received_count
      `)
      .eq("username", username)
      .single();

    if (userError || !user) {
      throw new NotFoundException("User not found");
    }

    const ideasCount = user.ideas_count || 0;
    const projectsCount = user.projects_count || 0;
    const feedbackCount = user.feedback_count || 0;
    const tipsReceived = user.tips_received_count || 0;
    const likesReceived = user.likes_received_count || 0;
    const votesReceived = user.votes_received_count || 0;

    // Calculate reputation from cached counters.
    const reputation =
      ideasCount * 10 +
      feedbackCount * 2 +
      likesReceived * 1 +
      tipsReceived * 5;

    // Keep the stored reputation score aligned with the cached counters.
    await supabase
      .from("users")
      .update({ reputation_score: reputation })
      .eq("id", user.id);

    return {
      success: true,
      data: {
        reputation,
        ideasCount,
        projectsCount,
        feedbackCount,
        tipsReceived,
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

  /**
   * Get user's announcements
   */
  async getAnnouncements(userId: string): Promise<ApiResponse<any[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: announcements, error } = await supabase
      .from("user_announcements")
      .select("*")
      .eq("user_id", userId)
      .eq("is_dismissed", false)
      .or("expires_at.is.null,expires_at.gt.now()")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get announcements error:", error);
      return { success: true, data: [] };
    }

    return {
      success: true,
      data: announcements?.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        message: a.message,
        referenceType: a.reference_type,
        referenceId: a.reference_id,
        actionUrl: a.action_url,
        actionLabel: a.action_label,
        priority: a.priority,
        isRead: a.is_read,
        createdAt: a.created_at,
        expiresAt: a.expires_at,
        metadata: a.metadata,
      })) || [],
    };
  }

  /**
   * Mark announcement as read
   */
  async markAnnouncementRead(userId: string, announcementId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("user_announcements")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", announcementId)
      .eq("user_id", userId);

    if (error) {
      console.error("Mark announcement read error:", error);
      throw new BadRequestException("Failed to mark announcement as read");
    }

    return { success: true };
  }

  /**
   * Dismiss announcement
   */
  async dismissAnnouncement(userId: string, announcementId: string): Promise<ApiResponse<void>> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase
      .from("user_announcements")
      .update({ is_dismissed: true })
      .eq("id", announcementId)
      .eq("user_id", userId);

    if (error) {
      console.error("Dismiss announcement error:", error);
      throw new BadRequestException("Failed to dismiss announcement");
    }

    return { success: true };
  }

  async consumeIdeaView(userId: string): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase.rpc("consume_idea_view", {
      p_user_id: userId,
    });

    if (error) {
      throw new BadRequestException("Failed to check daily idea view limit");
    }

    return { success: true, data };
  }

  async getMonetizationStatus(userId: string): Promise<ApiResponse<any>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user } = await supabase
      .from("users")
      .select("plan_tier, plan_expires_at")
      .eq("id", userId)
      .single();

    const { data: credits } = await supabase
      .from("user_ai_credits")
      .select("paid_credits")
      .eq("user_id", userId)
      .single();

    const today = new Date().toISOString().slice(0, 10);
    const { data: usage } = await supabase
      .from("user_daily_usage")
      .select("idea_views, ai_questions")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .single();

    const planTier = user?.plan_tier || "free";
    const planActive =
      !user?.plan_expires_at || new Date(user.plan_expires_at) > new Date();
    const effectivePlan =
      planActive && ["pro5", "pro10"].includes(planTier) ? planTier : "free";

    return {
      success: true,
      data: {
        planTier: effectivePlan,
        planExpiresAt: user?.plan_expires_at || null,
        dailyIdeaViewsUsed: usage?.idea_views || 0,
        dailyIdeaViewsLimit: effectivePlan === "free" ? 5 : -1,
        dailyAIQuestionsUsed: usage?.ai_questions || 0,
        dailyAIFreeLimit: effectivePlan === "pro10" ? -1 : 2,
        paidQuestionCredits: credits?.paid_credits || 0,
        questionPackSize: 5,
      },
    };
  }
}
