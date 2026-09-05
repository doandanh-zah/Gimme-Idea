import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppPageHeader } from '@/components/app-surfaces';
import { BountyCard } from '@/components/v1-cards';
import { bountyClient, organizationClient, projectClient } from '@/lib/domain/client';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await organizationClient.get(slug);
  return org ? { title: org.name, description: org.description } : {};
}
export default async function OrganizationPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const org = await organizationClient.get(slug);
  if (!org) notFound();
  const [allBounties, allProjects] = await Promise.all([bountyClient.list(), projectClient.list()]);
  const orgBounties = allBounties.filter((bounty) => bounty.organization.slug === slug);
  const publicProjects = allProjects.filter((project) =>
    orgBounties.some((bounty) => bounty.problem.slug === project.problem.slug),
  );
  return (
    <main id="main" className="app-page v1-org-page">
      <AppPageHeader
        eyebrow="ORGANIZATION / PROBLEM OWNER"
        title={org.name}
        summary={org.description}
        aside={<Building2 size={32} aria-hidden="true" />}
      />
      <section className="v1-org-principle">
        <strong>
          {locale === 'vi'
            ? 'Cách Organization dùng Gimme Idea'
            : 'How this Organization uses Gimme Idea'}
        </strong>
        <span>
          {locale === 'vi'
            ? 'Đăng Problem công khai → nhận Idea riêng tư → fund hướng tốt nhất → fund execution.'
            : 'Post the Problem publicly → receive private Ideas → fund the best direction → fund execution.'}
        </span>
      </section>
      <section className="v1-section-block">
        <header>
          <p className="v1-kicker">CURRENT OPPORTUNITIES</p>
          <h2>{locale === 'vi' ? 'Bounty gắn với Problem' : 'Problem-linked Bounties'}</h2>
        </header>
        <div className="v1-feed">
          {orgBounties.map((bounty) => (
            <BountyCard key={bounty.slug} bounty={bounty} locale={locale} compact />
          ))}
        </div>
      </section>
      <section className="v1-section-block">
        <header>
          <p className="v1-kicker">PUBLIC OUTCOMES</p>
          <h2>{locale === 'vi' ? 'Build công khai liên quan' : 'Related public builds'}</h2>
        </header>
        {publicProjects.map((project) => (
          <Link
            className="v1-inline-record"
            key={project.slug}
            href={`/${locale}/projects/${project.slug}`}
          >
            <span>
              <strong>{project.name}</strong>
              <small>
                {project.outcome.state} · {project.status}
              </small>
            </span>
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        ))}
      </section>
    </main>
  );
}
