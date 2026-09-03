'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { PostMediaGallery } from '@/components/post-media-gallery';
import {
  getLocalKnowledgePost,
  getLocalKnowledgePosts,
  subscribeSocial,
  type LocalKnowledgePost,
} from '@/lib/social';
import { formatPostTime } from '@/lib/time';

const labels = {
  en: {
    back: 'Back',
    notFound: 'This local post is not on this device.',
    problem: 'Problem',
    idea: 'Idea',
    oneLine: '1-line description',
    who: 'Who has this problem?',
    why: 'Why does it matter?',
    opportunity: 'Opportunity',
    solution: 'Solution',
    primaryProblem: 'Primary Problem',
    moreDetails: 'More details',
    media: 'Media',
    ideas: 'Ideas for this problem',
    noIdeas: 'No local ideas point to this problem yet.',
    bounty: 'Bounty',
    hiring: 'Hiring',
  },
  vi: {
    back: 'Quay lại',
    notFound: 'Bài local này không có trên thiết bị này.',
    problem: 'Problem',
    idea: 'Idea',
    oneLine: 'Mô tả 1 câu',
    who: 'Who has this problem?',
    why: 'Why does it matter?',
    opportunity: 'Opportunity',
    solution: 'Solution',
    primaryProblem: 'Primary Problem',
    moreDetails: 'Chi tiết thêm',
    media: 'Media',
    ideas: 'Ideas cho problem này',
    noIdeas: 'Chưa có idea local nào trỏ tới problem này.',
    bounty: 'Bounty',
    hiring: 'Tuyển dụng',
  },
} as const;

function money(amountRaw: string) {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(BigInt(amountRaw)) / 1_000_000);
}

function DetailSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="content-section">
      <div className="chapter-heading">
        <span>{eyebrow}</span>
        <div>
          <small>{eyebrow}</small>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export function LocalKnowledgeDetail({
  locale,
  kind,
  slug,
}: {
  locale: Locale;
  kind: 'idea' | 'problem';
  slug: string;
}) {
  const t = labels[locale];
  const [post, setPost] = useState<LocalKnowledgePost | null>(null);
  const [loaded, setLoaded] = useState(false);
  const relatedIdeas = useMemo(
    () =>
      post?.kind === 'problem'
        ? getLocalKnowledgePosts('idea').filter((idea) => idea.primaryProblemSlug === post.slug)
        : [],
    [post],
  );

  useEffect(() => {
    const sync = () => {
      setPost(getLocalKnowledgePost(kind, slug));
      setLoaded(true);
    };
    sync();
    return subscribeSocial(sync);
  }, [kind, slug]);

  if (!loaded) return <main id="main" className="detail-page" aria-busy="true" />;
  if (!post) {
    return (
      <main id="main" className="detail-page">
        <section className="app-empty-state">
          <h2>{t.notFound}</h2>
          <Link
            className="button button-quiet"
            href={`/${locale}/${kind === 'idea' ? 'ideas' : 'problems'}`}
          >
            {t.back}
          </Link>
        </section>
      </main>
    );
  }

  const extra = Object.entries(post.details?.extra ?? {}).filter(([, value]) => value.trim());

  return (
    <main id="main" className={`detail-page local-detail-page ${post.kind}-page`}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href={`/${locale}/${post.kind === 'idea' ? 'ideas' : 'problems'}`}>
          <ArrowLeft size={14} aria-hidden="true" />
          {t.back}
        </Link>
        <span>/</span>
        <strong>{post.kind === 'idea' ? t.idea : t.problem}</strong>
      </nav>
      <header className="detail-header">
        <div>
          <p className="local-detail-type">{post.kind === 'idea' ? t.idea : t.problem}</p>
          <h1>{post.title}</h1>
          <p className="detail-summary">{post.summary}</p>
          <p className="local-detail-meta">
            @{post.creator.username} ·{' '}
            <time dateTime={post.createdAt}>{formatPostTime(locale, post.createdAt)}</time>
          </p>
        </div>
        {post.bounty && (
          <div className="local-opportunity-card">
            <small>{t.bounty}</small>
            <strong>{money(post.bounty.amountRaw)}</strong>
            {post.bounty.openToHiring && (
              <span>
                <BriefcaseBusiness size={17} aria-hidden="true" />
                {t.hiring}
              </span>
            )}
          </div>
        )}
      </header>
      <div className="detail-grid">
        <article className="canonical-content">
          {post.kind === 'problem' ? (
            <>
              <DetailSection id="problem" eyebrow="01" title={t.problem}>
                <p className="long-copy">{post.details?.problem ?? post.summary}</p>
              </DetailSection>
              <DetailSection id="who" eyebrow="02" title={t.who}>
                <p className="long-copy">{post.details?.whoHasThisProblem}</p>
              </DetailSection>
              <DetailSection id="why" eyebrow="03" title={t.why}>
                <p className="long-copy">{post.details?.whyItMatters}</p>
              </DetailSection>
              <DetailSection id="ideas" eyebrow="04" title={t.ideas}>
                {relatedIdeas.length > 0 ? (
                  <div className="idea-links">
                    {relatedIdeas.map((idea, index) => (
                      <Link key={idea.id} href={`/${locale}/ideas/${idea.slug}`}>
                        <small>{String(index + 1).padStart(2, '0')} / IDEA</small>
                        <strong>{idea.title}</strong>
                        <p>{idea.summary}</p>
                        <ArrowUpRight size={17} aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="empty-note">{t.noIdeas}</p>
                )}
              </DetailSection>
            </>
          ) : (
            <>
              <div className="problem-anchor">
                <small>{t.primaryProblem.toUpperCase()}</small>
                <Link
                  href={
                    post.primaryProblemSlug
                      ? `/${locale}/problems/${post.primaryProblemSlug}`
                      : `/${locale}/problems`
                  }
                >
                  <strong>
                    {post.details?.primaryProblemTitle ??
                      post.primaryProblemSlug ??
                      t.primaryProblem}
                  </strong>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <DetailSection id="opportunity" eyebrow="01" title={t.opportunity}>
                <p className="long-copy">{post.details?.opportunity}</p>
              </DetailSection>
              <DetailSection id="solution" eyebrow="02" title={t.solution}>
                <p className="long-copy">{post.details?.solution}</p>
              </DetailSection>
            </>
          )}
          {extra.length > 0 && (
            <DetailSection id="more-details" eyebrow="+" title={t.moreDetails}>
              <dl className="detail-field-list">
                {extra.map(([key, value]) => (
                  <div key={key}>
                    <dt>{key.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </DetailSection>
          )}
          {post.attachments.length > 0 && (
            <DetailSection id="media" eyebrow="M" title={t.media}>
              <PostMediaGallery attachments={post.attachments} />
            </DetailSection>
          )}
        </article>
      </div>
    </main>
  );
}
