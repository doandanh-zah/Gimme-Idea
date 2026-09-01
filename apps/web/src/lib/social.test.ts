import { describe, expect, it } from 'vitest';
import { POST_MEDIA_LIMITS, PostMediaValidationError, validatePostMedia } from './social';

function media(name: string, type: string, size: number) {
  return { name, type, size } as File;
}

describe('post media limits', () => {
  it('accepts ten images at 5MB and one video at 25MB', () => {
    const images = Array.from({ length: POST_MEDIA_LIMITS.maxImages }, (_, index) =>
      media(`image-${index}.png`, 'image/png', POST_MEDIA_LIMITS.maxImageBytes),
    );
    const video = media('demo.mp4', 'video/mp4', POST_MEDIA_LIMITS.maxVideoBytes);
    expect(() => validatePostMedia([...images, video])).not.toThrow();
  });

  it.each([
    [
      'too_many_images',
      Array.from({ length: 11 }, (_, index) => media(`${index}.jpg`, 'image/jpeg', 100)),
    ],
    ['too_many_videos', [media('a.mp4', 'video/mp4', 100), media('b.mp4', 'video/mp4', 100)]],
    ['image_too_large', [media('large.png', 'image/png', POST_MEDIA_LIMITS.maxImageBytes + 1)]],
    ['video_too_large', [media('large.mp4', 'video/mp4', POST_MEDIA_LIMITS.maxVideoBytes + 1)]],
    ['unsupported', [media('notes.pdf', 'application/pdf', 100)]],
  ])('rejects %s', (code, files) => {
    expect(() => validatePostMedia(files)).toThrowError(
      expect.objectContaining({ code: code as PostMediaValidationError['code'] }),
    );
  });
});
