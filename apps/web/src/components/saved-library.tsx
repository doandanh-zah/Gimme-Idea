'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { EmptySurface } from '@/components/app-surfaces';
import { KnowledgePost } from '@/components/knowledge-post';
import { QuotePostCard, useQuotes } from '@/components/quote-post';
import {
  getLocalKnowledgePosts,
  getSocialState,
  itemKey,
  quoteKey,
  subscribeSocial,
  type LocalKnowledgePost,
} from '@/lib/social';
import type { KnowledgePostItem } from '@/components/knowledge-post';
import type { BountyModel, ProjectModel } from '@/lib/domain/types';
import { BountyCard, ProjectCard } from '@/components/v1-cards';

export function SavedLibrary({
  locale,
  tab,
  items,
  projects,
  bounties,
}: {
  locale: Locale;
  tab: 'bookmarks' | 'likes';
  items: KnowledgePostItem[];
  projects: ProjectModel[];
  bounties: BountyModel[];
}) {
  const [keys, setKeys] = useState<string[]>([]);
  const [localItems, setLocalItems] = useState<LocalKnowledgePost[]>([]);
  const quotes = useQuotes();

  useEffect(() => {
    const sync = () => {
      const state = getSocialState();
      setKeys(tab === 'likes' ? state.likes : state.bookmarks);
      setLocalItems(getLocalKnowledgePosts());
    };
    sync();
    return subscribeSocial(sync);
  }, [tab]);

  const saved = items.filter((item) => keys.includes(itemKey(item.kind, item.data.slug)));
  const savedLocal = localItems.filter((item) => keys.includes(itemKey(item.kind, item.slug)));
  const savedQuotes = quotes.filter((quote) => keys.includes(quoteKey(quote.id)));
  const savedProjects = projects.filter((project) =>
    keys.includes(itemKey('project', project.slug)),
  );
  const savedBounties = bounties.filter((bounty) => keys.includes(itemKey('bounty', bounty.slug)));
  if (
    saved.length === 0 &&
    savedLocal.length === 0 &&
    savedQuotes.length === 0 &&
    savedProjects.length === 0 &&
    savedBounties.length === 0
  ) {
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
              ? 'Bấm biểu tượng bóng đèn trên một bài viết để lưu vào tab này.'
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
      {savedBounties.map((bounty) => (
        <BountyCard key={bounty.slug} bounty={bounty} locale={locale} />
      ))}
      {savedProjects.map((project) => (
        <ProjectCard key={project.slug} project={project} locale={locale} />
      ))}
      {savedQuotes.map((quote) => (
        <QuotePostCard key={quote.id} locale={locale} post={quote} />
      ))}
      {savedLocal.map((post) => (
        <KnowledgePost
          key={post.id}
          locale={locale}
          href={`/${locale}/${post.kind === 'idea' ? 'ideas' : 'problems'}/${post.slug}`}
          item={{ kind: post.kind, data: post, local: true }}
        />
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
