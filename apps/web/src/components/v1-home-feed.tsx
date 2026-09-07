'use client';

import { matchesSearch } from '@/lib/search';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Blocks, Lightbulb, Search, Target, X } from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import type { HomeFeedItem } from '@/lib/domain/types';
import { BountyCard, ProblemDiscoveryCard, ProjectCard, UpdateCard } from '@/components/v1-cards';
import { QuotePostCard, useQuotes } from '@/components/quote-post';

export function V1HomeFeed({ locale, items }: { locale: Locale; items: HomeFeedItem[] }) {
  const vi = locale === 'vi';
  const quotes = useQuotes();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const feed = useRef<HTMLElement>(null);
  const visibleItems = items.filter((item) => {
    const title =
      item.type === 'bounty'
        ? item.bounty.title
        : item.type === 'problem'
          ? item.problem.title
          : item.type === 'project'
            ? item.project.name
            : item.title;
    return (filter === 'all' || item.type === filter) && matchesSearch(title, query);
  });
  const filters: [string, string][] = [
    ['all', vi ? 'Khám phá' : 'Explore'],
    ['problem', vi ? 'Vấn đề' : 'Problems'],
    ['bounty', 'Bounties'],
    ['project', vi ? 'Dự án' : 'Projects'],
  ];

  useEffect(() => {
    const root = feed.current;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || media.matches) return;
    const started = performance.now();
    let cancelled = false;
    let animation: { revert: () => void } | undefined;
    const stop = () => {
      if (media.matches) animation?.revert();
    };
    media.addEventListener('change', stop);
    void import('animejs')
      .then(({ animate }) => {
        if (cancelled || media.matches || performance.now() - started > 150) return;
        animation = animate(root, { opacity: [0.5, 1], y: [5, 0], duration: 220, ease: 'out(3)' });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      animation?.revert();
      media.removeEventListener('change', stop);
    };
  }, [filter]);

  return (
    <>
      <details className="feed-introduction">
        <summary>
          {vi
            ? 'Mới đến Gimme Idea? Xem cách bắt đầu'
            : 'New to Gimme Idea? See how to get started'}
        </summary>
        <section className="discovery-feature">
          <div className="discovery-feature-copy">
            <span className="feature-eyebrow">
              {vi ? 'MỘT GÓC NHÌN KHÁC. MỘT KHỞI ĐẦU MỚI.' : 'A FRESH PERSPECTIVE. A NEW START.'}
            </span>
            <h2>
              {vi ? (
                <>
                  Vấn đề thật.
                  <br />
                  <em>Ý tưởng có giá trị.</em>
                </>
              ) : (
                <>
                  Real problems.
                  <br />
                  <em>Remarkable possibilities.</em>
                </>
              )}
            </h2>
            <p>
              {vi
                ? 'Tìm điều đáng giải quyết. Hiểu những gì đã thử. Bắt đầu điều tiếp theo.'
                : 'Find what needs solving. Learn what was tried. Build what comes next.'}
            </p>
            <Link href={`/${locale}/problems`}>
              {vi ? 'Khám phá vấn đề' : 'Explore the problems'}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
          <div className="feature-network" aria-hidden="true">
            <svg viewBox="0 0 220 240">
              <path
                d="M40 50 160 35 185 150 80 195 40 50 185 150M40 50 115 105 160 35M115 105 80 195"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle cx="40" cy="50" r="19" />
              <circle cx="160" cy="35" r="8" />
              <circle cx="185" cy="150" r="26" />
              <circle cx="80" cy="195" r="12" />
              <circle cx="115" cy="105" r="5" />
            </svg>
            <span>PROBLEM → IDEA → BUILD</span>
          </div>
        </section>
        <nav
          className="discovery-paths"
          aria-label={vi ? 'Chọn bước tiếp theo' : 'Choose your next step'}
        >
          {[
            {
              href: '/ideas',
              icon: Lightbulb,
              title: vi ? 'Tìm cảm hứng' : 'Find inspiration',
              text: vi ? 'Khám phá các hướng giải' : 'Explore fresh approaches',
            },
            {
              href: '/bounties',
              icon: Target,
              title: vi ? 'Nhận thử thách' : 'Take a challenge',
              text: vi ? 'Tìm bounty phù hợp' : 'Find your next bounty',
            },
            {
              href: '/projects',
              icon: Blocks,
              title: vi ? 'Học từ thực tế' : 'Learn from builds',
              text: vi ? 'Những gì đã được thử' : 'See what was already tried',
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={`/${locale}${href}`}>
              <Icon size={21} aria-hidden="true" />
              <strong>{title}</strong>
              <small>{text}</small>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </details>
      <div className="feed-section-heading">
        <h2>{vi ? 'Trong mạng lưới' : 'From the network'}</h2>
        <span>{vi ? 'KHÁM PHÁ · KẾT NỐI · XÂY DỰNG' : 'DISCOVER · CONNECT · BUILD'}</span>
      </div>
      <div className="feed-toolbar">
        <div className="feed-filters" role="group" aria-label={vi ? 'Lọc nội dung' : 'Filter feed'}>
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <span aria-live="polite">
          {visibleItems.length} {vi ? 'bài viết' : 'posts'}
        </span>
      </div>
      <div className="feed-search">
        <Search size={17} aria-hidden="true" />
        <label className="sr-only" htmlFor="filter-feed">
          {vi ? 'Tìm trong bảng tin' : 'Search this feed'}
        </label>
        <input
          id="filter-feed"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={vi ? 'Tìm điều bạn quan tâm…' : 'Find something that interests you…'}
        />
        {query && (
          <button
            type="button"
            aria-label={vi ? 'Xóa tìm kiếm' : 'Clear search'}
            onClick={() => setQuery('')}
          >
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      <section
        ref={feed}
        className="v1-feed"
        aria-label={vi ? 'Cơ hội và tri thức' : 'Knowledge and opportunities'}
      >
        {visibleItems.length === 0 && (
          <div className="app-empty-state">
            <Search size={32} aria-hidden="true" />
            <h2>{vi ? 'Chưa tìm thấy nội dung phù hợp' : 'No matching discoveries yet'}</h2>
            <p>
              {vi
                ? 'Thử một từ khóa khác hoặc xem toàn bộ bảng tin.'
                : 'Try a different phrase or explore the full feed.'}
            </p>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                setFilter('all');
                setQuery('');
              }}
            >
              {vi ? 'Xem tất cả' : 'Reset filters'}
            </button>
          </div>
        )}
        {visibleItems.map((item) => {
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
        {filter === 'all' && !query && quotes.length > 0 && (
          <div className="v1-quote-activity">
            <p className="v1-section-label">
              {vi ? 'THẢO LUẬN CÓ NGỮ CẢNH' : 'CONTEXTUAL DISCUSSION'}
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
