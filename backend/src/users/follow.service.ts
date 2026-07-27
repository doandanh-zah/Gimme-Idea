import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { ApiResponse } from "../shared/types";
import { FollowUser, FollowStats, GetFollowersDto } from "./dto/follow.dto";

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  constructor(private supabaseService: SupabaseService) {}

  private async addCurrentUserFollowStatus(
    users: FollowUser[],
    currentUserId?: string
  ): Promise<FollowUser[]> {
    if (!currentUserId || users.length === 0) {
      return users.map((user) => ({ ...user, isFollowing: false }));
    }

    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId)
      .in("following_id", users.map((user) => user.userId));

    if (error) {
      this.logger.warn(`Failed to batch follow status: ${error.message}`);
      // Fail closed: same shape as anonymous viewers
      return users.map((user) => ({ ...user, isFollowing: false }));
    }

    const followingIds = new Set((data || []).map((row) => row.following_id));
    return users.map((user) => ({
      ...user,
      isFollowing: followingIds.has(user.userId),
    }));
  }

  /**
   * Follow a user
   */
  async followUser(
    followerId: string,
    followingId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if target user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", followingId)
      .single();

    if (!targetUser) {
      throw new NotFoundException("User not found");
    }

    // Call database function
    const { data, error } = await supabase.rpc("follow_user", {
      p_follower_id: followerId,
      p_following_id: followingId,
    });

    if (error) {
      this.logger.error("Failed to follow user", error);
      throw new BadRequestException(error.message);
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error,
      };
    }

    this.logger.log(`User ${followerId} followed user ${followingId}`);

    return {
      success: true,
      data: { message: data.message },
      message: `Now following ${targetUser.username}`,
    };
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(
    followerId: string,
    followingId: string
  ): Promise<ApiResponse<{ message: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Call database function
    const { data, error } = await supabase.rpc("unfollow_user", {
      p_follower_id: followerId,
      p_following_id: followingId,
    });

    if (error) {
      this.logger.error("Failed to unfollow user", error);
      throw new BadRequestException(error.message);
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error,
      };
    }

    this.logger.log(`User ${followerId} unfollowed user ${followingId}`);

    return {
      success: true,
      data: { message: data.message },
      message: "Unfollowed successfully",
    };
  }

  /**
   * Check if user A follows user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc("is_following", {
      p_follower_id: followerId,
      p_following_id: followingId,
    });

    if (error) {
      this.logger.error("Failed to check follow status", error);
      return false;
    }

    return data;
  }

  /**
   * Get follow stats for a user (including relationship with current user)
   */
  async getFollowStats(
    targetUserId: string,
    currentUserId?: string
  ): Promise<ApiResponse<FollowStats>> {
    const supabase = this.supabaseService.getAdminClient();

    // Get user's follower/following counts
    const { data: user, error } = await supabase
      .from("users")
      .select("followers_count, following_count")
      .eq("id", targetUserId)
      .single();

    if (error || !user) {
      throw new NotFoundException("User not found");
    }

    let isFollowing = false;
    let isFollowedBy = false;

    // If current user is logged in, check relationship
    if (currentUserId && currentUserId !== targetUserId) {
      const [followingResult, followedByResult] = await Promise.all([
        this.isFollowing(currentUserId, targetUserId),
        this.isFollowing(targetUserId, currentUserId),
      ]);
      isFollowing = followingResult;
      isFollowedBy = followedByResult;
    }

    return {
      success: true,
      data: {
        followersCount: user.followers_count || 0,
        followingCount: user.following_count || 0,
        isFollowing,
        isFollowedBy,
      },
    };
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string,
    query: GetFollowersDto,
    currentUserId?: string
  ): Promise<ApiResponse<FollowUser[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc("get_followers", {
      p_user_id: userId,
      p_limit: query.limit || 20,
      p_offset: query.offset || 0,
    });

    if (error) {
      this.logger.error("Failed to get followers", error);
      throw new BadRequestException("Failed to get followers");
    }

    const followers: FollowUser[] = data.map((f: any) => ({
      userId: f.user_id,
      username: f.username,
      avatar: f.avatar,
      bio: f.bio,
      wallet: f.wallet,
      followersCount: f.followers_count || 0,
      followingCount: f.following_count || 0,
      followedAt: f.followed_at,
      isFollowingBack: f.is_following_back,
    }));

    return {
      success: true,
      data: await this.addCurrentUserFollowStatus(followers, currentUserId),
    };
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    query: GetFollowersDto,
    currentUserId?: string
  ): Promise<ApiResponse<FollowUser[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc("get_following", {
      p_user_id: userId,
      p_limit: query.limit || 20,
      p_offset: query.offset || 0,
    });

    if (error) {
      this.logger.error("Failed to get following", error);
      throw new BadRequestException("Failed to get following");
    }

    const following: FollowUser[] = data.map((f: any) => ({
      userId: f.user_id,
      username: f.username,
      avatar: f.avatar,
      bio: f.bio,
      wallet: f.wallet,
      followersCount: f.followers_count || 0,
      followingCount: f.following_count || 0,
      followedAt: f.followed_at,
    }));

    return {
      success: true,
      data: await this.addCurrentUserFollowStatus(following, currentUserId),
    };
  }

  /**
   * Get mutual followers (users who follow each other)
   */
  async getMutualFollowers(
    userId: string,
    query: GetFollowersDto
  ): Promise<ApiResponse<FollowUser[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase.rpc("get_mutual_followers", {
      p_user_id: userId,
      p_limit: query.limit || 20,
      p_offset: query.offset || 0,
    });

    if (error) {
      this.logger.error("Failed to get mutual followers", error);
      throw new BadRequestException("Failed to get mutual followers");
    }

    const mutuals: FollowUser[] = data.map((f: any) => ({
      userId: f.user_id,
      username: f.username,
      avatar: f.avatar,
      wallet: f.wallet,
      followersCount: 0,
      followingCount: 0,
      followedAt: "",
    }));

    return {
      success: true,
      data: mutuals,
    };
  }
}
