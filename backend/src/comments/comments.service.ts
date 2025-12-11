import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { SupabaseService } from "../shared/supabase.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ApiResponse, Comment } from "../shared/types";

@Injectable()
export class CommentsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create new comment
   */
  async create(
    userId: string,
    createDto: CreateCommentDto
  ): Promise<ApiResponse<Comment>> {
    const supabase = this.supabaseService.getAdminClient();

    const newComment = {
      project_id: createDto.projectId,
      user_id: userId,
      content: createDto.content,
      parent_comment_id: createDto.parentCommentId || null,
      is_anonymous: createDto.isAnonymous || false,
      likes: 0,
      tips_amount: 0,
      created_at: new Date().toISOString(),
    };

    const { data: comment, error } = await supabase
      .from("comments")
      .insert(newComment)
      .select(
        `
        *,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    // Increment feedback count on project
    await supabase.rpc("increment_feedback_count", {
      project_id: createDto.projectId,
    });

    const commentResponse: Comment = {
      id: comment.id,
      projectId: comment.project_id,
      content: comment.content,
      author: comment.is_anonymous
        ? null
        : {
            username: comment.author.username,
            wallet: comment.author.wallet,
            avatar: comment.author.avatar,
          },
      likes: comment.likes || 0,
      parentCommentId: comment.parent_comment_id,
      isAnonymous: comment.is_anonymous,
      tipsAmount: comment.tips_amount || 0,
      createdAt: comment.created_at,
    };

    return {
      success: true,
      data: commentResponse,
      message: "Comment created successfully",
    };
  }

  /**
   * Get all comments for a project
   */
  async findByProject(projectId: string): Promise<ApiResponse<Comment[]>> {
    const supabase = this.supabaseService.getAdminClient();

    // OPTIMIZATION: Select only needed columns to reduce egress
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
        id,
        project_id,
        content,
        likes,
        parent_comment_id,
        is_anonymous,
        tips_amount,
        created_at,
        is_ai_generated,
        ai_model,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    const commentsResponse: Comment[] = comments.map((c) => {
      const authorData = Array.isArray(c.author) ? c.author[0] : c.author;

      return {
        id: c.id,
        projectId: c.project_id,
        content: c.content,
        author:
          c.is_anonymous || !authorData
            ? null
            : {
                username: authorData.username,
                wallet: authorData.wallet,
                avatar: authorData.avatar,
              },
        likes: c.likes || 0,
        parentCommentId: c.parent_comment_id,
        isAnonymous: c.is_anonymous,
        tipsAmount: c.tips_amount || 0,
        createdAt: c.created_at,
        is_ai_generated: c.is_ai_generated,
        ai_model: c.ai_model,
      };
    });

    return {
      success: true,
      data: commentsResponse,
    };
  }

  /**
   * Like a comment
   */
  async like(
    commentId: string,
    userId: string
  ): Promise<ApiResponse<{ likes: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user already liked
    const { data: existingLike } = await supabase
      .from("comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .single();

    if (existingLike) {
      return {
        success: false,
        error: "You already liked this comment",
      };
    }

    // Add like
    await supabase
      .from("comment_likes")
      .insert({ comment_id: commentId, user_id: userId });

    // Increment like count
    const { data: newLikes, error } = await supabase.rpc(
      "increment_comment_likes",
      {
        comment_id: commentId,
      }
    );

    if (error) {
      throw new Error(`Failed to like comment: ${error.message}`);
    }

    return {
      success: true,
      data: { likes: newLikes },
      message: "Like added successfully",
    };
  }

  /**
   * Update a comment (owner only)
   */
  async update(
    commentId: string,
    userId: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check ownership
    const { data: comment, error: findError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (findError || !comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    // Update comment
    const { data: updated, error } = await supabase
      .from("comments")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .select(
        `
        *,
        author:users!comments_user_id_fkey(username, wallet, avatar)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    const commentResponse: Comment = {
      id: updated.id,
      projectId: updated.project_id,
      content: updated.content,
      author: updated.is_anonymous
        ? null
        : {
            username: updated.author.username,
            wallet: updated.author.wallet,
            avatar: updated.author.avatar,
          },
      likes: updated.likes || 0,
      parentCommentId: updated.parent_comment_id,
      isAnonymous: updated.is_anonymous,
      tipsAmount: updated.tips_amount || 0,
      createdAt: updated.created_at,
    };

    return {
      success: true,
      data: commentResponse,
      message: "Comment updated successfully",
    };
  }

  /**
   * Delete a comment (owner only)
   */
  async delete(
    commentId: string,
    userId: string
  ): Promise<ApiResponse<{ deleted: boolean }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check ownership
    const { data: comment, error: findError } = await supabase
      .from("comments")
      .select("user_id, project_id")
      .eq("id", commentId)
      .single();

    if (findError || !comment) {
      throw new NotFoundException("Comment not found");
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    // Delete comment
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }

    // Decrement feedback count on project
    await supabase.rpc("decrement_feedback_count", {
      project_id: comment.project_id,
    });

    return {
      success: true,
      data: { deleted: true },
      message: "Comment deleted successfully",
    };
  }
}
