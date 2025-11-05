/**
 * Comment Actions
 * Client-side actions for comment management
 */

import {
  getComments as apiGetComments,
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  type CreateCommentInput,
  type Comment
} from '../api/comments.api'

/**
 * Get comments for a post
 */
export async function getComments(postId: string) {
  const response = await apiGetComments(postId)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get comments')
  }

  return response.data.comments
}

/**
 * Create comment on a post
 */
export async function createComment(
  postId: string,
  input: CreateCommentInput,
  walletAddress: string,
  walletSignature: string,
  message?: string
) {
  const response = await apiCreateComment(postId, input, walletAddress, walletSignature, message)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create comment')
  }

  // Backend returns { comment: {...} }, extract the comment object
  return response.data.comment || response.data
}

/**
 * Delete comment
 */
export async function deleteComment(
  commentId: string,
  walletAddress: string,
  walletSignature: string
) {
  const response = await apiDeleteComment(commentId, walletAddress, walletSignature)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to delete comment')
  }

  return response.data
}

// Re-export types
export type { CreateCommentInput, Comment }
