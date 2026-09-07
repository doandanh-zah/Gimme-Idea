'use client';

import { matchesSearch } from '@/lib/search';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { EmptySurface } from '@/components/app-surfaces';
import type { IdeaDetailDTO, Locale, ProblemDetailDTO } from '@gimme-idea/contracts';
import { KnowledgePost, type KnowledgePostItem } from '@/components/knowledge-post';
import { getLocalKnowledgePosts, subscribeSocial, type LocalKnowledgePost } from '@/lib/social';

export function KnowledgeFeed({
  locale,
  kind,
  initialItems,
}: {
  locale: Locale;
  kind: 'idea' | 'problem';
  initialItems: Array<IdeaDetailDTO | ProblemDetailDTO>;
}) {
  const [query, setQuery] = useState('');
  const matches = (title: string) => matchesSearch(title, query);
  const [cachedItems, setLocalItems] = useState<LocalKnowledgePost[]>([]);

  useEffect(() => {
    const sync = () => setLocalItems(getLocalKnowledgePosts(kind));
    sync();
    return subscribeSocial(sync);
  }, [kind]);

  const localItems = cachedItems.filter(
    (local) => !initialItems.some((item) => item.id === local.id || item.slug === local.slug),
  );

  return (
    <>
      <div className="feed-search">
        <Search size={18} aria-hidden="true" />
        <label className="sr-only" htmlFor="knowledge-search">
          {locale === 'vi' ? 'Tìm trong danh sách' : 'Search this collection'}
        </label>
        <input
          id="knowledge-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={locale === 'vi' ? 'Tìm theo tiêu đề…' : 'Search by title…'}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={locale === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="v1-result-count" role="status">
        {initialItems.filter((item) => matches(item.title)).length +
          localItems.filter((item) => matches(item.title)).length}{' '}
        {locale === 'vi' ? 'nội dung trong danh sách' : 'items in this collection'}
      </p>
      {!initialItems.some((item) => matches(item.title)) &&
        !localItems.some((item) => matches(item.title)) && (
          <EmptySurface
            title={locale === 'vi' ? 'Chưa có kết quả phù hợp' : 'No matching results'}
            body={
              locale === 'vi'
                ? 'Thử từ khóa khác hoặc tìm trong toàn bộ mạng lưới.'
                : 'Try another phrase or search across the network.'
            }
            action={
              <Link href={`/${locale}/search?q=${encodeURIComponent(query)}`}>
                {locale === 'vi' ? 'Tìm trong mạng lưới' : 'Search the network'}
              </Link>
            }
          />
        )}
      <section className="feed-stream" aria-label={kind === 'idea' ? 'Ideas' : 'Problems'}>
        {localItems
          .filter((item) => matches(item.title))
          .map((post) => {
            const item: KnowledgePostItem = { kind, data: post, local: true };
            return (
              <KnowledgePost
                key={post.id}
                locale={locale}
                href={`/${locale}/${kind === 'idea' ? 'ideas' : 'problems'}/${post.slug}`}
                item={item}
              />
            );
          })}
        {initialItems
          .filter((item) => matches(item.title))
          .map((data) => (
            <KnowledgePost
              key={data.id}
              locale={locale}
              href={`/${locale}/${kind === 'idea' ? 'ideas' : 'problems'}/${data.slug}`}
              item={{ kind, data } as KnowledgePostItem}
            />
          ))}
      </section>
    </>
  );
}
