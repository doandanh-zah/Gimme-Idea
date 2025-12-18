import { Controller, Get, Patch, Body, Param, UseGuards, Query } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { ApiResponse, User } from "../shared/types";

interface UserStats {
  reputation: number;
  ideasCount: number;
  projectsCount: number;
  feedbackCount: number;
  tipsReceived: number;
  likesReceived: number;
}

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) { }

  /**
   * GET /api/users/search?q=xxx
   * Search users by username (for invite feature)
   */
  @Get("search")
  @UseGuards(AuthGuard)
  async searchUsers(
    @Query("q") query: string,
    @Query("exclude") exclude?: string,
    @Query("limit") limit?: number
  ): Promise<ApiResponse<any[]>> {
    const excludeIds = exclude ? exclude.split(",") : [];
    return this.usersService.searchUsers(query, excludeIds, limit || 10);
  }

  /**
   * GET /api/users/:username
   * Get user by username (public)
   */
  @Get(":username")
  async findByUsername(
    @Param("username") username: string
  ): Promise<ApiResponse<User>> {
    return this.usersService.findByUsername(username);
  }

  /**
   * GET /api/users/:username/stats
   * Get user's stats including reputation, ideas count, projects count, feedback count
   */
  @Get(":username/stats")
  async getUserStats(
    @Param("username") username: string
  ): Promise<ApiResponse<UserStats>> {
    return this.usersService.getUserStats(username);
  }

  /**
   * GET /api/users/:username/projects
   * Get user's projects
   */
  @Get(":username/projects")
  async getUserProjects(
    @Param("username") username: string
  ): Promise<ApiResponse<any[]>> {
    return this.usersService.getUserProjects(username);
  }

  /**
   * PATCH /api/users/profile
   * Update current user's profile (requires authentication)
   */
  @Patch("profile")
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser("userId") userId: string,
    @Body() updateDto: UpdateProfileDto
  ): Promise<ApiResponse<User>> {
    return this.usersService.updateProfile(userId, updateDto);
  }
}
