import pg from 'pg';
import type {
  IdeaDetailDTO,
  PreviousAttemptDTO,
  ProblemDetailDTO,
  ProvenanceDTO,
  SourceDTO,
} from '@gimme-idea/contracts';

type ProblemRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  affected_groups: string[];
  evidence: string[];
  severity: ProblemDetailDTO['severity'];
  status: ProblemDetailDTO['status'];
  research_status: ProblemDetailDTO['researchStatus'];
  origin: ProvenanceDTO['origin'];
  reviewed_by_human: boolean;
  last_researched_at: Date | null;
  created_at: Date;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
};
type IdeaRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  thesis: string;
  solution: string;
  target_users: string[];
  status: IdeaDetailDTO['status'];
  research_status: IdeaDetailDTO['researchStatus'];
  origin: ProvenanceDTO['origin'];
  reviewed_by_human: boolean;
  last_researched_at: Date | null;
  created_at: Date;
  creator_username: string | null;
  creator_display_name: string | null;
  creator_avatar_url: string | null;
};

export interface KnowledgeRepository {
  ping(): Promise<boolean>;
  findProblem(slug: string): Promise<ProblemDetailDTO | null>;
  findIdea(slug: string): Promise<IdeaDetailDTO | null>;
  close(): Promise<void>;
}

