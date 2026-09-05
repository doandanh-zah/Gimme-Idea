import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n';

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/home`);
}
