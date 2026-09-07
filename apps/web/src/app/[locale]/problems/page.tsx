import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { KnowledgeFeed } from '@/components/knowledge-feed';
import { getProblem } from '@/lib/api';
import { problemClient } from '@/lib/domain/client';
import { CatalogPagination } from '@/components/catalog-pagination';
import { catalogPage, catalogPageSize } from '@/lib/pagination';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ProblemsFeed({
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
  const rows = await problemClient.list((page - 1) * catalogPageSize, catalogPageSize + 1);
  const items = (
    await Promise.all(rows.slice(0, catalogPageSize).map((row) => getProblem(String(row.slug))))
  ).filter((item) => item !== null);

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="EXPLORE / PROBLEMS"
        title={t.shell.problems}
        summary={
          locale === 'vi'
            ? 'Những vấn đề thực tế cần được hiểu rõ trước khi đề xuất giải pháp.'
            : 'Real problems to understand before proposing a solution.'
        }
      />
      <aside className="catalog-intro">
        <p>
          {locale === 'vi'
            ? 'Bạn thấy điều gì chưa được giải quyết? Đó có thể là khởi đầu cho một ý tưởng.'
            : 'Notice something that needs fixing? That could be the start of something.'}
        </p>
        <Link href={`/${locale}/create/problem`}>
          {locale === 'vi' ? 'Đăng vấn đề' : 'Post a problem'}
          <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </aside>
      <KnowledgeFeed locale={locale} kind="problem" initialItems={items} />
      <CatalogPagination
        locale={locale}
        path={`/${locale}/problems`}
        page={page}
        hasNext={rows.length > catalogPageSize}
      />
    </main>
  );
}
