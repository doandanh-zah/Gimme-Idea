import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiResponse, Comment } from '../shared/types';

@Injectable()
export class CommentsService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Create new comment
   */
  async create(userId: string, createDto: CreateCommentDto): Promise<ApiResponse<Comment>> {
    const supabase = this.supabaseService.getAdminClient();

    const newComment = {
      project_id: createDto.projectId,
      user_id: userId,
      content: createDto.content,
      parent_comment_id: createDto.parentCommentId || null,
      likes: 0,
      created_at: new Date().toISOString(),
    };

    const { data: comment, error } = await supabase
      .from('comments')
      .insert(newComment)
      .select(`
        *,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    // Increment feedback count on project
    await supabase.rpc('increment_feedback_count', {
      project_id: createDto.projectId,
    });

    const commentResponse: Comment = {
      id: comment.id,
      projectId: comment.project_id,
      content: comment.content,
      author: {
        username: comment.author.username,
        wallet: comment.author.wallet,
        avatar: comment.author.avatar,
      },
      likes: comment.likes || 0,
      parentCommentId: comment.parent_comment_id,
      createdAt: comment.created_at,
    };

    return {
      success: true,
      data: commentResponse,
      message: 'Comment created successfully',
    };
  }

  /**
   * Get all comments for a project
   */
  async findByProject(projectId: string): Promise<ApiResponse<Comment[]>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        author:users!comments_user_id_fkey(
          username,
          wallet,
          avatar
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    const commentsResponse: Comment[] = comments.map(c => ({
      id: c.id,
      projectId: c.project_id,
      content: c.content,
      author: {
        username: c.author.username,
        wallet: c.author.wallet,
        avatar: c.author.avatar,
      },
      likes: c.likes || 0,
      parentCommentId: c.parent_comment_id,
      createdAt: c.created_at,
    }));

    return {
      success: true,
      data: commentsResponse,
    };
  }

  /**
   * Like a comment
   */
  async like(commentId: string, userId: string): Promise<ApiResponse<{ likes: number }>> {
    const supabase = this.supabaseService.getAdminClient();

    // Check if user already liked
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLike) {
      return {
        success: false,
        error: 'You already liked this comment',
      };
    }

    // Add like
    await supabase
      .from('comment_likes')
      .insert({ comment_id: commentId, user_id: userId });

    // Increment like count
    const { data: newLikes, error } = await supabase.rpc('increment_comment_likes', {
      comment_id: commentId,
    });

    if (error) {
      throw new Error(`Failed to like comment: ${error.message}`);
    }

    return {
      success: true,
      data: { likes: newLikes },
      message: 'Like added successfully',
    };
  }
}
