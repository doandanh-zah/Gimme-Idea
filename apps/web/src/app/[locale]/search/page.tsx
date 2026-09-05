import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { DataOriginBadge } from '@/components/v1-primitives';
import { searchPublicCatalog } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; mode?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const q = query.q?.trim() ?? '';
  const results = await searchPublicCatalog(locale, q);
  return (
    <main id="main" className="app-page v1-search-page">
      <AppPageHeader
        eyebrow="DISCOVERY / PUBLIC CATALOG"
        title={locale === 'vi' ? 'Tìm kiếm' : 'Search'}
        summary={
          locale === 'vi'
            ? 'Tìm Problem, Idea công khai, Project, build lịch sử, Bounty và Organization.'
            : 'Find Problems, public Ideas, Projects, historical builds, Bounties and Organizations.'
        }
      />
      <form className="v1-search-form" role="search" action={`/${locale}/search`}>
        <label htmlFor="catalog-search">
          {locale === 'vi' ? 'Tìm trong catalog công khai' : 'Search the public catalog'}
        </label>
        <div>
          <Search size={19} aria-hidden="true" />
          <input
            id="catalog-search"
            type="search"
            name="q"
            defaultValue={q}
            autoComplete="off"
            placeholder={
              locale === 'vi' ? 'Thử “restaurant food waste”' : 'Try “restaurant food waste”'
            }
          />
          <button type="submit">{locale === 'vi' ? 'Tìm' : 'Search'}</button>
        </div>
        <p>
          {locale === 'vi'
            ? 'Private submissions và restricted content không nằm trong index này.'
            : 'Private submissions and restricted content are excluded from this index.'}
        </p>
      </form>
      <div className="v1-search-mode">
        <Link
          className={!query.mode ? 'is-active' : ''}
          href={`/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`}
        >
          Search
        </Link>
        <Link
          className={query.mode === 'similar' ? 'is-active' : ''}
          href={`/${locale}/search?mode=similar${q ? `&q=${encodeURIComponent(q)}` : ''}`}
        >
          {locale === 'vi' ? 'Khám phá tương tự' : 'Explore Similar'}
        </Link>
      </div>
      <p className="v1-result-count">
        {results.length} {locale === 'vi' ? 'kết quả được phép xem' : 'authorized public results'}
      </p>
      {results.length ? (
        <section className="v1-search-results">
          {results.map((result) => (
            <Link key={`${result.type}-${result.href}`} href={result.href}>
              <span className={`v1-search-kind is-${result.type}`}>{result.type}</span>
              <span>
                <strong>{result.title}</strong>
                <p>{result.summary}</p>
                <DataOriginBadge origin={result.origin} locale={locale} />
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </section>
      ) : (
        <EmptySurface
          title={locale === 'vi' ? 'Không tìm thấy kết quả công khai' : 'No public results found'}
          body={
            locale === 'vi'
              ? 'Thử từ khóa rộng hơn. Nội dung riêng tư sẽ không bao giờ xuất hiện ở đây.'
              : 'Try a broader phrase. Private competition work will never appear here.'
          }
          action={
            <Link href={`/${locale}/problems`}>
              {locale === 'vi' ? 'Khám phá Problems' : 'Explore Problems'}
            </Link>
          }
        />
      )}
    </main>
  );
}
