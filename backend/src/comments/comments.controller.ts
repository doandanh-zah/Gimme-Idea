import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { ApiResponse, Comment } from "../shared/types";

@Controller("comments")
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  /**
   * GET /api/comments/project/:projectId
   * Get all comments for a project
   */
  @Get("project/:projectId")
  async findByProject(
    @Param("projectId") projectId: string
  ): Promise<ApiResponse<Comment[]>> {
    return this.commentsService.findByProject(projectId);
  }

  /**
   * POST /api/comments
   * Create new comment (requires authentication)
   */
  @Post()
  @UseGuards(AnyAuthGuard)
  async create(
    @CurrentUser("userId") userId: string,
    @Body() createDto: CreateCommentDto
  ): Promise<ApiResponse<Comment>> {
    return this.commentsService.create(userId, createDto);
  }

  /**
   * PATCH /api/comments/:id
   * Update a comment (owner only)
   */
  @Patch(":id")
  @UseGuards(AnyAuthGuard)
  async update(
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string,
    @Body("content") content: string
  ): Promise<ApiResponse<Comment>> {
    return this.commentsService.update(commentId, userId, content);
  }

  /**
   * DELETE /api/comments/:id
   * Delete a comment (owner only)
   */
  @Delete(":id")
  @UseGuards(AnyAuthGuard)
  async delete(
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.commentsService.delete(commentId, userId);
  }

  /**
   * POST /api/comments/:id/like
   * Like a comment (requires authentication)
   */
  @Post(":id/like")
  @UseGuards(AnyAuthGuard)
  async like(
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    return this.commentsService.like(commentId, userId);
  }
}
