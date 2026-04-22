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
  Req,
} from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ApiTokensService } from "../api-tokens/api-tokens.service";
import { RequirePatScope } from "../common/decorators/require-pat-scope.decorator";
import { AnyAuthGuard } from "../common/guards/any-auth.guard";
import { CurrentUser } from "../common/decorators/user.decorator";
import { PatScopeGuard } from "../common/guards/pat-scope.guard";
import { ApiResponse, Comment } from "../shared/types";

@Controller("comments")
export class CommentsController {
  constructor(
    private commentsService: CommentsService,
    private apiTokensService: ApiTokensService
  ) {}

  /**
   * GET /api/comments/project/:projectId
   * Get all comments for a project
   */
  @Get("project/:projectId")
  async findByProject(
    @Param("projectId") projectId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ): Promise<ApiResponse<Comment[]>> {
    return this.commentsService.findByProject(projectId, {
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  /**
   * POST /api/comments
   * Create new comment (requires authentication)
   */
  @Post()
  @UseGuards(AnyAuthGuard)
  async create(
    @Req() req: any,
    @CurrentUser("userId") userId: string,
    @Body() createDto: CreateCommentDto
  ): Promise<ApiResponse<Comment>> {
    if (req.authType === "pat") {
      const neededScope = createDto.parentCommentId
        ? "comment:reply"
        : "comment:write";
      this.apiTokensService.ensureScope(req.user?.scopes || [], neededScope);
    }

    return this.commentsService.create(userId, createDto);
  }

  /**
   * PATCH /api/comments/:id
   * Update a comment (owner only)
   */
  @Patch(":id")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
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
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
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
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
  async like(
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    return this.commentsService.like(commentId, userId);
  }
}
