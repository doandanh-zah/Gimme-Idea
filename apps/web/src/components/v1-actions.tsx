'use client';

import { Bookmark, MessageSquareQuote, Share2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { SocialComposer } from '@/components/quote-post';
import { useAuth } from '@/lib/auth';
import {
  itemKey,
  isBookmarked,
  subscribeSocial,
  toggleBookmark,
  type QuotedTarget,
} from '@/lib/social';
import { trackFrontendEvent } from '@/lib/domain/analytics';

export function EntityActions({
  locale,
  target,
  allowDiscuss = true,
}: {
  locale: Locale;
  target: QuotedTarget;
  allowDiscuss?: boolean;
}) {
  const auth = useAuth();
  const key = itemKey(target.kind, target.slug);
  const [saved, setSaved] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(isBookmarked(key));
    sync();
    return subscribeSocial(sync);
  }, [key]);

  const require = (action: string) => auth.requireAuth(action);
  const share = async () => {
    if (!require('share')) return;
    const url = new URL(target.href, window.location.origin).toString();
    if (navigator.share) await navigator.share({ title: target.title, url }).catch(() => undefined);
    else await navigator.clipboard.writeText(url);
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  };

  return (
    <div className="v1-entity-actions" aria-label={locale === 'vi' ? 'Hành động' : 'Actions'}>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => {
          if (!require('save')) return;
          setSaved(toggleBookmark(key));
        }}
      >
        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        {saved ? (locale === 'vi' ? 'Đã lưu' : 'Saved') : locale === 'vi' ? 'Lưu' : 'Save'}
      </button>
      <button
        type="button"
        aria-pressed={followed}
        onClick={() => {
          if (!require('follow')) return;
          setFollowed((value) => !value);
        }}
      >
        <UserPlus size={17} aria-hidden="true" />
        {followed
          ? locale === 'vi'
            ? 'Đang theo dõi'
            : 'Following'
          : locale === 'vi'
            ? 'Theo dõi'
            : 'Follow'}
      </button>
      {allowDiscuss && (
        <button
          type="button"
          onClick={() => {
            if (!require('discuss')) return;
            if (target.kind === 'problem')
              trackFrontendEvent({ name: 'problem_discuss', entityId: target.slug });
            setQuoteOpen(true);
          }}
        >
          <MessageSquareQuote size={17} aria-hidden="true" />
          {locale === 'vi' ? 'Thảo luận' : 'Discuss'}
        </button>
      )}
      <button type="button" onClick={() => void share()}>
        <Share2 size={17} aria-hidden="true" />
        {shared
          ? locale === 'vi'
            ? 'Đã sao chép'
            : 'Copied'
          : locale === 'vi'
            ? 'Chia sẻ'
            : 'Share'}
      </button>
      {quoteOpen && (
        <SocialComposer
          locale={locale}
          title={locale === 'vi' ? 'Thảo luận trong ngữ cảnh' : 'Discuss in context'}
          target={target}
          onClose={() => setQuoteOpen(false)}
        />
      )}
    </div>
  );
}
