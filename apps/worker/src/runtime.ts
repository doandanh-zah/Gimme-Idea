import { createHash } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import type { Connection } from '@solana/web3.js';
import { Queue, Worker } from 'bullmq';
import type { Job } from 'bullmq';
import type { Redis } from 'ioredis';
import type { PlatformRepository, ResearchSubject, WorkerRepository } from '@gimme-idea/db';
import { decodeBountyEscrow } from '@gimme-idea/solana';

type AiConfig = {
  provider: 'disabled' | 'openai_compatible';
  apiUrl?: string;
  apiKey?: string;
  model?: string;
};
type Claim = {
  fieldPath: string;
  claim: string;
  confidence: number;
  sources: Array<{ title: string; url: string; publisher?: string }>;
};

export function assertClaims(value: unknown): Claim[] {
  if (!value || typeof value !== 'object' || !Array.isArray((value as { claims?: unknown }).claims))
    throw new Error('AI_SCHEMA_INVALID');
  return (value as { claims: unknown[] }).claims.map((entry) => {
    const claim = entry as Partial<Claim>;
    if (
      typeof claim.fieldPath !== 'string' ||
      typeof claim.claim !== 'string' ||
      typeof claim.confidence !== 'number' ||
      claim.confidence < 0 ||
      claim.confidence > 1 ||
      !Array.isArray(claim.sources)
    )
      throw new Error('AI_SCHEMA_INVALID');
    const sources = claim.sources.map((source) => {
      if (
        !source ||
        typeof source.title !== 'string' ||
        typeof source.url !== 'string' ||
        !/^https:\/\//.test(source.url)
      )
        throw new Error('AI_SOURCE_INVALID');
      return source;
    });
    return { ...claim, sources } as Claim;
  });
}

