import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { ApiResponse, Comment } from '../shared/types';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * GET /api/comments/project/:projectId
   * Get all comments for a project
   */
  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string): Promise<ApiResponse<Comment[]>> {
    return this.commentsService.findByProject(projectId);
  }

  /**
   * POST /api/comments
   * Create new comment (requires authentication)
   */
  @Post()
  @UseGuards(AuthGuard)
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDto: CreateCommentDto
  ): Promise<ApiResponse<Comment>> {
    return this.commentsService.create(userId, createDto);
  }

  /**
   * POST /api/comments/:id/like
   * Like a comment (requires authentication)
   */
  @Post(':id/like')
  @UseGuards(AuthGuard)
  async like(
    @Param('id') commentId: string,
    @CurrentUser('userId') userId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    return this.commentsService.like(commentId, userId);
  }
}
