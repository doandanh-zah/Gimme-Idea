'use client';

import Link from 'next/link';
import { ArrowRight, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { browserRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Notification = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};
export function NotificationList({ locale }: { locale: Locale }) {
  const { getAccessToken, session, hydrated } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!hydrated || !session) return;
    let active = true;
    void getAccessToken()
      .then((token) => browserRequest<Notification[]>('/v1/notifications', { accessToken: token }))
      .then((value) => {
        if (active) setItems(value ?? []);
      })
      .catch((caught) => {
        if (active)
          setError(caught instanceof Error ? caught.message : 'Notifications are unavailable.');
      });
    return () => {
      active = false;
    };
  }, [getAccessToken, hydrated, session]);
  if (error)
    return (
      <p className="v1-form-error" role="alert">
        {error}
      </p>
    );
  if (!session)
    return (
      <p className="empty-note">
        {locale === 'vi'
          ? 'Đăng nhập để xem thông báo riêng của bạn.'
          : 'Sign in to view your private notifications.'}
      </p>
    );
  if (items === null)
    return (
      <p className="empty-note" aria-live="polite">
        {locale === 'vi' ? 'Đang tải hoạt động…' : 'Loading activity…'}
      </p>
    );
  if (!items.length)
    return (
      <p className="empty-note">
        {locale === 'vi' ? 'Chưa có thông báo.' : 'No notifications yet.'}
      </p>
    );
  return (
    <section>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/${locale}/dashboard`}
          onClick={() => {
            void getAccessToken().then((token) =>
              browserRequest(`/v1/notifications/${item.id}/read`, {
                method: 'PATCH',
                accessToken: token,
              }),
            );
          }}
        >
          <Bell size={19} aria-hidden="true" />
          <span>
            <small>
              {item.type.replaceAll('_', ' ')} ·{' '}
              {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                new Date(item.createdAt),
              )}
            </small>
            <strong>
              {typeof item.payload.title === 'string'
                ? item.payload.title
                : locale === 'vi'
                  ? 'Có cập nhật mới cho công việc của bạn.'
                  : 'There is a new update for your work.'}
            </strong>
          </span>
          <ArrowRight size={17} aria-hidden="true" />
        </Link>
      ))}
    </section>
  );
}
