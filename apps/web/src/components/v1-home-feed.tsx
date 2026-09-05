'use client';

import Link from 'next/link';
import { History, Lightbulb, Target } from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import type { HomeFeedItem } from '@/lib/domain/types';
import { BountyCard, ProblemDiscoveryCard, ProjectCard, UpdateCard } from '@/components/v1-cards';
import { QuotePostCard, useQuotes } from '@/components/quote-post';

export function V1HomeFeed({ locale, items }: { locale: Locale; items: HomeFeedItem[] }) {
  const quotes = useQuotes();
  return (
    <>
      <nav
        className="v1-intent-strip"
        aria-label={locale === 'vi' ? 'Bạn muốn làm gì?' : 'What do you want to do?'}
      >
        <Link href={`/${locale}/bounties?stage=idea`}>
          <Lightbulb size={15} aria-hidden="true" />
          {locale === 'vi' ? 'Kiếm tiền bằng Idea' : 'Earn with an Idea'}
        </Link>
        <Link href={`/${locale}/bounties?stage=build`}>
          <Target size={15} aria-hidden="true" />
          {locale === 'vi' ? 'Build cho Bounty' : 'Build for a Bounty'}
        </Link>
        <Link href={`/${locale}/problems`}>
          <Target size={15} aria-hidden="true" />
          {locale === 'vi' ? 'Khám phá Problem' : 'Explore Problems'}
        </Link>
        <Link href={`/${locale}/projects?filter=historical`}>
          <History size={15} aria-hidden="true" />
          {locale === 'vi' ? 'Xem điều đã thử' : 'See What Was Tried'}
        </Link>
      </nav>
      <section
        className="v1-feed"
        aria-label={locale === 'vi' ? 'Cơ hội và tri thức' : 'Knowledge and opportunities'}
      >
        {items.map((item) => {
          if (item.type === 'bounty')
            return (
              <BountyCard key={`bounty-${item.bounty.slug}`} bounty={item.bounty} locale={locale} />
            );
          if (item.type === 'problem')
            return (
              <ProblemDiscoveryCard
                key={`problem-${item.problem.slug}`}
                problem={item.problem}
                locale={locale}
                ideaCount={item.ideaCount}
                archiveCount={item.archiveCount}
              />
            );
          if (item.type === 'project')
            return (
              <ProjectCard
                key={`project-${item.project.slug}`}
                project={item.project}
                locale={locale}
              />
            );
          return (
            <UpdateCard
              key={item.id}
              locale={locale}
              label={item.label}
              title={item.title}
              body={item.body}
              href={item.href}
            />
          );
        })}
        {quotes.length > 0 && (
          <div className="v1-quote-activity">
            <p className="v1-section-label">
              {locale === 'vi' ? 'THẢO LUẬN CÓ NGỮ CẢNH' : 'CONTEXTUAL DISCUSSION'}
            </p>
            {quotes.map((post) => (
              <QuotePostCard key={post.id} locale={locale} post={post} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
