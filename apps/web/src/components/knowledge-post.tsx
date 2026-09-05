'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Bookmark,
  BriefcaseBusiness,
  Eye,
  Lightbulb,
  MessageSquareQuote,
  Target,
  Upload,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { IdeaDetailDTO, Locale, ProblemDetailDTO } from '@gimme-idea/contracts';
import { PostMediaGallery } from '@/components/post-media-gallery';
import { SocialComposer } from '@/components/quote-post';
import { useAuth } from '@/lib/auth';
import {
  getViewCount,
  incrementViews,
  isBookmarked,
  isLiked,
  itemKey,
  subscribeSocial,
  toggleBookmark,
  toggleLike,
  type LocalKnowledgePost,
  type QuotedTarget,
} from '@/lib/social';
import { formatPostTime } from '@/lib/time';

export type KnowledgePostItem =
  | { kind: 'idea'; data: IdeaDetailDTO }
  | { kind: 'problem'; data: ProblemDetailDTO }
  | { kind: 'idea' | 'problem'; data: LocalKnowledgePost; local: true };

const postCopy = {
  en: {
    idea: 'Idea',
    problem: 'Problem',
    open: 'Open details',
    unknownCreator: 'Creator unavailable',
    hiring: 'Hiring',
    views: 'Views',
    save: 'Save',
    unsave: 'Remove bookmark',
    like: 'Like',
    unlike: 'Unlike',
    share: 'Share',
    copied: 'Copied',
    quote: 'Quote',
    quoteTitle: 'Quote this',
    quotePrompt: "What's your take?",
    quotePost: 'Post',
    close: 'Close',
    quoteHint: 'This quote will appear on Home, like a quoted post.',
  },
  vi: {
    idea: 'Ý tưởng',
    problem: 'Vấn đề',
    open: 'Xem chi tiết',
    unknownCreator: 'Chưa có tác giả',
    hiring: 'Tuyển dụng',
    views: 'Lượt xem',
    save: 'Lưu',
    unsave: 'Bỏ lưu',
    like: 'Thích',
    unlike: 'Bỏ thích',
    share: 'Chia sẻ',
    copied: 'Đã sao chép',
    quote: 'Quote',
    quoteTitle: 'Quote bài này',
    quotePrompt: 'Bạn nghĩ gì?',
    quotePost: 'Đăng',
    close: 'Đóng',
    quoteHint: 'Quote sẽ xuất hiện trên Home, giống bài quote trên X.',
  },
} as const;

