'use client';

import { useEffect, useState } from 'react';
import type { StoredMediaAttachment } from '@/lib/social';
import { getStoredMediaBlob } from '@/lib/social';

function StoredMedia({ attachment }: { attachment: StoredMediaAttachment }) {
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    void getStoredMediaBlob(attachment.id)
      .then((blob) => {
        if (!active || !blob) {
          if (active) setFailed(true);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.id]);

  if (failed) {
    return <span className="stored-media-error">{attachment.name}</span>;
  }
  if (!source) {
    return <span className="stored-media-loading" aria-label={`Loading ${attachment.name}`} />;
  }
  if (attachment.kind === 'video') {
    return (
      <video className="stored-post-media" src={source} controls playsInline preload="metadata">
        {attachment.name}
      </video>
    );
  }
  // Blob URLs are local previews without stable dimensions for next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="stored-post-media" src={source} alt={attachment.name} />;
}

export function PostMediaGallery({ attachments }: { attachments: StoredMediaAttachment[] }) {
  const images = attachments.filter((attachment) => attachment.kind === 'image');
  const video = attachments.find((attachment) => attachment.kind === 'video');

  return (
    <div className="post-attachment-stack">
      {images.length > 0 && (
        <div
          className={`post-image-gallery${images.length === 1 ? ' is-single' : ''}`}
          aria-label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`}
        >
          {images.map((attachment) => (
            <figure key={attachment.id} className="post-image-frame">
              <StoredMedia attachment={attachment} />
            </figure>
          ))}
        </div>
      )}
      {video && (
        <div className="post-video-frame">
          <StoredMedia attachment={video} />
        </div>
      )}
    </div>
  );
}
