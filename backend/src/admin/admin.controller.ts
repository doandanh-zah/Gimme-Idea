import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { ReviewDaoRequestDto } from "./dto/review-dao-request.dto";
import { ReviewProposalDto } from "./dto/review-proposal.dto";
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

  /**
   * PATCH /api/admin/projects/:id/funding-pool
   * Admin set pool status + governance addresses for Commit-to-Build (Phase 1)
   */
  @Patch("projects/:id/funding-pool")
  @UseGuards(AuthGuard)
  async updateFundingPool(
    @Param("id") projectId: string,
    @CurrentUser("userId") userId: string,
    @Body()
    body: {
      poolStatus?:
        | "draft"
        | "reviewing"
        | "approved_for_pool"
        | "pool_open"
        | "rejected"
        | string;
      governanceRealmAddress?: string | null;
      governanceTreasuryAddress?: string | null;
      governanceReceiptMint?: string | null;
      supportFeeBps?: number | null;
      supportFeeCapUsdc?: number | null;
      supportFeeRecipient?: string | null;
    }
  ): Promise<ApiResponse<void>> {
    return this.adminService.updateProjectFundingPool(userId, projectId, body);
  }

  /**
   * GET /api/admin/dao-requests
   */
  @Get("dao-requests")
  @UseGuards(AuthGuard)
  async listDaoRequests(
    @CurrentUser("userId") userId: string,
    @Query("status") status?: "pending" | "approved" | "rejected"
  ): Promise<ApiResponse<any[]>> {
    return this.adminService.listDaoRequests(userId, status);
  }

  /**
   * PATCH /api/admin/dao-requests/:id/review
   */
  @Patch("dao-requests/:id/review")
  @UseGuards(AuthGuard)
  async reviewDaoRequest(
    @Param("id") requestId: string,
    @CurrentUser("userId") userId: string,
    @Body() body: ReviewDaoRequestDto
  ): Promise<ApiResponse<any>> {
    return this.adminService.reviewDaoRequest(userId, requestId, body);
  }

  @Patch("proposals/:id/review")
  @UseGuards(AuthGuard)
  async reviewProposal(
    @Param("id") proposalId: string,
    @CurrentUser("userId") userId: string,
    @Body() body: ReviewProposalDto
  ): Promise<ApiResponse<any>> {
    return this.adminService.reviewProposal(userId, proposalId, body);
  }

  // ============================================
  // HACKATHON MANAGEMENT
  // ============================================

  /**
   * GET /api/admin/hackathons
   * Get all hackathons (admin view with more details)
   */
  @Get("hackathons")
  @UseGuards(AuthGuard)
  async getAllHackathons(@CurrentUser("userId") userId: string) {
    return this.adminService.getAllHackathons(userId);
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
  @UseGuards(AuthGuard)
  async getSubmissions(
    @Param("id") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.adminService.getHackathonSubmissions(userId, hackathonId);
  }

  /**
   * GET /api/admin/hackathons/:id/rounds
   * Get all rounds for a hackathon
   */
  @Get("hackathons/:id/rounds")
  @UseGuards(AuthGuard)
  async getHackathonRounds(
    @Param("id") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.adminService.getHackathonRounds(userId, hackathonId);
  }

  /**
   * PUT /api/admin/hackathons/:id/rounds
   * Update all rounds for a hackathon
   */
  @Put("hackathons/:id/rounds")
  @UseGuards(AuthGuard)
  async updateHackathonRounds(
    @Param("id") hackathonId: string,
    @CurrentUser("userId") userId: string,
    @Body() body: { rounds: any[] }
  ) {
    return this.adminService.updateHackathonRounds(
      userId,
      hackathonId,
      body.rounds
    );
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
  @UseGuards(AuthGuard)
  async getAllUsers(@CurrentUser("userId") userId: string) {
    return this.adminService.getAllUsers(userId);
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
  @UseGuards(AuthGuard)
  async getSystemStats(@CurrentUser("userId") userId: string) {
    return this.adminService.getSystemStats(userId);
  }
}
