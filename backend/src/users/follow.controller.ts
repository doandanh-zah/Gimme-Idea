import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FollowService } from "./follow.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { RequirePatScope } from "../common/decorators/require-pat-scope.decorator";
import { CurrentUser } from "../common/decorators/user.decorator";
import { GetFollowersDto } from "./dto/follow.dto";
import { PatScopeGuard } from "../common/guards/pat-scope.guard";
import { ApiResponse } from "../shared/types";

@Controller("users")
export class FollowController {
  constructor(private followService: FollowService) {}

  /**
   * POST /api/users/:userId/follow
   * Follow a user
   */
  @Post(":userId/follow")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("social:write")
  async followUser(
    @CurrentUser("userId") currentUserId: string,
    @Param("userId") userId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.followService.followUser(currentUserId, userId);
  }

  /**
   * DELETE /api/users/:userId/follow
   * Unfollow a user
   */
  @Delete(":userId/follow")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("social:write")
  async unfollowUser(
    @CurrentUser("userId") currentUserId: string,
    @Param("userId") userId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.followService.unfollowUser(currentUserId, userId);
  }

  /**
   * GET /api/users/:userId/follow-stats
   * Get follow stats for a user
   */
  @Get(":userId/follow-stats")
  async getFollowStats(
    @Param("userId") userId: string,
    @CurrentUser("userId") currentUserId?: string
  ): Promise<ApiResponse<any>> {
    return this.followService.getFollowStats(userId, currentUserId);
  }

  /**
   * GET /api/users/:userId/followers
   * Get followers of a user
   */
  @Get(":userId/followers")
  async getFollowers(
    @Param("userId") userId: string,
    @Query() query: GetFollowersDto,
    @CurrentUser("userId") currentUserId?: string
  ): Promise<ApiResponse<any>> {
    return this.followService.getFollowers(userId, query, currentUserId);
  }

  /**
   * GET /api/users/:userId/following
   * Get users that a user is following
   */
  @Get(":userId/following")
  async getFollowing(
    @Param("userId") userId: string,
    @Query() query: GetFollowersDto
  ): Promise<ApiResponse<any>> {
    return this.followService.getFollowing(userId, query);
  }

  /**
   * GET /api/users/:userId/mutuals
   * Get mutual followers
   */
  @Get(":userId/mutuals")
  async getMutualFollowers(
    @Param("userId") userId: string,
    @Query() query: GetFollowersDto
  ): Promise<ApiResponse<any>> {
    return this.followService.getMutualFollowers(userId, query);
  }

  /**
   * GET /api/users/:userId/is-following/:targetId
   * Check if user follows another user
   */
  @Get(":userId/is-following/:targetId")
  async isFollowing(
    @Param("userId") userId: string,
    @Param("targetId") targetId: string
  ): Promise<ApiResponse<{ isFollowing: boolean }>> {
    const isFollowing = await this.followService.isFollowing(userId, targetId);
    return {
      success: true,
      data: { isFollowing },
    };
  }
}
