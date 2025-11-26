import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AIService } from './ai.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse } from '../shared/types';

export interface GenerateFeedbackDto {
  projectId: string;
  title: string;
  problem: string;
  solution: string;
  opportunity?: string;
  goMarket?: string;
  teamInfo?: string;
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

@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  /**
   * POST /api/ai/feedback
   * Generate AI feedback for an idea
   */
  @Post('feedback')
  @UseGuards(AuthGuard)
  async generateFeedback(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateFeedbackDto,
  ): Promise<ApiResponse<any>> {
    try {
      // Check if user has quota
      const quota = await this.aiService.checkUserAIQuota(userId, dto.projectId);
      if (!quota.canUse) {
        return {
          success: false,
          error: 'No AI credits remaining. Please purchase more credits.',
        };
      }

      // Generate feedback
      const feedback = await this.aiService.generateIdeaFeedback({
        title: dto.title,
        problem: dto.problem,
        solution: dto.solution,
        opportunity: dto.opportunity,
        goMarket: dto.goMarket,
        teamInfo: dto.teamInfo,
      });

      // Track usage
      await this.aiService.trackAIInteraction(
        userId,
        dto.projectId,
        'feedback',
        undefined,
        500, // Approximate tokens
      );

      return {
        success: true,
        data: feedback,
        message: 'AI feedback generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate feedback',
      };
    }
  }

  /**
   * POST /api/ai/reply
   * Generate AI reply to user comment
   */
  @Post('reply')
  @UseGuards(AuthGuard)
  async generateReply(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateReplyDto,
  ): Promise<ApiResponse<{ reply: string }>> {
    try {
      // Check if user has quota
      const quota = await this.aiService.checkUserAIQuota(userId, dto.projectId);
      if (!quota.canUse) {
        return {
          success: false,
          error: 'No AI credits remaining. Please purchase more credits.',
        };
      }

      // Generate reply
      const reply = await this.aiService.generateReplyToUser(
        dto.userMessage,
        dto.ideaContext,
        dto.conversationHistory,
      );

      // Track usage
      await this.aiService.trackAIInteraction(
        userId,
        dto.projectId,
        'reply',
        undefined,
        200, // Approximate tokens
      );

      return {
        success: true,
        data: { reply },
        message: 'AI reply generated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to generate reply',
      };
    }
  }

  /**
   * POST /api/ai/market-assessment
   * Generate market assessment for an idea
   */
  @Post('market-assessment')
  @UseGuards(AuthGuard)
  async generateMarketAssessment(
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateFeedbackDto,
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
        error: error.message || 'Failed to generate market assessment',
      };
    }
  }

  /**
   * GET /api/ai/quota/:projectId
   * Check user's AI quota for a project
   */
  @Get('quota/:projectId')
  @UseGuards(AuthGuard)
  async checkQuota(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string,
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
        error: error.message || 'Failed to check quota',
      };
    }
  }
}
