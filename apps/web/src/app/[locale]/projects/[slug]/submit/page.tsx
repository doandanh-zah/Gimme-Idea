import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectSubmissionSnapshot } from '@/components/project-submission-snapshot';
import { bountyClient, projectClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Private Project snapshot',
  robots: { index: false, follow: false },
};

export default async function ProjectSubmitPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const project = await projectClient.get(slug);
  const bounty = (await bountyClient.list('build'))[0] ?? null;
  if (!project || project.mode !== 'private_workspace' || !bounty) notFound();
  return (
    <main id="main" className="app-page v1-private-route">
      <ProjectSubmissionSnapshot project={project} bounty={bounty} locale={locale} />
    </main>
  );
}
