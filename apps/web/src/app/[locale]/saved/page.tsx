import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { copy, isLocale } from '@/lib/i18n';

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
      <EmptySurface
        title={
          activeTab === 'bookmarks'
            ? locale === 'vi'
              ? 'Chưa có nội dung được đánh dấu'
              : 'No bookmarks yet'
            : locale === 'vi'
              ? 'Chưa có nội dung được thích'
              : 'No liked posts yet'
        }
        body={
          locale === 'vi'
            ? 'Nội dung đã lưu sẽ xuất hiện sau khi authentication và social actions được kết nối.'
            : 'Saved content will appear after authentication and social actions are connected.'
        }
      />
    </main>
  );
}
