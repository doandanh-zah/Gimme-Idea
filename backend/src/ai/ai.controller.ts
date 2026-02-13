import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { AIService } from "./ai.service";
import { AuthGuard } from "../common/guards/auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { ApiResponse } from "../shared/types";

export interface GenerateFeedbackDto {
  projectId: string;
  title: string;
  problem: string;
  solution: string;
  opportunity?: string;
}

export interface GenerateReplyDto {
  projectId: string;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  ideaContext: {
    title: string;
    problem: string;
    solution: string;
  };
}

export interface AutoReplyDto {
  projectId: string;
  parentCommentId: string;
  userQuestion: string;
  previousAIComment: string;
  ideaContext: {
    title: string;
    problem: string;
    solution: string;
    opportunity?: string;
  };
}

export interface FindIdeasDto {
  interest: string;
  strengths: string;
}

export interface ChatDto {
  message: string;
  context: {
    interest: string;
    strengths: string;
  };
  history: Array<{ role: string; content: string }>;
}

@Controller("ai")
export class AIController {
  constructor(private aiService: AIService) { }

  /**
   * POST /api/ai/feedback
   * Generate AI feedback for an idea
   */
  @Post("feedback")
  @UseGuards(AuthGuard)
  async generateFeedback(
    @CurrentUser("userId") userId: string,
    @Body() dto: GenerateFeedbackDto
  ): Promise<ApiResponse<any>> {
    try {
      // Check if user has quota
      const quota = await this.aiService.checkUserAIQuota(
        userId,
        dto.projectId
      );
      if (!quota.canUse) {
        return {
          success: false,
          error: "No AI credits remaining. Please purchase more credits.",
        };
      }

      // Generate feedback
      const feedback = await this.aiService.generateIdeaFeedback({
        title: dto.title,
        problem: dto.problem,
        solution: dto.solution,
        opportunity: dto.opportunity,
      });

      // Track usage
      await this.aiService.trackAIInteraction(
        userId,
        dto.projectId,
        "feedback",
        undefined,
        500 // Approximate tokens
      );

      return {
        success: true,
        data: feedback,
        message: "AI feedback generated successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate feedback",
      };
    }
  }

  /**
   * POST /api/ai/reply
   * Generate AI reply to user comment
   */
  @Post("reply")
  @UseGuards(AuthGuard)
  async generateReply(
    @CurrentUser("userId") userId: string,
    @Body() dto: GenerateReplyDto
  ): Promise<ApiResponse<{ reply: string }>> {
    try {
      // Check if user has quota
      const quota = await this.aiService.checkUserAIQuota(
        userId,
        dto.projectId
      );
      if (!quota.canUse) {
        return {
          success: false,
          error: "No AI credits remaining. Please purchase more credits.",
        };
      }

      // Generate reply
      const reply = await this.aiService.generateReplyToUser(
        dto.userMessage,
        dto.ideaContext,
        undefined, // No previous AI comment for generic reply
        dto.conversationHistory
      );

      // Track usage
      await this.aiService.trackAIInteraction(
        userId,
        dto.projectId,
        "reply",
        undefined,
        200 // Approximate tokens
      );

      return {
        success: true,
        data: { reply },
        message: "AI reply generated successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate reply",
      };
    }
  }

  /**
   * POST /api/ai/market-assessment
   * Generate market assessment for an idea
   */
  @Post("market-assessment")
  @UseGuards(AuthGuard)
  async generateMarketAssessment(
    @CurrentUser("userId") userId: string,
    @Body() dto: GenerateFeedbackDto
  ): Promise<ApiResponse<any>> {
    try {
      const assessment = await this.aiService.generateMarketAssessment({
        title: dto.title,
        problem: dto.problem,
        solution: dto.solution,
        opportunity: dto.opportunity,
      });

      return {
        success: true,
        data: assessment,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate market assessment",
      };
    }
  }

  /**
   * GET /api/ai/quota/:projectId
   * Check user's AI quota for a project
   */
  @Get("quota/:projectId")
  @UseGuards(AuthGuard)
  async checkQuota(
    @CurrentUser("userId") userId: string,
    @Param("projectId") projectId: string
  ): Promise<ApiResponse<any>> {
    try {
      const quota = await this.aiService.checkUserAIQuota(userId, projectId);

      return {
        success: true,
        data: quota,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to check quota",
      };
    }
  }

