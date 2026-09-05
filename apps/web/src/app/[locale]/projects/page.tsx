import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppPageHeader, EmptySurface } from '@/components/app-surfaces';
import { ProjectCard } from '@/components/v1-cards';
import { projectClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Projects — build library',
  description: 'Public and historical builds connected to real Problems.',
};

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const all = await projectClient.list();
  const active = ['historical', 'community', 'winners', 'active'].includes(query.filter ?? '')
    ? query.filter!
    : 'all';
  const projects = all.filter(
    (project) =>
      active === 'all' ||
      (active === 'historical' && project.mode === 'historical_imported') ||
      (active === 'community' && project.mode === 'public_community') ||
      (active === 'active' && project.outcome.state === 'live') ||
      (active === 'winners' && Boolean(project.bountyResult)),
  );
  const filters = [
    ['all', locale === 'vi' ? 'Tất cả' : 'All'],
    ['historical', locale === 'vi' ? 'Build lịch sử' : 'Hackathon Builds'],
    ['community', locale === 'vi' ? 'Build cộng đồng' : 'Community Builds'],
    ['winners', locale === 'vi' ? 'Winner' : 'Winners'],
    ['active', locale === 'vi' ? 'Đang hoạt động' : 'Active'],
  ];
  return (
    <main id="main" className="app-page v1-index-page">
      <AppPageHeader
        eyebrow="BUILD LIBRARY / PROJECTS"
        title={locale === 'vi' ? 'Dự án' : 'Projects'}
        summary={
          locale === 'vi'
            ? 'Những gì đã được xây, đã chứng minh và đã học từ trước.'
            : 'What has been built, tested and learned before.'
        }
      />
      <nav
        className="v1-filter-tabs"
        aria-label={locale === 'vi' ? 'Lọc dự án' : 'Project filters'}
      >
        {filters.map(([value, label]) => (
          <Link
            key={value}
            href={`/${locale}/projects${value === 'all' ? '' : `?filter=${value}`}`}
            className={active === value ? 'is-active' : ''}
            aria-current={active === value ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="v1-result-count">
        {projects.length} {locale === 'vi' ? 'project công khai' : 'public projects'}
      </p>
      {projects.length ? (
        <section className="v1-feed">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} locale={locale} />
          ))}
        </section>
      ) : (
        <EmptySurface
          title={locale === 'vi' ? 'Chưa có Project phù hợp' : 'No matching Projects'}
          body={locale === 'vi' ? 'Thử một bộ lọc khác.' : 'Try a different build-library filter.'}
        />
      )}
    </main>
  );
}
