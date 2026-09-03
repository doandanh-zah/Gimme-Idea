'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { StoredMediaAttachment } from '@/lib/social';
import { getStoredMediaBlob } from '@/lib/social';

function StoredMedia({
  attachment,
  interactive = false,
  onOpen,
}: {
  attachment: StoredMediaAttachment;
  interactive?: boolean;
  onOpen?: () => void;
}) {
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
    const video = (
      <video className="stored-post-media" src={source} controls playsInline preload="metadata">
        {attachment.name}
      </video>
    );
    return interactive ? (
      <div className="stored-media-with-open">
        {video}
        <button type="button" className="stored-media-open-overlay" onClick={onOpen}>
          Open
        </button>
      </div>
    ) : (
      video
    );
  }
  // Blob URLs are local previews without stable dimensions for next/image.
  // eslint-disable-next-line @next/next/no-img-element
  const image = <img className="stored-post-media" src={source} alt={attachment.name} />;
  return interactive ? (
    <button
      type="button"
      className="stored-media-open"
      onClick={onOpen}
      aria-label={attachment.name}
    >
      {image}
    </button>
  ) : (
    image
  );
}

export function PostMediaGallery({ attachments }: { attachments: StoredMediaAttachment[] }) {
  const images = attachments.filter((attachment) => attachment.kind === 'image');
  const video = attachments.find((attachment) => attachment.kind === 'video');
  const [active, setActive] = useState<StoredMediaAttachment | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  return (
    <>
      <div className="post-attachment-stack">
        {images.length > 0 && (
          <div
            className={`post-image-gallery${images.length === 1 ? ' is-single' : ''}`}
            aria-label={`${images.length} ${images.length === 1 ? 'image' : 'images'}`}
          >
            {images.map((attachment) => (
              <figure key={attachment.id} className="post-image-frame">
                <StoredMedia
                  attachment={attachment}
                  interactive
                  onOpen={() => setActive(attachment)}
                />
              </figure>
            ))}
          </div>
        )}
        {video && (
          <div className="post-video-frame">
            <StoredMedia attachment={video} interactive onOpen={() => setActive(video)} />
          </div>
        )}
      </div>
      {active && (
        <div
          className="media-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="media-viewer-close"
            aria-label="Close media"
            onClick={() => setActive(null)}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="media-viewer-frame" onClick={(event) => event.stopPropagation()}>
            <StoredMedia attachment={active} />
          </div>
        </div>
      )}
    </>
  );
}
