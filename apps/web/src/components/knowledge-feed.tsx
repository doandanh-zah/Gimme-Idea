'use client';

import { useEffect, useState } from 'react';
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
  const [localItems, setLocalItems] = useState<LocalKnowledgePost[]>([]);

  useEffect(() => {
    const sync = () => setLocalItems(getLocalKnowledgePosts(kind));
    sync();
    return subscribeSocial(sync);
  }, [kind]);

  return (
    <section className="feed-stream" aria-label={kind === 'idea' ? 'Ideas' : 'Problems'}>
      {localItems.map((post) => {
        const item: KnowledgePostItem = { kind, data: post, local: true };
        return (
          <KnowledgePost
            key={post.id}
            locale={locale}
            href={`/${locale}/${kind === 'idea' ? 'ideas' : 'problems'}#post-${post.id}`}
            item={item}
          />
        );
      })}
      {initialItems.map((data) => (
        <KnowledgePost
          key={data.id}
          locale={locale}
          href={`/${locale}/${kind === 'idea' ? 'ideas' : 'problems'}/${data.slug}`}
          item={{ kind, data } as KnowledgePostItem}
        />
      ))}
    </section>
  );
}
