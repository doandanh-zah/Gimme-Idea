/**
 * Comments API Service
 */

import { apiGet, apiPost, apiDelete, ApiResponse } from './client'

export interface CreateCommentInput {
  content: string
  parentId?: string
}

export interface Comment {
  id: string
  content: string
  postId: string
  walletId: string
  parentId?: string
  createdAt: string
  updatedAt: string
  wallet: {
    address: string
  }
  replies?: Comment[]
  _count?: {
    tips: number
  }
  totalTips?: number
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<ApiResponse<{ comments: Comment[] }>> {
  return apiGet(`/api/posts/${postId}/comments`)
}

/**
 * Add comment to post
 */
export async function createComment(
  postId: string,
  input: CreateCommentInput,
  walletAddress: string,
  walletSignature: string,
  message?: string
): Promise<ApiResponse<Comment>> {
  // Include message in body for signature verification
  const body = message ? { ...input, message } : input

  return apiPost(`/api/posts/${postId}/comments`, body, {
    walletAddress,
    walletSignature
  })
}

/**
 * Delete comment
 */
export async function deleteComment(
  commentId: string,
  walletAddress: string,
  walletSignature: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiDelete(`/api/comments/${commentId}`, {
    walletAddress,
    walletSignature
  })
}
