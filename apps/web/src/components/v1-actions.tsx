'use client';

import { Bookmark, MessageSquareQuote, Share2, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { SocialComposer } from '@/components/quote-post';
import { useAuth } from '@/lib/auth';
import type { QuotedTarget } from '@/lib/social';
import { useEntityReactions } from '@/lib/use-entity-reactions';
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
  const reactions = useEntityReactions(target.kind, target.slug, locale);
  const saved = reactions.bookmarked;
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [pendingDiscuss, setPendingDiscuss] = useState(false);
  useEffect(() => {
    if (!auth.isSignedIn || !pendingDiscuss) return;
    queueMicrotask(() => {
      setQuoteOpen(true);
      setPendingDiscuss(false);
    });
  }, [auth.isSignedIn, pendingDiscuss]);
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState(false);

  const require = (action: string) => auth.requireAuth(action);
  const share = async () => {
    const url = new URL(target.href, window.location.origin).toString();
    setShareError(false);
    try {
      if (navigator.share) {
        await navigator.share({ title: target.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1500);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setShareError(true);
    }
  };

  return (
    <div className="v1-entity-actions" aria-label={locale === 'vi' ? 'Hành động' : 'Actions'}>
      <button
        type="button"
        aria-pressed={saved}
        disabled={reactions.busy}
        onClick={() => void reactions.toggle('bookmark')}
      >
        <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
        {saved ? (locale === 'vi' ? 'Đã lưu' : 'Saved') : locale === 'vi' ? 'Lưu' : 'Save'}
      </button>
      <button
        type="button"
        disabled={reactions.busy}
        aria-pressed={reactions.following}
        onClick={() => void reactions.toggle('follow')}
      >
        <UserPlus size={17} aria-hidden="true" />
        {reactions.following
          ? locale === 'vi'
            ? 'Đang theo dõi'
            : 'Following'
          : locale === 'vi'
            ? 'Theo dõi'
            : 'Follow'}
      </button>
      {reactions.error && (
        <p role="alert">
          {reactions.error}{' '}
          <button type="button" onClick={reactions.retry}>
            {locale === 'vi' ? 'Thử lại' : 'Retry'}
          </button>
        </p>
      )}
      {allowDiscuss && (
        <button
          type="button"
          onClick={() => {
            if (!require('discuss')) {
              setPendingDiscuss(true);
              return;
            }
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
      {shareError && (
        <label role="status">
          {locale === 'vi' ? 'Sao chép liên kết này: ' : 'Copy this link: '}
          <input
            readOnly
            value={new URL(target.href, window.location.origin).toString()}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
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
