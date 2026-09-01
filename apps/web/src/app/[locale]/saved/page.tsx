import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { SavedLibrary } from '@/components/saved-library';
import { getIdea, getProblem } from '@/lib/api';
import { copy, isLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function SavedPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const activeTab = query.tab === 'likes' ? 'likes' : 'bookmarks';
  const [problemA, problemB, idea] = await Promise.all([
    getProblem('restaurant-food-waste'),
    getProblem('tenant-repair-visibility'),
    getIdea('demand-pulse-for-kitchens'),
  ]);
  const items = [
    ...(problemA ? [{ kind: 'problem' as const, data: problemA }] : []),
    ...(problemB ? [{ kind: 'problem' as const, data: problemB }] : []),
    ...(idea ? [{ kind: 'idea' as const, data: idea }] : []),
  ];

  return (
    <main id="main" className="app-page">
      <AppPageHeader
        eyebrow="LIBRARY / SAVED"
        title={t.shell.saved}
        summary={
          locale === 'vi'
            ? 'Những nội dung bạn đánh dấu hoặc đã thích.'
            : 'Knowledge objects you bookmarked or liked.'
        }
      />
      <nav className="saved-tabs" aria-label={t.shell.saved}>
        <Link
          href={`/${locale}/saved?tab=bookmarks`}
          className={activeTab === 'bookmarks' ? 'is-active' : ''}
          aria-current={activeTab === 'bookmarks' ? 'page' : undefined}
        >
          {t.shell.bookmarks}
        </Link>
        <Link
          href={`/${locale}/saved?tab=likes`}
          className={activeTab === 'likes' ? 'is-active' : ''}
          aria-current={activeTab === 'likes' ? 'page' : undefined}
        >
          {t.shell.likes}
        </Link>
      </nav>
      <SavedLibrary locale={locale} tab={activeTab} items={items} />
    </main>
  );
}
