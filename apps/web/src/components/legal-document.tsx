import type { Metadata } from 'next';
import Link from 'next/link';
import type { Locale } from '@gimme-idea/contracts';
import { legalCopy, legalDocuments, legalRevision, type LegalDocumentKind } from '@/lib/legal';
import styles from './legal-document.module.css';

export function legalMetadata(locale: Locale, kind: LegalDocumentKind): Metadata {
  const document = legalDocuments[locale][kind];
  return {
    title: document.title,
    description: document.summary,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `/${locale}/${kind}`,
      languages: { en: `/en/${kind}`, vi: `/vi/${kind}` },
    },
  };
}

export function LegalDocument({ locale, kind }: { locale: Locale; kind: LegalDocumentKind }) {
  const t = legalCopy[locale];
  const document = legalDocuments[locale][kind];
  return (
    <main id="main" className={`app-page ${styles.page}`}>
      <Link className={styles.back} href={`/${locale}`}>
        {t.home}
      </Link>
      <header className={styles.header}>
        <p className={styles.kicker}>GIMME IDEA</p>
        <h1>{document.title}</h1>
        <p>{document.summary}</p>
        <time dateTime={legalRevision}>{t.updated}</time>
      </header>
      <aside className={styles.notice} aria-labelledby="legal-draft-title">
        <h2 id="legal-draft-title">{t.draft}</h2>
        <p>{t.notice}</p>
      </aside>
      <nav
        className={styles.documents}
        aria-label={locale === 'vi' ? 'Tài liệu pháp lý' : 'Legal documents'}
      >
        <Link href={`/${locale}/terms`} aria-current={kind === 'terms' ? 'page' : undefined}>
          {t.terms}
        </Link>
        <Link href={`/${locale}/privacy`} aria-current={kind === 'privacy' ? 'page' : undefined}>
          {t.privacy}
        </Link>
      </nav>
      <nav className={styles.contents} aria-label={t.contents}>
        <h2>{t.contents}</h2>
        <ol>
          {document.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title.replace(/^\d+\. /, '')}</a>
            </li>
          ))}
        </ol>
      </nav>
      <article className={styles.body} aria-label={document.title}>
        {document.sections.map((section) => (
          <section id={section.id} key={section.id} aria-labelledby={`heading-${section.id}`}>
            <h2 id={`heading-${section.id}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.id === 'contact' && (
              <address className={styles.contact}>
                <strong>Doan Danh (Zah)</strong>
                <a href="mailto:doanzah2710@gmail.com">doanzah2710@gmail.com</a>
                <a href="https://t.me/doandanh_zah" target="_blank" rel="noopener noreferrer">
                  Telegram: @doandanh_zah <span>({t.newTab})</span>
                </a>
              </address>
            )}
          </section>
        ))}
      </article>
      {kind === 'privacy' && (
        <footer className={styles.sources}>
          <h2>{t.sources}</h2>
          <ul>
            <li>
              <a
                href="https://www.privy.io/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privy <span>({t.newTab})</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.adobe.com/privacy/policies/adobe-fonts.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                Adobe Fonts <span>({t.newTab})</span>
              </a>
            </li>
          </ul>
        </footer>
      )}
    </main>
  );
}
