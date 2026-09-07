import { ExternalLink } from 'lucide-react';
import type { ProvenanceDTO, Locale } from '@gimme-idea/contracts';
import { StatusPill } from '@gimme-idea/ui';

export function Provenance({
  value,
  label,
  id,
  locale = 'en',
}: {
  value: ProvenanceDTO;
  label: string;
  id?: string;
  locale?: Locale;
}) {
  return (
    <aside className="provenance" id={id}>
      <div className="section-heading">
        <p>{label}</p>
        <StatusPill tone={value.reviewedByHuman ? 'success' : 'warning'}>
          {value.reviewedByHuman
            ? locale === 'vi'
              ? 'ĐÃ ĐƯỢC XEM XÉT'
              : 'HUMAN REVIEWED'
            : locale === 'vi'
              ? 'CẦN XEM XÉT'
              : 'REVIEW NEEDED'}
        </StatusPill>
      </div>
      <dl>
        <div>
          <dt>{locale === 'vi' ? 'NGUỒN' : 'ORIGIN'}</dt>
          <dd>{value.origin.replace('_', ' ')}</dd>
        </div>
        <div>
          <dt>{locale === 'vi' ? 'NGHIÊN CỨU GẦN NHẤT' : 'LAST RESEARCH'}</dt>
          <dd>
            {value.lastResearchedAt
              ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
                  new Date(value.lastResearchedAt),
                )
              : locale === 'vi'
                ? 'Chưa nghiên cứu'
                : 'Not researched'}
          </dd>
        </div>
      </dl>
      {value.sources.length > 0 && (
        <ul className="source-list">
          {value.sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} target="_blank" rel="noreferrer">
                <span>{source.title}</span>
                <ExternalLink size={14} />
              </a>
              <small>{source.publisher ?? 'Independent source'}</small>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
