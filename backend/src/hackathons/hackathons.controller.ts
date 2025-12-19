import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { HackathonsService } from "./hackathons.service";
import {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  QuerySubmissionsDto,
} from "./dto/submission.dto";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";

@Controller("hackathons")
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  /**
   * Get all public hackathons (non-draft)
   * GET /hackathons
   */
  @Get()
  async getAllHackathons() {
    return this.hackathonsService.getPublicHackathons();
  }

  /**
   * Get single submission - MUST be before :idOrSlug route
   * GET /hackathons/submissions/:id
   */
  @Get("submissions/:id")
  async getSubmission(
    @Param("id") id: string,
    @CurrentUser("userId") userId?: string
  ) {
    return this.hackathonsService.getSubmissionById(id, userId);
  }

  /**
   * Get a single hackathon by slug or ID
   * GET /hackathons/:idOrSlug
   */
  @Get(":idOrSlug")
  async getHackathon(@Param("idOrSlug") idOrSlug: string) {
    // Exclude submissions path
    if (idOrSlug === "submissions") {
      return { success: false, error: "Invalid hackathon ID" };
    }
    return this.hackathonsService.getHackathonBySlug(idOrSlug);
  }

  // =============================================
  // SUBMISSIONS
  // =============================================

  /**
   * Get all submissions for a hackathon
   * GET /hackathons/:hackathonId/submissions
   */
  @Get(":hackathonId/submissions")
  async getSubmissions(
    @Param("hackathonId") hackathonId: string,
    @Query() query: QuerySubmissionsDto,
    @CurrentUser("userId") userId?: string
  ) {
    query.hackathonId = hackathonId;
    // If mine=true, filter by current user
    if (query.mine === "true" && userId) {
      query.userId = userId;
    }
    return this.hackathonsService.getSubmissions(query, userId);
  }

  /**
   * Create a new submission
   * POST /hackathons/submissions
   */
  @Post("submissions")
  @UseGuards(AuthGuard)
  async createSubmission(
    @Body() dto: CreateSubmissionDto,
    @CurrentUser("userId") userId: string
  ) {
    console.log("[HackathonsController] createSubmission called with:", {
      dto,
      userId,
    });
    return this.hackathonsService.createSubmission(dto, userId);
  }

  /**
   * Update a submission
   * PUT /hackathons/submissions/:id
   */
  @Put("submissions/:id")
  @UseGuards(AuthGuard)
  async updateSubmission(
    @Param("id") id: string,
    @Body() dto: UpdateSubmissionDto,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.updateSubmission(id, dto, userId);
  }

  /**
   * Delete a submission
   * DELETE /hackathons/submissions/:id
   */
  @Delete("submissions/:id")
  @UseGuards(AuthGuard)
  async deleteSubmission(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.deleteSubmission(id, userId);
  }

  /**
   * Vote for a submission
   * POST /hackathons/submissions/:id/vote
   */
  @Post("submissions/:id/vote")
  @UseGuards(AuthGuard)
  async voteSubmission(
    @Param("id") id: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.voteSubmission(id, userId);
  }

  // =============================================
  // REGISTRATION
  // =============================================

  /**
   * Register for a hackathon
   * POST /hackathons/:hackathonId/register
   */
  @Post(":hackathonId/register")
  @UseGuards(AuthGuard)
  async registerForHackathon(
    @Param("hackathonId") hackathonId: string,
    @Body() body: { teamName?: string },
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.registerForHackathon(
      hackathonId,
      userId,
      body.teamName
    );
  }

  /**
   * Check if user is registered
   * GET /hackathons/:hackathonId/registration
   */
  @Get(":hackathonId/registration")
  @UseGuards(AuthGuard)
  async checkRegistration(
    @Param("hackathonId") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.getMyRegistration(hackathonId, userId);
  }

  /**
   * Get all participants for a hackathon
   * GET /hackathons/:hackathonId/participants
   */
  @Get(":hackathonId/participants")
  async getParticipants(
    @Param("hackathonId") hackathonId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.hackathonsService.getHackathonParticipants(
      hackathonId,
      limit || 50,
      offset || 0
    );
  }

  // =============================================
  // STATS
  // =============================================

  /**
   * Get hackathon statistics
   * GET /hackathons/:hackathonId/stats
   */
  @Get(":hackathonId/stats")
  async getHackathonStats(@Param("hackathonId") hackathonId: string) {
    return this.hackathonsService.getHackathonStats(hackathonId);
  }

  /**
   * Get user's submissions for a hackathon
   * GET /hackathons/:hackathonId/my-submissions
   */
  @Get(":hackathonId/my-submissions")
  @UseGuards(AuthGuard)
  async getMySubmissions(
    @Param("hackathonId") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.getSubmissions(
      { hackathonId, userId },
      userId
    );
  }

  // =============================================
  // TEAMS
  // =============================================

  /**
   * Get all teams in a hackathon
   * GET /hackathons/:hackathonId/teams
   */
  @Get(":hackathonId/teams")
  async getHackathonTeams(
    @Param("hackathonId") hackathonId: string,
    @Query("search") search?: string,
    @Query("isOpen") isOpen?: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    return this.hackathonsService.getHackathonTeams(hackathonId, {
      search,
      isOpen: isOpen === "true" ? true : isOpen === "false" ? false : undefined,
      limit,
      offset,
    });
  }

  /**
   * Get user's team in a hackathon
   * GET /hackathons/:hackathonId/my-team
   */
  @Get(":hackathonId/my-team")
  @UseGuards(AuthGuard)
  async getMyTeam(
    @Param("hackathonId") hackathonId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.getMyTeam(hackathonId, userId);
  }

  /**
   * Create a team in a hackathon
   * POST /hackathons/:hackathonId/teams
   */
  @Post(":hackathonId/teams")
  @UseGuards(AuthGuard)
  async createTeam(
    @Param("hackathonId") hackathonId: string,
    @Body()
    body: {
      name: string;
      description?: string;
      avatarUrl?: string;
      maxMembers?: number;
      isOpen?: boolean;
    },
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.createTeam(hackathonId, userId, body);
  }

  /**
   * Get team by ID
   * GET /hackathons/teams/:teamId
   */
  @Get("teams/:teamId")
  async getTeamById(
    @Param("teamId") teamId: string,
    @CurrentUser("userId") userId?: string
  ) {
    return this.hackathonsService.getTeamById(teamId, userId);
  }

  /**
   * Update a team
   * PUT /hackathons/teams/:teamId
   */
  @Put("teams/:teamId")
  @UseGuards(AuthGuard)
  async updateTeam(
    @Param("teamId") teamId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      maxMembers?: number;
      isOpen?: boolean;
    },
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.updateTeam(teamId, userId, body);
  }

  /**
   * Delete a team
   * DELETE /hackathons/teams/:teamId
   */
  @Delete("teams/:teamId")
  @UseGuards(AuthGuard)
  async deleteTeam(
    @Param("teamId") teamId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.deleteTeam(teamId, userId);
  }

  /**
   * Leave a team
   * POST /hackathons/teams/:teamId/leave
   */
  @Post("teams/:teamId/leave")
  @UseGuards(AuthGuard)
  async leaveTeam(
    @Param("teamId") teamId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.leaveTeam(teamId, userId);
  }

  /**
   * Kick a member from team
   * DELETE /hackathons/teams/:teamId/members/:memberId
   */
  @Delete("teams/:teamId/members/:memberId")
  @UseGuards(AuthGuard)
  async kickMember(
    @Param("teamId") teamId: string,
    @Param("memberId") memberId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.kickMember(teamId, memberId, userId);
  }

  // =============================================
  // TEAM INVITES
  // =============================================

  /**
   * Invite a user to team
   * POST /hackathons/teams/:teamId/invite
   */
  @Post("teams/:teamId/invite")
  @UseGuards(AuthGuard)
  async inviteToTeam(
    @Param("teamId") teamId: string,
    @Body() body: { inviteeId: string; message?: string },
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.inviteToTeam(
      teamId,
      userId,
      body.inviteeId,
      body.message
    );
  }

  /**
   * Get user's pending invites
   * GET /hackathons/teams/invites/my
   */
  @Get("teams/invites/my")
  @UseGuards(AuthGuard)
  async getMyInvites(@CurrentUser("userId") userId: string) {
    return this.hackathonsService.getMyInvites(userId);
  }

  /**
   * Accept an invite
   * POST /hackathons/teams/invites/:inviteId/accept
   */
  @Post("teams/invites/:inviteId/accept")
  @UseGuards(AuthGuard)
  async acceptInvite(
    @Param("inviteId") inviteId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.respondToInvite(inviteId, userId, "accept");
  }

  /**
   * Reject an invite
   * POST /hackathons/teams/invites/:inviteId/reject
   */
  @Post("teams/invites/:inviteId/reject")
  @UseGuards(AuthGuard)
  async rejectInvite(
    @Param("inviteId") inviteId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.respondToInvite(inviteId, userId, "reject");
  }

  /**
   * Cancel an invite
   * DELETE /hackathons/teams/invites/:inviteId
   */
  @Delete("teams/invites/:inviteId")
  @UseGuards(AuthGuard)
  async cancelInvite(
    @Param("inviteId") inviteId: string,
    @CurrentUser("userId") userId: string
  ) {
    return this.hackathonsService.cancelInvite(inviteId, userId);
  }
}
