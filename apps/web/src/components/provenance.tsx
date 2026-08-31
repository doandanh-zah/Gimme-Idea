import { ExternalLink } from 'lucide-react';
import type { ProvenanceDTO } from '@gimme-idea/contracts';
import { StatusPill } from '@gimme-idea/ui';

export function Provenance({ value, label }: { value: ProvenanceDTO; label: string }) {
  return (
    <aside className="provenance">
      <div className="section-heading">
        <p>{label}</p>
        <StatusPill tone={value.reviewedByHuman ? 'success' : 'warning'}>
          {value.reviewedByHuman ? 'HUMAN REVIEWED' : 'REVIEW NEEDED'}
        </StatusPill>
      </div>
      <dl>
        <div>
          <dt>ORIGIN</dt>
          <dd>{value.origin.replace('_', ' ')}</dd>
        </div>
        <div>
          <dt>LAST RESEARCH</dt>
          <dd>
            {value.lastResearchedAt
              ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
                  new Date(value.lastResearchedAt),
                )
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
