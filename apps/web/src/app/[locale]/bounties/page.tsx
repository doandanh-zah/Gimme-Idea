import type { Metadata } from 'next';
import Link from 'next/link';
import { CatalogPagination } from '@/components/catalog-pagination';
import { catalogPage, catalogPageSize } from '@/lib/pagination';
import { notFound } from 'next/navigation';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { BountyCard } from '@/components/v1-cards';
import { bountyClient } from '@/lib/domain/client';
import { copy, isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Bounties — compete on direction and execution',
  description: 'Idea and Build competitions attached to public Problems.',
};

export default async function BountiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ stage?: string; page?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const stage = query.stage === 'idea' || query.stage === 'build' ? query.stage : undefined;
  const page = catalogPage(query.page);
  const rows = await bountyClient.list(stage, (page - 1) * catalogPageSize, catalogPageSize + 1);
  const items = rows.slice(0, catalogPageSize);

  return (
    <main id="main" className="app-page v1-index-page">
      <AppPageHeader
        eyebrow="OPPORTUNITY / TWO STAGES"
        title={t.shell.bounties}
        summary={
          locale === 'vi'
            ? 'Cạnh tranh riêng tư về hướng giải trước, sau đó cạnh tranh riêng tư về khả năng thực thi.'
            : 'Compete privately on direction first, then compete privately on execution.'
        }
      />
      <div
        className="v1-bounty-loop"
        tabIndex={0}
        aria-label={locale === 'vi' ? 'Hai giai đoạn bounty' : 'Two bounty stages'}
      >
        <span>PROBLEM</span>
        <i aria-hidden="true" />
        <strong>IDEA BOUNTY</strong>
        <i aria-hidden="true" />
        <span>SELECTED IDEA</span>
        <i aria-hidden="true" />
        <strong>BUILD BOUNTY</strong>
        <i aria-hidden="true" />
        <span>OUTCOME</span>
      </div>
      <nav className="v1-filter-tabs" aria-label={locale === 'vi' ? 'Loại Bounty' : 'Bounty stage'}>
        <Link
          href={`/${locale}/bounties`}
          className={!stage ? 'is-active' : ''}
          aria-current={!stage ? 'page' : undefined}
          scroll={false}
        >
          {locale === 'vi' ? 'Tất cả' : 'All'}
        </Link>
        <Link
          href={`/${locale}/bounties?stage=idea`}
          className={stage === 'idea' ? 'is-active' : ''}
          aria-current={stage === 'idea' ? 'page' : undefined}
          scroll={false}
        >
          Idea Bounties
        </Link>
        <Link
          href={`/${locale}/bounties?stage=build`}
          className={stage === 'build' ? 'is-active' : ''}
          aria-current={stage === 'build' ? 'page' : undefined}
          scroll={false}
        >
          Build Bounties
        </Link>
      </nav>
      <p className="v1-result-count" role="status">
        {items.length} {locale === 'vi' ? 'bounty trong danh sách' : 'bounties in this collection'}
      </p>
      {items.length === 0 && (
        <EmptySurface
          title={
            locale === 'vi' ? 'Chưa có bounty ở giai đoạn này' : 'No bounties at this stage yet'
          }
          body={
            locale === 'vi'
              ? 'Khám phá vấn đề trong lúc chờ cơ hội phù hợp.'
              : 'Explore the problem network while you look for your next opportunity.'
          }
          action={
            <Link href={`/${locale}/problems`}>
              {locale === 'vi' ? 'Khám phá vấn đề' : 'Explore Problems'}
            </Link>
          }
        />
      )}
      <section className="v1-feed">
        {items.map((bounty) => (
          <BountyCard key={bounty.slug} bounty={bounty} locale={locale} />
        ))}
      </section>
      <aside className="v1-dev-diagnostic-link">
        <span>
          {locale === 'vi'
            ? 'Tìm chẩn đoán Solana Devnet?'
            : 'Looking for Solana Devnet diagnostics?'}
        </span>
        <Link href="/devnet-bounty">/devnet-bounty</Link>
      </aside>
      <CatalogPagination
        locale={locale}
        path={`/${locale}/bounties`}
        page={page}
        hasNext={rows.length > catalogPageSize}
        query={{ stage }}
      />
    </main>
  );
}
