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

    const result = await this.commentsService.create(userId, createDto);

    await this.apiTokensService.auditPatAction(req, {
      action: createDto.parentCommentId ? "comment.reply" : "comment.create",
      resourceType: "comment",
      resourceId: result.data?.id,
      metadata: {
        projectId: createDto.projectId,
        parentCommentId: createDto.parentCommentId || null,
        isAnonymous: createDto.isAnonymous || false,
      },
    });

    return result;
  }

  /**
   * PATCH /api/comments/:id
   * Update a comment (owner only)
   */
  @Patch(":id")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
  async update(
    @Req() req: any,
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string,
    @Body("content") content: string
  ): Promise<ApiResponse<Comment>> {
    const result = await this.commentsService.update(commentId, userId, content);

    await this.apiTokensService.auditPatAction(req, {
      action: "comment.update",
      resourceType: "comment",
      resourceId: commentId,
      metadata: {
        contentLength: content?.length || 0,
      },
    });

    return result;
  }

  /**
   * DELETE /api/comments/:id
   * Delete a comment (owner only)
   */
  @Delete(":id")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
  async delete(
    @Req() req: any,
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    const result = await this.commentsService.delete(commentId, userId);

    await this.apiTokensService.auditPatAction(req, {
      action: "comment.delete",
      resourceType: "comment",
      resourceId: commentId,
    });

    return result;
  }

  /**
   * POST /api/comments/:id/like
   * Like a comment (requires authentication)
   */
  @Post(":id/like")
  @UseGuards(AnyAuthGuard, PatScopeGuard)
  @RequirePatScope("comment:write")
  async like(
    @Req() req: any,
    @Param("id") commentId: string,
    @CurrentUser("userId") userId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    const result = await this.commentsService.like(commentId, userId);

    await this.apiTokensService.auditPatAction(req, {
      action: "comment.like",
      resourceType: "comment",
      resourceId: commentId,
    });

    return result;
  }
}
