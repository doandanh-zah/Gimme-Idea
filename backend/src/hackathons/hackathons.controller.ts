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
    constructor(private readonly hackathonsService: HackathonsService) { }

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
        return this.hackathonsService.getSubmissions(query, userId);
    }

    /**
     * Get single submission
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
     * Create a new submission
     * POST /hackathons/submissions
     */
    @Post("submissions")
    @UseGuards(AuthGuard)
    async createSubmission(
        @Body() dto: CreateSubmissionDto,
        @CurrentUser("userId") userId: string
    ) {
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
        return this.hackathonsService.isRegistered(hackathonId, userId);
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
}