async function callAi(config: AiConfig, system: string, input: unknown) {
  if (config.provider === 'disabled' || !config.apiUrl || !config.apiKey || !config.model)
    throw new Error('AI_PROVIDER_DISABLED');
  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI_PROVIDER_${response.status}`);
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI_EMPTY_RESPONSE');
  return JSON.parse(content) as unknown;
}

async function research(subject: ResearchSubject, config: AiConfig) {
  const result = await callAi(
    config,
    'You are the research pass. Return JSON {claims:[{fieldPath,claim,confidence,sources:[{title,url,publisher}]}]}. Preserve the creator thesis. Use unknown when evidence is absent. Never infer or request private data. Every factual claim needs an HTTPS source.',
    { title: subject.title, body: subject.body, entityType: subject.entityType },
  );
  const claims = assertClaims(result);
  const verificationRaw = await callAi(
    config,
    'You are an independent verifier. Return JSON {verification:[{index,status,rationale,evidenceCoverage}]}; status is supported, unsupported, or unknown. Evaluate only the supplied public claims and sources. Do not add private or unsourced facts.',
    { claims },
  );
  const verification = (
    verificationRaw as {
      verification?: Array<{
        index: number;
        status: 'supported' | 'unsupported' | 'unknown';
        rationale: string;
        evidenceCoverage: number;
      }>;
    }
  ).verification;
  if (!Array.isArray(verification)) throw new Error('AI_VERIFIER_SCHEMA_INVALID');
  return { claims, verification, provider: config.provider, model: config.model! };
}

export function normalizeColosseumProject(value: Record<string, unknown>) {
  const stringValue = (candidate: unknown) =>
    typeof candidate === 'string' || typeof candidate === 'number' ? String(candidate) : '';
  const id = stringValue(value.id ?? value.slug);
  const name = stringValue(value.name ?? value.title).trim();
  const description = stringValue(value.description ?? value.summary).trim();
  const url = stringValue(value.url);
  if (!id || !name || !description || !/^https:\/\//.test(url)) return null;
  return {
    externalId: id,
    entityType: 'project',
    sourceUpdatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
    normalized: {
      name,
      description,
      url,
      team: Array.isArray(value.team) ? value.team : [],
      result: value.result ?? 'unknown',
    },
  };
}

export async function startRuntime(options: {
  connection: Redis;
  database: WorkerRepository;
  platform: PlatformRepository;
  solana: Connection;
  programId: string;
  ai: AiConfig;
  colosseumFeedUrl?: string;
}) {
  const queues = new Map(
    ['research', 'chain', 'imports', 'notifications'].map((name) => [
      name,
      new Queue(name, { connection: options.connection }),
    ]),
  );
  await queues
    .get('chain')!
    .upsertJobScheduler(
      'escrow-reconcile-60s',
      { every: 60_000 },
      { name: 'escrow.reconcile', data: {} },
    );
  if (options.colosseumFeedUrl)
    await queues
      .get('imports')!
      .upsertJobScheduler(
        'colosseum-incremental-6h',
        { every: 21_600_000 },
        { name: 'colosseum.incremental', data: { feedUrl: options.colosseumFeedUrl } },
      );
  const researchWorker = new Worker(
    'research',
    async (job: Job<{ runId: string }>) => {
      const subject = await options.database.claimResearchRun(job.data.runId);
      if (!subject) return { skipped: true };
      try {
        const output = await research(subject, options.ai);
        await options.database.completeResearchRun(subject.runId, output);
        return { claims: output.claims.length };
      } catch (error) {
        const terminal = job.attemptsMade + 1 >= Number(job.opts.attempts ?? 1);
        await options.database.failResearchRun(
          subject.runId,
          error instanceof Error ? error.message : 'AI_FAILED',
          terminal,
        );
        throw error;
      }
    },
    { connection: options.connection, concurrency: 3 },
  );
  const chainWorker = new Worker(
    'chain',
    async () => {
      const escrows = await options.database.listEscrowsForReconciliation(100);
      let reconciled = 0;
      for (const escrow of escrows) {
        const account = await options.solana.getAccountInfoAndContext(
          new PublicKey(escrow.escrowAddress),
          { commitment: 'finalized' },
        );
        if (!account.value || !account.value.owner.equals(new PublicKey(options.programId)))
          continue;
        const decoded = decodeBountyEscrow(escrow.escrowAddress, account.value.data);
        await options.platform.reconcileEscrow(escrow.bountyId, {
          slot: String(account.context.slot),
          address: decoded.address,
          bountyIdHex: decoded.bountyIdHex,
          state: decoded.state,
          termsHash: decoded.termsHashHex,
          mint: decoded.mint,
          prizeAmountRaw: decoded.prizePoolRaw.toString(),
          feeAmountRaw: decoded.platformFeeRaw.toString(),
          totalDepositedRaw: decoded.totalDepositedRaw.toString(),
          winner: decoded.winner,
        });
        reconciled++;
      }
      return { reconciled };
    },
    { connection: options.connection, concurrency: 1 },
  );
  const importWorker = new Worker(
    'imports',
    async (job: Job<{ feedUrl?: string }>) => {
      const feedUrl = job.data.feedUrl;
      if (!feedUrl || !/^https:\/\//.test(feedUrl))
        throw new Error('COLOSSEUM_FEED_NOT_CONFIGURED');
      const response = await fetch(feedUrl, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`COLOSSEUM_FEED_${response.status}`);
      const body = (await response.json()) as {
        projects?: Record<string, unknown>[];
        nextCursor?: unknown;
      };
      if (!Array.isArray(body.projects)) throw new Error('COLOSSEUM_FEED_SCHEMA_INVALID');
      let changed = 0;
      for (const raw of body.projects) {
        const item = normalizeColosseumProject(raw);
        if (!item) continue;
        const payloadHash = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
        if (
          await options.database.upsertImportedEntity({
            sourceName: 'Colosseum',
            sourceType: 'official_json_feed',
            ...item,
            payloadHash,
            payload: raw,
          })
        )
          changed++;
      }
      await options.database.updateImportCursor('Colosseum', body.nextCursor ?? {});
      return { seen: body.projects.length, changed };
    },
    { connection: options.connection, concurrency: 1 },
  );
  const notificationWorker = new Worker<{ notificationId?: string }>(
    'notifications',
    (job) =>
      Promise.resolve({
        delivered: false,
        reason: 'delivery_adapter_not_configured',
        notificationId: job.data.notificationId,
      }),
    { connection: options.connection, concurrency: 5 },
  );
  return {
    queues,
    workers: [researchWorker, chainWorker, importWorker, notificationWorker],
    close: async () => {
      await Promise.all([
        researchWorker.close(),
        chainWorker.close(),
        importWorker.close(),
        notificationWorker.close(),
      ]);
      await Promise.all([...queues.values()].map((queue) => queue.close()));
    },
  };
}
