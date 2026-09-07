import { notFound } from 'next/navigation';
import { LegalDocument, legalMetadata } from '@/components/legal-document';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return legalMetadata(locale, 'terms');
}
export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalDocument locale={locale} kind="terms" />;
}
