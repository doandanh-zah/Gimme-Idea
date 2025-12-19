import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  AdminService,
  CreateHackathonDto,
  ScoreSubmissionDto,
} from "./admin.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { ApiResponse } from "../shared/types";

@Controller("admin")
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ============================================
  // ADMIN STATUS
  // ============================================

  /**
   * GET /api/admin/status
   * Check if current user is admin
   */
  @Get("status")
  @UseGuards(AuthGuard)
  async getAdminStatus(
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ isAdmin: boolean; role: string }>> {
    const result = await this.adminService.getUserRole(userId);
    return {
      success: true,
      data: result,
    };
  }

  // ============================================
  // PROJECT MANAGEMENT
  // ============================================

  /**
   * DELETE /api/admin/projects/:id
   * Admin delete any project
   */
  @Delete("projects/:id")
  @UseGuards(AuthGuard)
  async deleteProject(
    @Param("id") projectId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<void>> {
    return this.adminService.adminDeleteProject(userId, projectId);
  }

  /**
   * POST /api/admin/projects/:id/verify
   * Admin verify a project
   */
  @Post("projects/:id/verify")
  @UseGuards(AuthGuard)
  async verifyProject(
    @Param("id") projectId: string,
    @CurrentUser("userId") userId: string,
    @Body("verified") verified: boolean
  ): Promise<ApiResponse<void>> {
    return this.adminService.verifyProject(userId, projectId, verified ?? true);
  }

  // ============================================
  // HACKATHON MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/hackathons
   * Get all hackathons (admin view with more details)
   */
  @Get("hackathons")
  async getAllHackathons() {
    return this.adminService.getAllHackathons();
  }

  /**
   * POST /api/admin/hackathons
   * Create a new hackathon
   */
  @Post("hackathons")
  @UseGuards(AuthGuard)
  async createHackathon(
    @CurrentUser("userId") userId: string,
    @Body() dto: CreateHackathonDto
  ) {
    return this.adminService.createHackathon(userId, dto);
  }

  /**
   * PATCH /api/admin/hackathons/:id
   * Update a hackathon
   */
  @Patch("hackathons/:id")
  @UseGuards(AuthGuard)
  async updateHackathon(
    @Param("id") hackathonId: string,
    @CurrentUser("userId") userId: string,
    @Body() updates: Partial<CreateHackathonDto> & { status?: string }
  ) {
    return this.adminService.updateHackathon(userId, hackathonId, updates);
  }

  /**
   * DELETE /api/admin/hackathons/:id
   * Delete a hackathon
   */
  @Delete("hackathons/:id")
  @UseGuards(AuthGuard)
  async deleteHackathon(
    @Param("id") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.adminService.deleteHackathon(userId, hackathonId);
  }

  // ============================================
  // HACKATHON SUBMISSIONS & SCORING
  // ============================================

  /**
   * GET /api/admin/hackathons/:id/submissions
   * Get all submissions for a hackathon (for admin scoring)
   */
  @Get("hackathons/:id/submissions")
  async getSubmissions(@Param("id") hackathonId: string) {
    return this.adminService.getHackathonSubmissions(hackathonId);
  }

  /**
   * POST /api/admin/submissions/:id/score
   * Score a hackathon submission
   */
  @Post("submissions/:id/score")
  @UseGuards(AuthGuard)
  async scoreSubmission(
    @Param("id") submissionId: string,
    @CurrentUser("userId") userId: string,
    @Body() scoreDto: ScoreSubmissionDto
  ) {
    return this.adminService.scoreSubmission(userId, submissionId, scoreDto);
  }

  /**
   * PATCH /api/admin/submissions/:id/status
   * Update submission status (winner, finalist, rejected)
   */
  @Patch("submissions/:id/status")
  @UseGuards(AuthGuard)
  async updateSubmissionStatus(
    @Param("id") submissionId: string,
    @CurrentUser("userId") userId: string,
    @Body("status")
    status: "pending" | "approved" | "rejected" | "winner" | "finalist"
  ) {
    return this.adminService.updateSubmissionStatus(
      userId,
      submissionId,
      status
    );
  }

  // ============================================
  // ACTIVITY LOG
  // ============================================

  /**
   * GET /api/admin/activity
   * Get admin activity log
   */
  @Get("activity")
  @UseGuards(AuthGuard)
  async getActivityLog(
    @CurrentUser("userId") userId: string,
    @Query("limit") limit?: number
  ) {
    return this.adminService.getAdminActivityLog(userId, limit || 50);
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/users
   * Get all users
   */
  @Get("users")
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * POST /api/admin/users/:id/ban
   * Ban a user
   */
  @Post("users/:id/ban")
  @UseGuards(AuthGuard)
  async banUser(
    @Param("id") targetUserId: string,
    @CurrentUser("userId") adminUserId: string
  ) {
    return this.adminService.banUser(adminUserId, targetUserId);
  }

  /**
   * POST /api/admin/users/:id/unban
   * Unban a user
   */
  @Post("users/:id/unban")
  @UseGuards(AuthGuard)
  async unbanUser(
    @Param("id") targetUserId: string,
    @CurrentUser("userId") adminUserId: string
  ) {
    return this.adminService.unbanUser(adminUserId, targetUserId);
  }

  /**
   * POST /api/admin/users/:id/admin
   * Toggle admin status
   */
  @Post("users/:id/admin")
  @UseGuards(AuthGuard)
  async toggleAdmin(
    @Param("id") targetUserId: string,
    @CurrentUser("userId") adminUserId: string,
    @Body("isAdmin") isAdmin: boolean
  ) {
    return this.adminService.setUserAdmin(adminUserId, targetUserId, isAdmin);
  }

  // ============================================
  // SYSTEM STATS
  // ============================================

  /**
   * GET /api/admin/stats
   * Get system-wide statistics
   */
  @Get("stats")
  async getSystemStats() {
    return this.adminService.getSystemStats();
  }
}
