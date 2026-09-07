import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { isLocale } from '@/lib/i18n';
export const metadata: Metadata = {
  title: 'Operational review',
  robots: { index: false, follow: false },
};
export default async function AdminReview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main" className="app-page v1-admin-page">
      <AppPageHeader
        eyebrow={locale === 'vi' ? 'QUẢN TRỊ' : 'OPERATIONS'}
        title={locale === 'vi' ? 'Kiểm duyệt nội dung' : 'Content review'}
        summary={
          locale === 'vi'
            ? 'Công cụ dành cho người quản trị được cấp quyền.'
            : 'Tools for authorized administrators.'
        }
      />
      <EmptySurface
        title={
          locale === 'vi'
            ? 'Công cụ kiểm duyệt chưa khả dụng'
            : 'Review tools are not available yet'
        }
        body={
          locale === 'vi'
            ? 'Chưa có hàng đợi hoặc thao tác kiểm duyệt được kết nối trên màn hình này.'
            : 'Review queues and actions are not connected on this screen yet.'
        }
      />
    </main>
  );
}
