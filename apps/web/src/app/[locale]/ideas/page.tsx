import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { KnowledgeFeed } from '@/components/knowledge-feed';
import { getIdea } from '@/lib/api';
import { ideaClient } from '@/lib/domain/client';
import { CatalogPagination } from '@/components/catalog-pagination';
import { catalogPage, catalogPageSize } from '@/lib/pagination';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function IdeasFeed({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const page = catalogPage(query.page);
  const rows = await ideaClient.list((page - 1) * catalogPageSize, catalogPageSize + 1);
  const items = (
    await Promise.all(rows.slice(0, catalogPageSize).map((row) => getIdea(String(row.slug))))
  ).filter((item) => item !== null);

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="EXPLORE / IDEAS"
        title={t.shell.ideas}
        summary={
          locale === 'vi'
            ? 'Các hướng giải quyết có Primary Problem và nguồn nghiên cứu rõ ràng.'
            : 'Buildable approaches with a clear Primary Problem and research trail.'
        }
      />
      <aside className="catalog-intro is-idea">
        <p>
          {locale === 'vi'
            ? 'Mỗi ý tưởng bắt đầu từ một vấn đề thật. Bạn có một góc nhìn khác?'
            : 'Every idea starts with a real problem. Have a different perspective?'}
        </p>
        <div className="flex gap-4 items-center">
          <Link href={`/${locale}/case-studies`} className="text-[var(--yellow,#f9d65c)] hover:underline inline-flex items-center gap-1">
            {locale === 'vi' ? 'Kho Case Studies (102 hồ sơ)' : 'Case Studies Bank (102 cases)'}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/create/idea`}>
            {locale === 'vi' ? 'Đề xuất ý tưởng' : 'Propose an idea'}
            <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </aside>
      <KnowledgeFeed locale={locale} kind="idea" initialItems={items} />
      <CatalogPagination
        locale={locale}
        path={`/${locale}/ideas`}
        page={page}
        hasNext={rows.length > catalogPageSize}
      />
    </main>
  );
}
