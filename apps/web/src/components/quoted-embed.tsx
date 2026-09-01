'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Lightbulb, Target } from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import { PostMediaGallery } from '@/components/post-media-gallery';
import type { MediaAttachment, QuotedTarget } from '@/lib/social';

function formatPostDate(locale: Locale, iso: string) {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export function MediaBlock({ media }: { media: MediaAttachment }) {
  if (media.kind === 'video') {
    return (
      <video className="post-media" src={media.src} controls playsInline preload="metadata">
        {media.name}
      </video>
    );
  }
  // User-selected data URLs are already local and have no stable dimensions for next/image.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="post-media" src={media.src} alt="" />;
}

export function QuotedEmbed({ locale, target }: { locale: Locale; target: QuotedTarget }) {
  const KindIcon = target.kind === 'idea' ? Lightbulb : Target;
  const initials = target.creatorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const attachments = target.attachments ?? [];

  return (
    <article
      className={`quoted-embed is-embed knowledge-post knowledge-post-${target.kind}`}
      onClick={(event) => event.stopPropagation()}
    >
      <Link className="knowledge-post-avatar" href={target.href} tabIndex={-1}>
        {target.avatarUrl ? (
          <Image src={target.avatarUrl} alt="" width={40} height={40} unoptimized />
        ) : (
          <span aria-hidden="true">{initials || '?'}</span>
        )}
      </Link>
      <div className="knowledge-post-main">
        <Link className="quoted-embed-copy" href={target.href}>
          <span className="knowledge-post-header">
            <span className="knowledge-post-identity">
              <strong>{target.creatorName}</strong>
              {target.creatorUsername && <span>@{target.creatorUsername}</span>}
              <span aria-hidden="true">·</span>
              <time dateTime={target.createdAt}>{formatPostDate(locale, target.createdAt)}</time>
            </span>
            <span className="knowledge-post-kind" aria-hidden="true">
              <KindIcon size={16} strokeWidth={1.8} />
            </span>
          </span>
          <span className="knowledge-post-body">
            <span className="quoted-embed-title">{target.title}</span>
            <span className="quoted-embed-summary">{target.summary}</span>
          </span>
        </Link>
        {attachments.length > 0 && <PostMediaGallery attachments={attachments} />}
        {target.media && <MediaBlock media={target.media} />}
      </div>
    </article>
  );
}
