/**
 * Image Actions
 * Client-side actions for image upload
 */

import {
  uploadImage as apiUploadImage,
  deleteImage as apiDeleteImage,
  type UploadResponse
} from '../api/upload.api'
import { compressImage } from '../utils/image-compression'

/**
 * Upload post image with automatic compression
 */
export async function uploadPostImage(
  file: File,
  walletAddress: string,
  walletSignature: string,
  message?: string
): Promise<string> {
  // Skip compression - upload original file directly
  // Compression was causing issues with image display
  console.log(`[Upload] Uploading file: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)

  const response = await apiUploadImage(file, walletAddress, walletSignature, message)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to upload image')
  }

  // Return the URL of the uploaded image
  return response.data.url
}

/**
 * Delete image
 */
export async function deleteImage(
  path: string,
  walletAddress: string,
  walletSignature: string
) {
  const response = await apiDeleteImage(path, walletAddress, walletSignature)

  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to delete image')
  }

  return response.data
}

// Re-export types
export type { UploadResponse }
