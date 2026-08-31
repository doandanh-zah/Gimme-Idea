import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Eyebrow } from '@gimme-idea/ui';
import { copy, isLocale } from '@/lib/i18n';
import { Narrative } from '@/components/narrative';
import { BrainLoader } from '@/components/brain-loader';

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>{t.signal}</Eyebrow>
          <h1>
            <span>{t.headlineA}</span>
            <span>{t.headlineB}</span>
            <span className="accent-line">{t.headlineC}</span>
          </h1>
          <p className="hero-intro">{t.intro}</p>
          <div className="hero-actions">
            <Link
              className="button button-primary"
              href={`/${locale}/problems/restaurant-food-waste`}
            >
              {t.exploreProblem}
              <ArrowUpRight size={17} />
            </Link>
            <Link
              className="button button-quiet"
              href={`/${locale}/ideas/demand-pulse-for-kitchens`}
            >
              {t.inspectIdea}
              <ArrowDownRight size={17} />
            </Link>
          </div>
        </div>
        <div className="brain-frame" aria-hidden="true">
          <div className="brain-fallback">
            <svg viewBox="0 0 500 500">
              <g fill="none" stroke="currentColor">
                <path d="M250 80C165 80 112 137 116 215c-49 45-17 132 52 132 22 58 116 68 144 15 78 5 106-95 48-138 13-79-37-144-110-144Z" />
                <path d="M250 80v282M116 215c57 1 98 32 134 75M360 224c-52 6-81 34-110 66M168 347c18-48 11-88-30-119M312 362c-19-45-13-87 47-137" />
                <circle cx="250" cy="80" r="5" fill="currentColor" />
                <circle cx="116" cy="215" r="5" fill="currentColor" />
                <circle cx="168" cy="347" r="5" fill="currentColor" />
                <circle cx="312" cy="362" r="5" fill="currentColor" />
                <circle cx="360" cy="224" r="5" fill="currentColor" />
              </g>
            </svg>
          </div>
          <BrainLoader />
        </div>
        <a className="scroll-cue" href="#sequence">
          SCROLL TO TRACE THE SIGNAL <ArrowDownRight size={15} />
        </a>
      </section>
      <Narrative items={t.sequence} />
      <section className="manifesto">
        <Eyebrow>WHY THIS NETWORK EXISTS</Eyebrow>
        <h2>{t.manifesto}</h2>
        <p>{t.manifestoBody}</p>
        <div className="manifesto-rule">
          <span>01 / TRACEABLE</span>
          <span>02 / FALSIFIABLE</span>
          <span>03 / BUILDABLE</span>
        </div>
      </section>
    </main>
  );
}
