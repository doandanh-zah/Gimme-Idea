/**
 * Post Actions
 * Client-side actions for post management
 */

import {
  getPosts as apiGetPosts,
  getPost as apiGetPost,
  createPost as apiCreatePost,
  updatePost as apiUpdatePost,
  deletePost as apiDeletePost,
  type CreatePostInput,
  type UpdatePostInput,
  type Post
} from '../api/posts.api'
import { transformBackendPost } from '../stores/app-store'

/**
 * Get all posts with optional filters
 */
export async function getPosts(params?: {
  category?: string
  walletAddress?: string
  page?: number
  limit?: number
}) {
  console.log('[getPosts] Calling API with params:', params)
  const response = await apiGetPosts(params)

  console.log('[getPosts] API response:', response)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get posts')
  }

  console.log('[getPosts] Response data:', response.data)
  console.log('[getPosts] Posts array:', response.data.posts)

  // Transform posts but keep the rest of response structure
  return {
    ...response.data,
    posts: (response.data.posts || []).map(transformBackendPost)
  }
}

/**
 * Get posts by wallet address (user's posts)
 */
export async function getUserPosts(walletAddress: string) {
  const response = await apiGetPosts({ walletAddress })

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get user posts')
  }

  // Transform backend camelCase to snake_case
  return (response.data.posts || []).map(transformBackendPost)
}

/**
 * Get single post by ID
 */
export async function getPost(id: string) {
  const response = await apiGetPost(id)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to get post')
  }

  // Transform backend camelCase to snake_case
  return transformBackendPost(response.data)
}

/**
 * Create new post
 */
export async function createPost(
  input: CreatePostInput,
  walletAddress: string,
  walletSignature: string,
  message?: string
) {
  const response = await apiCreatePost(input, walletAddress, walletSignature, message)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create post')
  }

  // Backend returns { success: true, data: { post: {...} } }
  const backendPost = response.data.post || response.data
  console.log('[createPost] Backend response:', backendPost)

  // Transform backend camelCase to snake_case
  const transformedPost = transformBackendPost(backendPost)
  console.log('[createPost] Transformed post:', transformedPost)

  return transformedPost
}

/**
 * Update post
 */
export async function updatePost(
  id: string,
  input: UpdatePostInput,
  walletAddress: string,
  walletSignature: string
) {
  const response = await apiUpdatePost(id, input, walletAddress, walletSignature)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to update post')
  }

  return response.data
}

/**
 * Delete post
 */
export async function deletePost(
  id: string,
  walletAddress: string,
  walletSignature: string
) {
  const response = await apiDeletePost(id, walletAddress, walletSignature)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to delete post')
  }

  return response.data
}

// Re-export types
export type { CreatePostInput, UpdatePostInput, Post }
