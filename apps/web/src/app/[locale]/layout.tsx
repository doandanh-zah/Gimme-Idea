import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProductFrame } from '@/components/product-frame';
import { copy, isLocale, locales } from '@/lib/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <ProductFrame locale={locale} labels={t.shell}>
      {children}
    </ProductFrame>
  );
}
