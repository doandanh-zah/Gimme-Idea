'use client';

import Link from 'next/link';
import type { Locale } from '@gimme-idea/contracts';
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
  return (
    <Link className="quoted-embed" href={target.href} onClick={(event) => event.stopPropagation()}>
      <strong>
        {target.creatorName}
        {target.creatorUsername && <span> @{target.creatorUsername}</span>}
        <span> · {formatPostDate(locale, target.createdAt)}</span>
      </strong>
      <b>{target.title}</b>
      <small>{target.summary}</small>
      {target.media && <MediaBlock media={target.media} />}
    </Link>
  );
}
