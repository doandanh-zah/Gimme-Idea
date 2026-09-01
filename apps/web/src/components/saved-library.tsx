'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { EmptySurface } from '@/components/app-surfaces';
import { KnowledgePost } from '@/components/knowledge-post';
import { QuotePostCard, useQuotes } from '@/components/quote-post';
import { getSocialState, itemKey, quoteKey, subscribeSocial } from '@/lib/social';
import type { KnowledgePostItem } from '@/components/knowledge-post';

export function SavedLibrary({
  locale,
  tab,
  items,
}: {
  locale: Locale;
  tab: 'bookmarks' | 'likes';
  items: KnowledgePostItem[];
}) {
  const [keys, setKeys] = useState<string[]>([]);
  const quotes = useQuotes();

  useEffect(() => {
    const sync = () => {
      const state = getSocialState();
      setKeys(tab === 'likes' ? state.likes : state.bookmarks);
    };
    sync();
    return subscribeSocial(sync);
  }, [tab]);

  const saved = items.filter((item) => keys.includes(itemKey(item.kind, item.data.slug)));
  const savedQuotes = quotes.filter((quote) => keys.includes(quoteKey(quote.id)));
  if (saved.length === 0 && savedQuotes.length === 0) {
    const isLikes = tab === 'likes';
    return (
      <EmptySurface
        title={
          isLikes
            ? locale === 'vi'
              ? 'Chưa có nội dung được thích'
              : 'No liked posts yet'
            : locale === 'vi'
              ? 'Chưa có nội dung được đánh dấu'
              : 'No bookmarks yet'
        }
        body={
          isLikes
            ? locale === 'vi'
              ? 'Bấm biểu tượng tim trên một bài viết để lưu vào tab này.'
              : 'Like a post to keep it in this tab.'
            : locale === 'vi'
              ? 'Bấm bookmark trên một bài viết để lưu vào đây.'
              : 'Bookmark a post to keep it here.'
        }
      />
    );
  }

  return (
    <section className="feed-stream" aria-label={locale === 'vi' ? 'Đã lưu' : 'Bookmarks'}>
      {savedQuotes.map((quote) => (
        <QuotePostCard key={quote.id} locale={locale} post={quote} />
      ))}
      {saved.map((item) => (
        <KnowledgePost
          key={item.data.id}
          locale={locale}
          href={`/${locale}/${item.kind === 'idea' ? 'ideas' : 'problems'}/${item.data.slug}`}
          item={item}
        />
      ))}
    </section>
  );
}
