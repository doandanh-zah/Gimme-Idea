export const POST_MEDIA_LIMITS = {
  maxImages: 10,
  maxImageBytes: 5 * 1024 * 1024,
  maxVideos: 1,
  maxVideoBytes: 25 * 1024 * 1024,
} as const;
export type PostMediaValidationCode =
  'unsupported' | 'too_many_images' | 'too_many_videos' | 'image_too_large' | 'video_too_large';
export class PostMediaValidationError extends Error {
  constructor(
    public readonly code: PostMediaValidationCode,
    public readonly fileName?: string,
  ) {
    super(code);
  }
}
export function validatePostMedia(files: File[]) {
  let imageCount = 0;
  let videoCount = 0;
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      imageCount++;
      if (file.size > POST_MEDIA_LIMITS.maxImageBytes)
        throw new PostMediaValidationError('image_too_large', file.name);
      continue;
    }
    if (file.type.startsWith('video/')) {
      videoCount++;
      if (file.size > POST_MEDIA_LIMITS.maxVideoBytes)
        throw new PostMediaValidationError('video_too_large', file.name);
      continue;
    }
    throw new PostMediaValidationError('unsupported', file.name);
  }
  if (imageCount > POST_MEDIA_LIMITS.maxImages)
    throw new PostMediaValidationError('too_many_images');
  if (videoCount > POST_MEDIA_LIMITS.maxVideos)
    throw new PostMediaValidationError('too_many_videos');
}