function formatBountyAmount(locale: Locale, amountRaw: string, currency: string) {
  if (currency.toUpperCase() !== 'USDC') return `${amountRaw} ${currency}`;
  const amount = Number(BigInt(amountRaw)) / 1_000_000;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCount(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

function toQuotedTarget(
  href: string,
  item: KnowledgePostItem,
  unknownCreator: string,
): QuotedTarget {
  const creator = item.data.creator;
  return {
    kind: item.kind,
    slug: item.data.slug,
    href,
    title: item.data.title,
    summary: item.data.summary,
    creatorName: creator?.displayName ?? unknownCreator,
    creatorUsername: creator?.username ?? null,
    avatarUrl: creator?.avatarUrl ?? null,
    createdAt: item.data.createdAt,
    attachments: 'local' in item ? item.data.attachments : [],
    media: null,
  };
}

export function KnowledgePost({
  locale,
  href,
  item,
}: {
  locale: Locale;
  href: string;
  item: KnowledgePostItem;
}) {
  const t = postCopy[locale];
  const auth = useAuth();
  const data = item.data;
  const isLocal = 'local' in item;
  const localData = 'local' in item ? item.data : null;
  const isIdea = item.kind === 'idea';
  const kindLabel = isIdea ? t.idea : t.problem;
  const KindIcon = isIdea ? Lightbulb : Target;
  const creator = data.creator;
  const creatorName = creator?.displayName ?? t.unknownCreator;
  const initials = creatorName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const bounty =
    item.kind === 'problem' ? ('local' in item ? item.data.bounty : item.data.bounty) : null;
  const draftAmount =
    bounty?.status === 'draft' && BigInt(bounty.amountRaw || '0') > 0n
      ? formatBountyAmount(locale, bounty.amountRaw, bounty.currency)
      : null;
  const key = itemKey(item.kind, data.slug);
  const fallbackViews = 'local' in item ? 0 : item.data.provenance.sources.length;
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [views, setViews] = useState(fallbackViews);
  const [shareLabel, setShareLabel] = useState<string>(t.share);
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSaved(isBookmarked(key));
      setLiked(isLiked(key));
      setViews(getViewCount(key, fallbackViews));
    };
    sync();
    return subscribeSocial(sync);
  }, [fallbackViews, key]);

  const share = async () => {
    if (!auth.requireAuth('share')) return;
    const url = new URL(href, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: data.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareLabel(t.copied);
      window.setTimeout(() => setShareLabel(t.share), 1500);
    } catch {
      await navigator.clipboard.writeText(url);
      setShareLabel(t.copied);
      window.setTimeout(() => setShareLabel(t.share), 1500);
    }
  };

  const openDetails = () => {
    incrementViews(key, fallbackViews);
  };

  return (
    <article
      id={isLocal ? `post-${data.id}` : undefined}
      className={`knowledge-post-link knowledge-post knowledge-post-${item.kind}`}
    >
      <Link
        className="knowledge-post-avatar"
        href={href}
        aria-label={`${creatorName}: ${data.title}`}
        onClick={openDetails}
        tabIndex={-1}
      >
        {creator?.avatarUrl ? (
          <Image src={creator.avatarUrl} alt="" width={40} height={40} unoptimized />
        ) : (
          <span aria-hidden="true">{initials || '?'}</span>
        )}
      </Link>
      <div className="knowledge-post-main">
        <header className="knowledge-post-header">
          <Link className="knowledge-post-identity" href={href} onClick={openDetails}>
            <strong>{creatorName}</strong>
            {creator && <span>@{creator.username}</span>}
            <span aria-hidden="true">·</span>
            <time dateTime={data.createdAt}>{formatPostTime(locale, data.createdAt)}</time>
          </Link>
          <div className="knowledge-post-tools">
            <button
              type="button"
              className={
                saved ? 'knowledge-post-action is-save is-on' : 'knowledge-post-action is-save'
              }
              aria-pressed={saved}
              aria-label={saved ? t.unsave : t.save}
              title={saved ? t.unsave : t.save}
              onClick={() => {
                if (!auth.requireAuth('save')) return;
                setSaved(toggleBookmark(key));
              }}
            >
              <Bookmark size={18} strokeWidth={1.75} fill={saved ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={
                shareLabel === t.copied
                  ? 'knowledge-post-action is-share is-copied'
                  : 'knowledge-post-action is-share'
              }
              aria-label={shareLabel}
              title={shareLabel}
              onClick={() => void share()}
            >
              <Upload size={18} strokeWidth={1.75} />
              <span className="sr-only">{shareLabel}</span>
            </button>
            <span className="knowledge-post-kind" aria-label={kindLabel} title={kindLabel}>
              <KindIcon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only">{kindLabel}</span>
            </span>
          </div>
        </header>
        <Link
          className="knowledge-post-body"
          href={href}
          onClick={openDetails}
          aria-label={`${t.open}: ${data.title}`}
        >
          <h2>{data.title}</h2>
          <p>{data.summary}</p>
        </Link>
        {localData && localData.attachments.length > 0 && (
          <PostMediaGallery attachments={localData.attachments} />
        )}
        <footer className="knowledge-post-actions">
          <div className="knowledge-post-action-group">
            <button
              type="button"
              className={
                liked ? 'knowledge-post-action is-like is-on' : 'knowledge-post-action is-like'
              }
              aria-pressed={liked}
              aria-label={liked ? t.unlike : t.like}
              title={liked ? t.unlike : t.like}
              onClick={() => {
                if (!auth.requireAuth('like')) return;
                setLiked(toggleLike(key));
              }}
            >
              <Lightbulb size={18} strokeWidth={1.75} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="knowledge-post-action is-quote"
              aria-label={t.quote}
              title={t.quote}
              onClick={() => {
                if (!auth.requireAuth('quote')) return;
                setQuoteOpen(true);
              }}
            >
              <MessageSquareQuote size={18} strokeWidth={1.75} />
            </button>
            <Link
              className="knowledge-post-action is-views"
              href={href}
              title={t.views}
              aria-label={`${t.views}: ${views}`}
              onClick={openDetails}
            >
              <Eye size={18} strokeWidth={1.75} />
              {views > 0 && <small>{formatCount(views)}</small>}
            </Link>
          </div>
          {(draftAmount || bounty?.openToHiring) && (
            <div className="knowledge-post-action-group is-end">
              {draftAmount && (
                <Link
                  className="bounty-signal"
                  href={href}
                  title={
                    locale === 'vi'
                      ? 'Bounty nháp · chưa được cấp vốn'
                      : 'Draft bounty · not funded'
                  }
                  onClick={openDetails}
                >
                  {locale === 'vi' ? 'Dự kiến' : 'Draft'} · {draftAmount}
                </Link>
              )}
              {bounty?.openToHiring && (
                <Link
                  className="job-signal"
                  href={href}
                  aria-label={t.hiring}
                  title={t.hiring}
                  onClick={openDetails}
                >
                  <BriefcaseBusiness size={18} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only">{t.hiring}</span>
                </Link>
              )}
            </div>
          )}
        </footer>
      </div>
      {quoteOpen && (
        <SocialComposer
          locale={locale}
          title={t.quoteTitle}
          target={toQuotedTarget(href, item, t.unknownCreator)}
          onClose={() => setQuoteOpen(false)}
        />
      )}
    </article>
  );
}
