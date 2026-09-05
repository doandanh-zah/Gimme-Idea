/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return -- pg returns dynamic rows at this repository boundary; worker inputs are validated before persistence. */
import pg from 'pg';

export type ResearchSubject = {
  runId: string;
  entityType: 'problem' | 'idea';
  entityId: string;
  entityVersion: number;
  title: string;
  body: string;
  visibility: 'public';
};
export type EscrowWorkItem = {
  bountyId: string;
  escrowAddress: string;
  termsHash: string;
  mintAddress: string;
  expectedAmountRaw: string;
};

export interface WorkerRepository {
  claimResearchRun(runId: string): Promise<ResearchSubject | null>;
  completeResearchRun(
    runId: string,
    output: {
      claims: Array<{
        fieldPath: string;
        claim: string;
        confidence: number;
        sources: Array<{ title: string; url: string; publisher?: string }>;
      }>;
      verification: Array<{
        index: number;
        status: 'supported' | 'unsupported' | 'unknown';
        rationale: string;
        evidenceCoverage: number;
      }>;
      provider: string;
      model: string;
    },
  ): Promise<void>;
  failResearchRun(runId: string, errorCode: string, terminal: boolean): Promise<void>;
  upsertImportedEntity(input: {
    sourceName: string;
    sourceType: string;
    externalId: string;
    entityType: string;
    sourceUpdatedAt: string | null;
    payloadHash: string;
    payload: unknown;
    normalized: unknown;
  }): Promise<boolean>;
  updateImportCursor(sourceName: string, cursor: unknown, error?: string): Promise<void>;
  listEscrowsForReconciliation(limit: number): Promise<EscrowWorkItem[]>;
  close(): Promise<void>;
}

async function tx<T>(pool: pg.Pool, fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const value = await fn(client);
    await client.query('commit');
    return value;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export function createWorkerRepository(connectionString: string): WorkerRepository {
  const pool = new pg.Pool({
    connectionString,
    max: 8,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
  return {
    async claimResearchRun(runId) {
      return tx(pool, async (client) => {
        const run = (
          await client.query(
            `select id,entity_type,entity_id,entity_version,visibility_scope,status from public.research_runs where id=$1 for update skip locked`,
            [runId],
          )
        ).rows[0];
        if (!run || run.status !== 'queued') return null;
        if (run.visibility_scope !== 'public') {
          await client.query(
            `update public.research_runs set status='failed',error_code='PRIVATE_SCOPE_REJECTED',completed_at=now(),updated_at=now() where id=$1`,
            [runId],
          );
          return null;
        }
        const table =
          run.entity_type === 'problem' ? 'problems' : run.entity_type === 'idea' ? 'ideas' : null;
        if (!table) throw new Error('Unsupported research entity type.');
        const entity = (
          await client.query(
            `select title,concat_ws(E'\n\n',summary,${table === 'problems' ? 'description' : 'thesis,solution'}) body,visibility,content_version from public.${table} where id=$1 and deleted_at is null`,
            [run.entity_id],
          )
        ).rows[0];
        if (
          !entity ||
          entity.visibility !== 'public' ||
          entity.content_version !== run.entity_version
        ) {
          await client.query(
            `update public.research_runs set status='failed',error_code='STALE_OR_PRIVATE_ENTITY',completed_at=now(),updated_at=now() where id=$1`,
            [runId],
          );
          return null;
        }
        await client.query(
          `update public.research_runs set status='running',started_at=now(),attempt=attempt+1,updated_at=now() where id=$1`,
          [runId],
        );
        return {
          runId,
          entityType: run.entity_type,
          entityId: run.entity_id,
          entityVersion: run.entity_version,
          title: entity.title,
          body: entity.body,
          visibility: 'public',
        };
      });
    },
    async completeResearchRun(runId, output) {
      await tx(pool, async (client) => {
        for (const [index, claim] of output.claims.entries()) {
          const claimRow = (
            await client.query(
              `insert into public.research_claims(research_run_id,field_path,claim,confidence) values($1,$2,$3,$4) returning id`,
              [runId, claim.fieldPath, claim.claim, claim.confidence],
            )
          ).rows[0];
          for (const source of claim.sources)
            await client.query(
              `insert into public.research_sources(research_claim_id,title,url,publisher) values($1,$2,$3,$4)`,
              [claimRow.id, source.title, source.url, source.publisher ?? null],
            );
          const verification = output.verification.find((item) => item.index === index) ?? {
            status: 'unknown',
            rationale: 'Verifier omitted this claim.',
            evidenceCoverage: 0,
          };
          await client.query(
            `insert into public.verification_results(research_claim_id,status,rationale,verified_by,evidence_coverage) values($1,$2,$3,'independent_ai_verifier',$4)`,
            [
              claimRow.id,
              verification.status,
              verification.rationale,
              verification.evidenceCoverage,
            ],
          );
        }
        await client.query(
          `update public.research_runs set status='completed',provider=$2,model=$3,completed_at=now(),updated_at=now() where id=$1`,
          [runId, output.provider, output.model],
        );
      });
    },
    async failResearchRun(runId, errorCode, terminal) {
      await pool.query(
        `update public.research_runs set status=case when $3 then 'failed' else 'queued' end,error_code=$2,completed_at=case when $3 then now() else null end,updated_at=now() where id=$1`,
        [runId, errorCode.slice(0, 100), terminal],
      );
    },
    async upsertImportedEntity(input) {
      return tx(pool, async (client) => {
        const source = (
          await client.query(
            `insert into public.import_sources(name,source_type,adapter_version,enabled) values($1,$2,'v1',true) on conflict(name) do update set source_type=excluded.source_type,updated_at=now() returning id`,
            [input.sourceName, input.sourceType],
          )
        ).rows[0];
        const result = await client.query(
          `insert into public.imported_entities(import_source_id,external_id,entity_type,payload,normalized_payload,payload_hash,source_updated_at,import_status) values($1,$2,$3,$4,$5,$6,$7,'stored') on conflict(import_source_id,external_id) do update set payload=excluded.payload,normalized_payload=excluded.normalized_payload,payload_hash=excluded.payload_hash,source_updated_at=excluded.source_updated_at,import_status='stored',updated_at=now() where imported_entities.payload_hash is distinct from excluded.payload_hash returning id`,
          [
            source.id,
            input.externalId,
            input.entityType,
            input.payload,
            input.normalized,
            input.payloadHash,
            input.sourceUpdatedAt,
          ],
        );
        return Boolean(result.rowCount);
      });
    },
    async updateImportCursor(sourceName, cursor, error) {
      await pool.query(
        `update public.import_sources set cursor=$2,last_synced_at=case when $3::text is null then now() else last_synced_at end,last_error=$3,updated_at=now() where name=$1`,
        [sourceName, cursor, error ?? null],
      );
    },
    async listEscrowsForReconciliation(limit) {
      return (
        await pool.query(
          `select b.id "bountyId",e.escrow_address "escrowAddress",e.terms_hash "termsHash",e.mint_address "mintAddress",e.expected_amount_raw::text "expectedAmountRaw" from public.bounty_escrows e join public.bounties b on b.id=e.bounty_id where e.escrow_address is not null and e.status not in ('paid','refunded') order by e.last_reconciled_at nulls first limit $1`,
          [limit],
        )
      ).rows;
    },
    close: () => pool.end(),
  };
}
