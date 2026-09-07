'use client';

import { userErrorMessage } from '@/lib/error-message';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { notificationChangeEvent } from '@/lib/use-notification-count';
import { CatalogPagination } from './catalog-pagination';
import { ArrowRight, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { browserRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { EmptySurface } from '@/components/app-surfaces';

type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  bountySlug?: string | null;
  submissionId?: string | null;
  readAt: string | null;
  createdAt: string;
};
function NotificationListContent({ locale }: { locale: Locale }) {
  const { getAccessToken, session, hydrated, requireAuth } = useAuth();
  const query = useSearchParams();
  const pageNumber = Math.max(1, Math.floor(Number(query.get('page')) || 1));
  const [readError, setReadError] = useState<string | null>(null);
  const [marking, setMarking] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!hydrated || !session) return;
    let active = true;
    void getAccessToken()
      .then((token) =>
        browserRequest<Notification[]>(
          `/v1/notifications?limit=31&offset=${(pageNumber - 1) * 30}`,
          { accessToken: token },
        ),
      )
      .then((value) => {
        if (active) setItems(value ?? []);
      })
      .catch((caught) => {
        if (active) setError(userErrorMessage(locale, caught));
      });
    return () => {
      active = false;
    };
  }, [getAccessToken, hydrated, session, retry, locale, pageNumber]);
  if (error)
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Chưa tải được thông báo' : 'Could not load notifications'}
        body={error}
        action={
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              setError(null);
              setRetry((value) => value + 1);
            }}
          >
            {locale === 'vi' ? 'Thử lại' : 'Try again'}
          </button>
        }
      />
    );
  if (!hydrated || (session && items === null))
    return (
      <div className="notification-loading" role="status">
        <span className="sr-only">
          {locale === 'vi' ? 'Đang tải thông báo' : 'Loading notifications'}
        </span>
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (!session)
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Theo dõi điều bạn quan tâm' : 'Stay close to what matters'}
        body={
          locale === 'vi'
            ? 'Đăng nhập để nhận cập nhật về ý tưởng, dự án và bài dự thi của bạn.'
            : 'Sign in for updates on your ideas, projects and competition entries.'
        }
        action={
          <button
            className="button button-primary"
            type="button"
            onClick={() => requireAuth('notifications')}
          >
            {locale === 'vi' ? 'Đăng nhập' : 'Sign in'}
          </button>
        }
      />
    );
  if (!items?.length)
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Bạn đã xem hết thông báo' : 'You’re all caught up'}
        body={
          locale === 'vi'
            ? 'Các cập nhật mới sẽ xuất hiện ở đây. Hãy khám phá một vấn đề trong lúc chờ.'
            : 'New updates will appear here. Explore a problem while you wait.'
        }
        action={
          <Link
            href={
              pageNumber > 1
                ? `/${locale}/notifications?page=${pageNumber - 1}`
                : `/${locale}/problems`
            }
          >
            {pageNumber > 1
              ? locale === 'vi'
                ? 'Trang trước'
                : 'Previous page'
              : locale === 'vi'
                ? 'Khám phá vấn đề'
                : 'Explore Problems'}
          </Link>
        }
      />
    );
  const markRead = async (id: string) => {
    setReadError(null);
    setMarking(id);
    try {
      const token = await getAccessToken();
      await browserRequest(`/v1/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
        accessToken: token,
      });
      window.dispatchEvent(new Event(notificationChangeEvent));
      setItems(
        (current) =>
          current?.map((item) =>
            item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
          ) ?? null,
      );
    } catch {
      setReadError(
        locale === 'vi'
          ? 'Chưa đánh dấu đã đọc được. Hãy thử lại.'
          : 'Could not mark as read. Try again.',
      );
    } finally {
      setMarking(null);
    }
  };
  return (
    <section className="notification-items">
      <p role="status">
        {items.slice(0, 30).filter((item) => !item.readAt).length}{' '}
        {locale === 'vi'
          ? 'thông báo chưa đọc trong danh sách'
          : 'unread notifications in this list'}
      </p>
      {readError && <p role="alert">{readError}</p>}
      {items.slice(0, 30).map((item) => {
        const href = item.bountySlug
          ? item.submissionId
            ? `/${locale}/dashboard/bounties/${encodeURIComponent(item.bountySlug)}/submissions/${encodeURIComponent(item.submissionId)}`
            : `/${locale}/bounties/${encodeURIComponent(item.bountySlug)}`
          : null;
        const title =
          typeof item.payload.title === 'string'
            ? item.payload.title
            : item.type === 'bounty_winner'
              ? locale === 'vi'
                ? 'Có kết quả mới từ Bounty của bạn.'
                : 'Your Bounty has a new result.'
              : locale === 'vi'
                ? 'Có cập nhật mới cho công việc của bạn.'
                : 'There is a new update for your work.';
        return (
          <article key={item.id} className="notification-item">
            <Bell size={19} aria-hidden="true" />
            <div>
              <time dateTime={item.createdAt}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(item.createdAt))}
              </time>
              <p>{title}</p>
              {href ? (
                <Link href={href}>
                  {item.submissionId
                    ? locale === 'vi'
                      ? 'Xem bài nộp'
                      : 'View submission'
                    : locale === 'vi'
                      ? 'Xem Bounty'
                      : 'View Bounty'}{' '}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              ) : (
                <p>
                  {locale === 'vi'
                    ? 'Nội dung liên quan chưa có đường dẫn khả dụng.'
                    : 'The related content has no available link.'}
                </p>
              )}
              {!item.readAt && (
                <button
                  type="button"
                  disabled={marking !== null}
                  onClick={() => void markRead(item.id)}
                >
                  {marking === item.id
                    ? locale === 'vi'
                      ? 'Đang lưu…'
                      : 'Saving…'
                    : locale === 'vi'
                      ? 'Đánh dấu đã đọc'
                      : 'Mark as read'}
                </button>
              )}
            </div>
          </article>
        );
      })}
      <CatalogPagination
        locale={locale}
        page={pageNumber}
        hasNext={items.length > 30}
        path={`/${locale}/notifications`}
      />
    </section>
  );
}

export function NotificationList(props: Parameters<typeof NotificationListContent>[0]) {
  const { session } = useAuth();
  const query = useSearchParams();
  return (
    <NotificationListContent
      key={`${session?.id ?? 'guest'}:${query.get('page') ?? '1'}`}
      {...props}
    />
  );
}