export function createKnowledgeRepository(connectionString: string): KnowledgeRepository {
  const pool = new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return {
    async ping() {
      const result = await pool.query<{ ok: number }>('select 1 as ok');
      return result.rows[0]?.ok === 1;
    },
    async close() {
      await pool.end();
    },
    async findProblem(slug) {
      const result = await pool.query<ProblemRow>(
        `select p.id,p.slug,p.title,p.summary,p.description,p.affected_groups,p.evidence,p.severity,p.status,p.research_status,p.origin,p.reviewed_by_human,p.last_researched_at,p.created_at,u.username creator_username,u.display_name creator_display_name,u.avatar_url creator_avatar_url from public.problems p left join public.users u on u.id=p.created_by and u.deleted_at is null where p.slug=$1 and p.status='published' and p.deleted_at is null limit 1`,
        [slug],
      );
      const row = result.rows[0];
      if (!row) return null;
      const [sourcesResult, ideasResult, bountyResult] = await Promise.all([
        pool.query<{
          id: string;
          title: string;
          url: string;
          publisher: string | null;
          published_at: Date | null;
        }>(
          `select id,title,url,publisher,published_at from public.problem_sources where problem_id=$1 order by created_at`,
          [row.id],
        ),
        pool.query<{ slug: string; title: string; summary: string }>(
          `select i.slug,i.title,i.summary from public.ideas i join public.idea_problem_links l on l.idea_id=i.id where l.problem_id=$1 and i.status='published' and i.deleted_at is null order by (l.relationship_type='primary') desc,i.created_at limit 6`,
          [row.id],
        ),
        pool.query<{
          title: string;
          status: NonNullable<ProblemDetailDTO['bounty']>['status'];
          amount_raw: string;
          currency: string;
          open_to_hiring: boolean;
        }>(
          `select title,status,total_amount_raw::text amount_raw,currency,open_to_hiring from public.bounties where problem_id=$1 and status not in ('draft','cancelled') order by created_at limit 1`,
          [row.id],
        ),
      ]);
      const sources: SourceDTO[] = sourcesResult.rows.map((source) => ({
        id: source.id,
        title: source.title,
        url: source.url,
        publisher: source.publisher,
        publishedAt: source.published_at?.toISOString() ?? null,
      }));
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        description: row.description,
        affectedGroups: row.affected_groups,
        evidence: row.evidence,
        severity: row.severity,
        status: row.status,
        researchStatus: row.research_status,
        createdAt: row.created_at.toISOString(),
        creator:
          row.creator_username && row.creator_display_name
            ? {
                username: row.creator_username,
                displayName: row.creator_display_name,
                avatarUrl: row.creator_avatar_url,
              }
            : null,
        provenance: {
          origin: row.origin,
          reviewedByHuman: row.reviewed_by_human,
          lastResearchedAt: row.last_researched_at?.toISOString() ?? null,
          sources,
        },
        relatedIdeas: ideasResult.rows,
        bounty: bountyResult.rows[0]
          ? {
              title: bountyResult.rows[0].title,
              status: bountyResult.rows[0].status,
              amountRaw: bountyResult.rows[0].amount_raw,
              currency: bountyResult.rows[0].currency,
              openToHiring: bountyResult.rows[0].open_to_hiring,
            }
          : null,
      };
    },
    async findIdea(slug) {
      const result = await pool.query<IdeaRow>(
        `select i.id,i.slug,i.title,i.summary,i.thesis,i.solution,i.target_users,i.status,i.research_status,i.origin,i.reviewed_by_human,i.last_researched_at,i.created_at,u.username creator_username,u.display_name creator_display_name,u.avatar_url creator_avatar_url from public.ideas i left join public.users u on u.id=i.created_by and u.deleted_at is null where i.slug=$1 and i.status='published' and i.deleted_at is null limit 1`,
        [slug],
      );
      const row = result.rows[0];
      if (!row) return null;
      const [problemResult, attemptsResult, projectResult, sourcesResult] = await Promise.all([
        pool.query<{ slug: string; title: string; summary: string }>(
          `select p.slug,p.title,p.summary from public.problems p join public.idea_problem_links l on l.problem_id=p.id where l.idea_id=$1 and l.relationship_type='primary' limit 1`,
          [row.id],
        ),
        pool.query<{
          id: string;
          name: string;
          description: string;
          outcome: PreviousAttemptDTO['outcome'];
          lesson: string;
          source_url: string | null;
        }>(
          `select id,name,description,outcome,lesson,source_url from public.previous_attempts where idea_id=$1 order by created_at`,
          [row.id],
        ),
        pool.query<{ slug: string; name: string; stage: string }>(
          `select slug,name,stage from public.projects where idea_id=$1 and deleted_at is null order by created_at limit 1`,
          [row.id],
        ),
        pool.query<{
          id: string;
          title: string;
          url: string;
          publisher: string | null;
          published_at: Date | null;
        }>(
          `select s.id,s.title,s.url,s.publisher,s.published_at from public.problem_sources s join public.idea_problem_links l on l.problem_id=s.problem_id where l.idea_id=$1 and l.relationship_type='primary' order by s.created_at`,
          [row.id],
        ),
      ]);
      const primaryProblem = problemResult.rows[0];
      if (!primaryProblem)
        throw new Error(`Published idea ${row.id} violates primary problem invariant`);
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        thesis: row.thesis,
        solution: row.solution,
        targetUsers: row.target_users,
        status: row.status,
        researchStatus: row.research_status,
        createdAt: row.created_at.toISOString(),
        creator:
          row.creator_username && row.creator_display_name
            ? {
                username: row.creator_username,
                displayName: row.creator_display_name,
                avatarUrl: row.creator_avatar_url,
              }
            : null,
        provenance: {
          origin: row.origin,
          reviewedByHuman: row.reviewed_by_human,
          lastResearchedAt: row.last_researched_at?.toISOString() ?? null,
          sources: sourcesResult.rows.map((s) => ({
            id: s.id,
            title: s.title,
            url: s.url,
            publisher: s.publisher,
            publishedAt: s.published_at?.toISOString() ?? null,
          })),
        },
        primaryProblem,
        previousAttempts: attemptsResult.rows.map((attempt) => ({
          id: attempt.id,
          name: attempt.name,
          description: attempt.description,
          outcome: attempt.outcome,
          lesson: attempt.lesson,
          sourceUrl: attempt.source_url,
        })),
        project: projectResult.rows[0] ?? null,
      };
    },
  };
}
