'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { useAuth } from '@/lib/auth';
import { browserRequest } from '@/lib/api';
import { publicEntityHref } from '@/lib/domain/routes';
import { catalogPageSize } from '@/lib/pagination';
import { CatalogPagination } from './catalog-pagination';
import { EmptySurface } from './app-surfaces';
import { QuotePostCard, useQuotes } from './quote-post';
import { getSocialState, getLocalKnowledgePosts, quoteKey, subscribeSocial } from '@/lib/social';

type SavedRecord = { id: string; type: string; slug: string; title: string; summary: string };
type Props = { locale: Locale; tab: 'bookmarks' | 'likes'; page: number };
function SavedLibraryContent({ locale, tab, page }: Props) {
  const { hydrated, session, getAccessToken, requireAuth } = useAuth();
  const [items, setItems] = useState<SavedRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const quotes = useQuotes();
  const [localKeys, setLocalKeys] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setLocalKeys(getSocialState()[tab]);
    sync();
    return subscribeSocial(sync);
  }, [tab]);
  useEffect(() => {
    if (!session || !hydrated) return;
    const controller = new AbortController();
    void getAccessToken()
      .then((token) =>
        browserRequest<SavedRecord[]>(
          `/v1/me/library?category=${tab}&limit=${catalogPageSize + 1}&offset=${(page - 1) * catalogPageSize}`,
          { accessToken: token, signal: controller.signal },
        ),
      )
      .then((rows) => {
        if (!controller.signal.aborted) {
          setItems(rows ?? []);
          setError(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [session, hydrated, getAccessToken, tab, page, retry]);
  if (!hydrated)
    return <p role="status">{locale === 'vi' ? 'Đang tải thư viện…' : 'Loading your library…'}</p>;
  if (!session)
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Thư viện của bạn' : 'Your library'}
        body={
          locale === 'vi' ? 'Đăng nhập để xem nội dung đã lưu.' : 'Sign in to see your saved items.'
        }
        action={
          <button type="button" onClick={() => requireAuth('saved')}>
            {locale === 'vi' ? 'Đăng nhập' : 'Sign in'}
          </button>
        }
      />
    );
  if (error)
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Chưa tải được thư viện' : 'Could not load your library'}
        body={
          locale === 'vi'
            ? 'Nội dung đã lưu vẫn được giữ trong tài khoản.'
            : 'Your saved content is still stored in your account.'
        }
        action={
          <button
            type="button"
            onClick={() => {
              setError(false);
              setItems(null);
              setRetry((value) => value + 1);
            }}
          >
            {locale === 'vi' ? 'Thử lại' : 'Retry'}
          </button>
        }
      />
    );
  if (!items)
    return (
      <p role="status">
        {locale === 'vi' ? 'Đang đồng bộ thư viện…' : 'Synchronizing your library…'}
      </p>
    );
  const localQuotes =
    page === 1 ? quotes.filter((quote) => localKeys.includes(quoteKey(quote.id))) : [];
  const legacy =
    page === 1
      ? localKeys.flatMap((key) => {
          const [kind, ...parts] = key.split(':');
          if (!kind) return [];
          const slug = parts.join(':');
          const href = publicEntityHref(locale, kind, slug);
          if (!href || items.some((item) => item.type === kind && item.slug === slug)) return [];
          const cached = getLocalKnowledgePosts().find(
            (item) => item.kind === kind && item.slug === slug,
          );
          return [{ key, href, title: cached?.title ?? slug.replaceAll('-', ' ') }];
        })
      : [];
  return (
    <>
      <p>
        {locale === 'vi'
          ? 'Nội dung công khai đã lưu và đã thích được đồng bộ theo tài khoản.'
          : 'Saved and liked public content is synchronized with your account.'}
      </p>
      {!items.length && !localQuotes.length && !legacy.length && (
        <EmptySurface
          title={
            locale === 'vi' ? 'Chưa có nội dung trong trang này' : 'No saved content on this page'
          }
          body={
            locale === 'vi'
              ? 'Lưu hoặc thích nội dung công khai để xem lại tại đây.'
              : 'Save or like public content to revisit it here.'
          }
          action={
            <Link href={`/${locale}/problems`}>
              {locale === 'vi' ? 'Khám phá vấn đề' : 'Explore Problems'}
            </Link>
          }
        />
      )}
      <section
        className="v1-search-results"
        aria-label={locale === 'vi' ? 'Nội dung trong tài khoản' : 'Account library'}
      >
        {items.slice(0, catalogPageSize).map((item) => {
          const href = publicEntityHref(locale, item.type, item.slug);
          return href ? (
            <Link key={`${item.type}:${item.id}`} href={href}>
              <span className={`v1-search-kind is-${item.type}`}>{item.type}</span>
              <span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </span>
            </Link>
          ) : null;
        })}
      </section>
      <CatalogPagination
        locale={locale}
        path={`/${locale}/saved`}
        page={page}
        hasNext={items.length > catalogPageSize}
        query={{ tab }}
      />
      {legacy.length > 0 && (
        <section
          className="v1-search-results"
          aria-label={locale === 'vi' ? 'Mục cũ trên thiết bị' : 'Older items on this device'}
        >
          <p>
            {locale === 'vi'
              ? 'Các mục đã lưu trước khi có đồng bộ tài khoản, chỉ trên trình duyệt này.'
              : 'Items marked before account synchronization, kept in this browser.'}
          </p>
          {legacy.map((item) => (
            <Link key={item.key} href={item.href}>
              {item.title}
            </Link>
          ))}
        </section>
      )}
      {localQuotes.length > 0 && (
        <section
          className="feed-stream"
          aria-label={locale === 'vi' ? 'Quote trên thiết bị này' : 'Quotes on this device'}
        >
          <p>
            {locale === 'vi'
              ? 'Các Quote dưới đây được đánh dấu trên trình duyệt này.'
              : 'These quotes were marked in this browser.'}
          </p>
          {localQuotes.map((quote) => (
            <QuotePostCard key={quote.id} locale={locale} post={quote} />
          ))}
        </section>
      )}
    </>
  );
}
export function SavedLibrary(props: Props) {
  const { session } = useAuth();
  return (
    <SavedLibraryContent key={`${session?.id ?? 'guest'}:${props.tab}:${props.page}`} {...props} />
  );
}
