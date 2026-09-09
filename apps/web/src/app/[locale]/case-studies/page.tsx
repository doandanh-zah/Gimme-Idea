import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { CaseStudiesExplorer } from '@/components/case-studies-explorer';
import { getAllCaseStudies } from '@/lib/case-studies';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Case Studies & Idea Bank — Gimme Idea',
  description: '100+ vetted hackathon, open-source and unicorn case studies linked to real-world problems and builder takeaways.',
};

export default async function CaseStudiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const caseStudies = getAllCaseStudies();

  return (
    <main id="main" className="app-page v1-index-page">
      <AppPageHeader
        eyebrow="IDEA BANK / CASE STUDIES"
        title={locale === 'vi' ? 'Kho Ý Tưởng & Case Studies' : 'Idea Bank & Case Studies'}
        summary={
          locale === 'vi'
            ? 'Thư viện 100+ tiền lệ hackathon, dự án open-source và kỳ lân công nghệ được bóc tách theo bài toán cốt lõi, giải pháp và bài học thực chiến.'
            : 'A curated repository of 100+ hackathon, open-source, and unicorn builds analyzed through primary problems, solution theses, and builder takeaways.'
        }
      />
      <CaseStudiesExplorer initialItems={caseStudies} locale={locale} />
    </main>
  );
}
