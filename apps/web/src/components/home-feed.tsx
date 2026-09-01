'use client';

import Link from 'next/link';
import type { Locale } from '@gimme-idea/contracts';
import { EmptySurface } from '@/components/app-surfaces';
import { QuotePostCard, useQuotes } from '@/components/quote-post';

export function HomeQuoteFeed({ locale }: { locale: Locale }) {
  const quotes = useQuotes();

  if (quotes.length === 0) {
    return (
      <EmptySurface
        title={locale === 'vi' ? 'Home là nơi quote sống' : 'Home is for quotes'}
        body={
          locale === 'vi'
            ? 'Quote một Problem hoặc Idea để bài viết xuất hiện tại đây. Bản foundation lưu tương tác trên thiết bị này.'
            : 'Quote a Problem or Idea and it will land here. Foundation interactions stay on this device.'
        }
        action={
          <div className="home-quote-actions">
            <Link className="button button-primary" href={`/${locale}/problems`}>
              {locale === 'vi' ? 'Xem Problems' : 'Browse problems'}
            </Link>
            <Link className="button button-quiet" href={`/${locale}/ideas`}>
              {locale === 'vi' ? 'Xem Ideas' : 'Browse ideas'}
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <section className="feed-stream" aria-label="Home feed">
      {quotes.map((post) => (
        <QuotePostCard key={post.id} locale={locale} post={post} />
      ))}
    </section>
  );
}