  /**
   * POST /api/ai/find-ideas
   * Find matching ideas based on user interest and strengths
   */
  @Post("find-ideas")
  async findIdeas(@Body() dto: FindIdeasDto): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.findMatchingIdeas(
        dto.interest,
        dto.strengths
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to find ideas",
      };
    }
  }

  /**
   * POST /api/ai/chat
   * Continue conversation with AI
   */
  @Post("chat")
  async chat(@Body() dto: ChatDto): Promise<ApiResponse<any>> {
    try {
      const reply = await this.aiService.continueConversation(
        dto.message,
        dto.context,
        dto.history
      );

      return {
        success: true,
        data: { reply },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to chat",
      };
    }
  }

  /**
   * POST /api/ai/auto-reply
   * Automatically generate and save AI reply when user replies to an AI comment
   * This creates a new comment in the database
   */
  @Post("auto-reply")
  @UseGuards(AuthGuard)
  async autoReply(
    @CurrentUser("userId") userId: string,
    @Body() dto: AutoReplyDto
  ): Promise<ApiResponse<any>> {
    try {
      // Check if user has quota
      const quota = await this.aiService.checkUserAIQuota(
        userId,
        dto.projectId
      );
      if (!quota.canUse) {
        return {
          success: false,
          error: "No AI credits remaining. Please purchase more credits.",
        };
      }

      // Generate and save AI reply comment
      const result = await this.aiService.createAIReplyComment(
        dto.projectId,
        dto.parentCommentId,
        dto.userQuestion,
        dto.ideaContext,
        dto.previousAIComment
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Failed to create AI reply",
        };
      }

      // If AI decided to skip (not a question/challenge)
      if (result.skipped) {
        return {
          success: true,
          data: { skipped: true, skipReason: result.skipReason },
          message: "AI decided not to reply",
        };
      }

      // Track usage only if AI actually replied
      await this.aiService.trackAIInteraction(
        userId,
        dto.projectId,
        "auto_reply",
        undefined,
        300 // Approximate tokens
      );

      return {
        success: true,
        data: { comment: result.comment, skipped: false },
        message: "AI reply created successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to generate AI reply",
      };
    }
  }

  /**
   * POST /api/ai/backfill-feedback
   * Generate AI feedback for all ideas that don't have AI comments yet
   * Admin only endpoint
   */
  @Post("backfill-feedback")
  async backfillFeedback(): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.backfillMissingAIFeedback();
      return {
        success: true,
        data: result,
        message: `Processed ${result.processed} ideas, ${result.success} successful, ${result.failed} failed`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to backfill AI feedback",
      };
    }
  }

  // =============================================
  // RELATED PROJECTS ENDPOINTS
  // =============================================

  /**
   * POST /api/ai/search-related-projects
   * Search for related projects on the internet using Tavily API
   * Called during idea submission (synchronous)
   */
  @Post("search-related-projects")
  @UseGuards(AuthGuard)
  async searchRelatedProjects(
    @CurrentUser("userId") userId: string,
    @Body()
    dto: {
      ideaId: string;
      title: string;
      problem: string;
      solution: string;
      category?: string;
      tags?: string[];
    }
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.searchRelatedProjects(
        dto.ideaId,
        dto.title,
        dto.problem,
        dto.solution,
        userId,
        dto.category,
        dto.tags,
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          data: { quotaInfo: result.quotaInfo },
        };
      }

      return {
        success: true,
        data: {
          results: result.results,
          quotaInfo: result.quotaInfo,
          aiSummary: result.aiSummary,
          searchMeta: result.searchMeta,
        },
        message: `Found ${result.results?.length || 0} related projects`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to search related projects",
      };
    }
  }

  /**
   * GET /api/ai/related-projects/:ideaId
   * Get all related projects for an idea
   */
  @Get("related-projects/:ideaId")
  async getRelatedProjects(
    @Param("ideaId") ideaId: string
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.getRelatedProjects(ideaId);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get related projects",
      };
    }
  }

  /**
   * POST /api/ai/pin-project
   * Pin user's own project to an idea
   */
  @Post("pin-project")
  @UseGuards(AuthGuard)
  async pinUserProject(
    @CurrentUser("userId") userId: string,
    @Body()
    dto: {
      ideaId: string;
      projectTitle: string;
      projectUrl: string;
      projectDescription?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.pinUserProject(
        dto.ideaId,
        userId,
        dto.projectTitle,
        dto.projectUrl,
        dto.projectDescription
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: "Project pinned successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to pin project",
      };
    }
  }

  /**
   * POST /api/ai/unpin-project
   * Remove user's pinned project from an idea
   */
  @Post("unpin-project")
  @UseGuards(AuthGuard)
  async unpinUserProject(
    @CurrentUser("userId") userId: string,
    @Body() dto: { ideaId: string }
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.unpinUserProject(dto.ideaId, userId);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: "Project unpinned successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to unpin project",
      };
    }
  }

  /**
   * GET /api/ai/search-quota
   * Get user's daily search quota for related projects
   */
  @Get("search-quota")
  @UseGuards(AuthGuard)
  async getSearchQuota(
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<any>> {
    try {
      const quota = await this.aiService.getUserSearchQuota(userId);

      return {
        success: true,
        data: quota,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get search quota",
      };
    }
  }

  /**
   * POST /api/ai/clear-related-projects
   * Clear all AI-detected related projects for an idea
   */
  @Post("clear-related-projects")
  @UseGuards(AuthGuard)
  async clearRelatedProjects(
    @Body() dto: { ideaId: string }
  ): Promise<ApiResponse<any>> {
    try {
      const result = await this.aiService.clearRelatedProjects(dto.ideaId);

      if (!result.success) {
        return {
          success: false,
          error: result.error,
        };
      }

      return {
        success: true,
        message: `Cleared ${result.deletedCount} AI-detected projects`,
        data: { deletedCount: result.deletedCount },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to clear related projects",
      };
    }
  }
}

