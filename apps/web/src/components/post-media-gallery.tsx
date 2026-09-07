'use client';

import type { Locale } from '@gimme-idea/contracts';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { StoredMediaAttachment } from '@/lib/social';
import { browserRequest } from '@/lib/api';
import { getCurrentAccessToken } from '@/lib/auth';
import { getStoredMediaBlob } from '@/lib/social';

function StoredMedia({
  attachment,
  interactive = false,
  onOpen,
  locale,
}: {
  attachment: StoredMediaAttachment;
  locale: Locale;
  interactive?: boolean;
  onOpen?: () => void;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Reset the external resource state for a new request.
    setFailed(false);
    setSource(null);
    if (attachment.remote) {
      void getCurrentAccessToken()
        .then((token) =>
          browserRequest<{ url: string }>(
            `/v1/uploads/${encodeURIComponent(attachment.id)}/download`,
            { accessToken: token },
          ),
        )
        .then((result) => {
          if (active) {
            if (result?.url) setSource(result.url);
            else setFailed(true);
          }
        })
        .catch(() => {
          if (active) setFailed(true);
        });
      return () => {
        active = false;
      };
    }
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
  }, [attachment.id, attachment.remote, retry]);

  if (failed) {
    return (
      <span className="stored-media-error">
        {attachment.name} · {locale === 'vi' ? 'Chưa tải được tệp' : 'Media unavailable'}{' '}
        <button type="button" onClick={() => setRetry((value) => value + 1)}>
          {locale === 'vi' ? 'Thử lại' : 'Retry'}
        </button>
      </span>
    );
  }
  if (!source) {
    return (
      <span
        className="stored-media-loading"
        aria-label={`${locale === 'vi' ? 'Đang tải' : 'Loading'} ${attachment.name}`}
      />
    );
  }
  if (attachment.kind === 'video') {
    const video = (
      <video
        className="stored-post-media"
        src={source}
        onError={() => setFailed(true)}
        controls
        playsInline
        preload="metadata"
      >
        {attachment.name}
      </video>
    );
    return interactive ? (
      <div className="stored-media-with-open">
        {video}
        <button type="button" className="stored-media-open-overlay" onClick={onOpen}>
          {locale === 'vi' ? 'Mở' : 'Open'}
        </button>
      </div>
    ) : (
      video
    );
  }
  // Blob URLs are local previews without stable dimensions for next/image.
  const image = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="stored-post-media"
      src={source}
      onError={() => setFailed(true)}
      alt={attachment.name}
    />
  );
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

export function PostMediaGallery({
  attachments,
  locale = 'en',
}: {
  attachments: StoredMediaAttachment[];
  locale?: Locale;
}) {
  const images = attachments.filter((attachment) => attachment.kind === 'image');
  const video = attachments.find((attachment) => attachment.kind === 'video');
  const [active, setActive] = useState<StoredMediaAttachment | null>(null);

  const viewerRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = viewerRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
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
                  locale={locale}
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
            <StoredMedia
              locale={locale}
              attachment={video}
              interactive
              onOpen={() => setActive(video)}
            />
          </div>
        )}
      </div>
      {active && (
        <dialog
          ref={viewerRef}
          className="media-viewer"
          onCancel={(event) => {
            event.preventDefault();
            setActive(null);
          }}
          onClose={() => setActive(null)}
          aria-label={active.name}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="media-viewer-close"
            aria-label={locale === 'vi' ? 'Đóng tệp' : 'Close media'}
            onClick={() => setActive(null)}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div className="media-viewer-frame" onClick={(event) => event.stopPropagation()}>
            <StoredMedia locale={locale} attachment={active} />
          </div>
        </dialog>
      )}
    </>
  );
}
