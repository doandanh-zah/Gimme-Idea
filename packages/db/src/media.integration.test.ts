import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPlatformRepository, type PlatformRepository } from './platform-repository.js';
import { createKnowledgeRepository, type KnowledgeRepository } from './repository.js';

// Opt in against a disposable/local database. Every record created by this suite
// has a fresh UUID and is removed explicitly; existing product records are untouched.
describe.skipIf(!process.env.TEST_DATABASE_URL)('public attachment boundary', () => {
  let pool: pg.Pool;
  let repository: PlatformRepository;
  let knowledge: KnowledgeRepository;
  let actorId: string;
  let problem: { id: string; slug: string };
  const mediaId = crypto.randomUUID();
  const stranger = crypto.randomUUID();

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL!;
    pool = new pg.Pool({ connectionString: url });
    repository = createPlatformRepository(url);
    knowledge = createKnowledgeRepository(url);
    const subject = `media-audit-${crypto.randomUUID()}`;
    actorId = (await repository.syncActor({ provider: 'dev', subject, sessionId: subject })).id;
    problem = (await repository.createProblem(actorId, {
      title: 'Attachment boundary integration fixture',
      summary: 'A temporary test record for validating media authorization.',
      description: 'This record exists only for the attachment integration regression checks.',
      affectedGroups: ['test'],
      evidence: [],
      constraints: [],
      successMetrics: [],
      visibility: 'public',
    })) as typeof problem;
    await pool.query(
      `insert into public.media_assets(id,owner_id,bucket,object_key,visibility,content_type,size_bytes,status)
      values($1,$2,'public-media','audit/fixture.png','public','image/png',100,'uploaded')`,
      [mediaId, actorId],
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.query('delete from public.entity_media_assets where media_asset_id=$1', [mediaId]);
      await pool.query('delete from public.media_assets where id=$1', [mediaId]);
      if (problem) await pool.query('delete from public.problems where id=$1', [problem.id]);
      if (actorId) {
        await pool.query('delete from public.notifications where user_id=$1', [actorId]);
        await pool.query('delete from public.idempotency_keys where actor_id=$1', [actorId]);
        await pool.query('delete from public.ideas where created_by=$1', [actorId]);
        await pool.query('delete from public.problems where created_by=$1', [actorId]);
        await pool.query('delete from public.likes where user_id=$1', [actorId]);
        await pool.query('delete from public.follows where follower_id=$1', [actorId]);
        await pool.query('delete from public.collections where user_id=$1', [actorId]);
        await pool.query('delete from public.users where id=$1', [actorId]);
      }
      await Promise.all([repository?.close(), knowledge?.close(), pool.end()]);
    }
  });

  it('serializes concurrent creation retries and rejects a changed request payload', async () => {
    const key = crypto.randomUUID();
    const input = {
      title: 'Idempotent publication integration fixture',
      summary: 'A temporary record to verify concurrent request retries.',
      description: 'This fixture validates exactly one creation for a repeated request key.',
      affectedGroups: [],
      evidence: [],
      constraints: [],
      successMetrics: [],
      visibility: 'public' as const,
    };
    const results = (await Promise.all([
      repository.createProblem(actorId, input, key),
      repository.createProblem(actorId, input, key),
    ])) as [{ id: string }, { id: string }];
    expect(results[0].id).toBe(results[1].id);
    expect(
      (
        await pool.query('select id from public.problems where created_by=$1 and title=$2', [
          actorId,
          input.title,
        ])
      ).rowCount,
    ).toBe(1);
    await expect(
      repository.createProblem(actorId, { ...input, title: 'A changed request payload' }, key),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(((await repository.createProblem(actorId, input, key)) as { id: string }).id).toBe(
      results[0].id,
    );
  });

  it('allows attachment and publication retries without duplicates or extra versions', async () => {
    await repository.attachMediaAsset(actorId, mediaId, 'problem', problem.id, 0);
    await repository.attachMediaAsset(actorId, mediaId, 'problem', problem.id, 0);
    expect(
      (
        await pool.query('select * from public.entity_media_assets where media_asset_id=$1', [
          mediaId,
        ])
      ).rowCount,
    ).toBe(1);
    expect(await repository.getMediaAssetForView(null, mediaId)).toBeNull();
    expect(await repository.getMediaAssetForView(stranger, mediaId)).toBeNull();
    expect(await repository.getMediaAssetForView(actorId, mediaId)).not.toBeNull();
    await repository.publishEntity(actorId, 'problems', problem.id);
    const version = (
      await pool.query<{ content_version: number }>(
        'select content_version from public.problems where id=$1',
        [problem.id],
      )
    ).rows[0]?.content_version;
    await repository.publishEntity(actorId, 'problems', problem.id);
    expect(
      (
        await pool.query<{ content_version: number }>(
          'select content_version from public.problems where id=$1',
          [problem.id],
        )
      ).rows[0]?.content_version,
    ).toBe(version);
    expect(await repository.getMediaAssetForView(null, mediaId)).not.toBeNull();
    expect((await knowledge.findProblem(problem.slug))?.media?.map((item) => item.id)).toEqual([
      mediaId,
    ]);
  });

  it('persists account reactions across connections and isolates another account', async () => {
    await Promise.all([
      repository.setReaction(actorId, 'problem', problem.slug, 'bookmark', true),
      repository.setReaction(actorId, 'problem', problem.slug, 'bookmark', true),
    ]);
    await repository.setReaction(actorId, 'problem', problem.slug, 'like', true);
    await repository.setReaction(actorId, 'problem', problem.slug, 'follow', true);
    const anotherDevice = createPlatformRepository(process.env.TEST_DATABASE_URL!);
    try {
      expect(await anotherDevice.getReactions(actorId, 'problem', problem.slug)).toEqual({
        bookmarked: true,
        liked: true,
        following: true,
      });
      expect(await anotherDevice.getReactions(stranger, 'problem', problem.slug)).toEqual({
        bookmarked: false,
        liked: false,
        following: false,
      });
      expect(await anotherDevice.listLibrary(actorId, 'bookmarks', 30, 0)).toHaveLength(1);
      expect(await anotherDevice.listLibrary(actorId, 'bookmarks', 30, 1)).toHaveLength(0);
      expect(await anotherDevice.listLibrary(stranger, 'bookmarks', 30, 0)).toHaveLength(0);
      await anotherDevice.setReaction(actorId, 'problem', problem.slug, 'bookmark', false);
      expect(await repository.listLibrary(actorId, 'bookmarks', 30, 0)).toHaveLength(0);
    } finally {
      await anotherDevice.close();
    }
  });

  it('reads all published Problem and Idea fields from a separate database connection', async () => {
    const created = await repository.createProblem(actorId, {
      title: 'Published fields integration fixture',
      summary: 'A sufficiently descriptive summary of this field test.',
      description: 'The full description persists through the database and public reader.',
      industry: 'Logistics',
      region: 'Vietnam',
      affectedGroups: ['operators'],
      evidence: ['https://example.com/evidence'],
      desiredOutcome: 'Reduce waiting time',
      constraints: ['No additional hardware'],
      successMetrics: ['Wait time'],
      visibility: 'public',
    });
    const createdRecord = created as { id: string; slug: string };
    await repository.publishEntity(actorId, 'problems', createdRecord.id);
    const detail = await knowledge.findProblem(createdRecord.slug);
    expect(detail).toMatchObject({
      industry: 'Logistics',
      region: 'Vietnam',
      desiredOutcome: 'Reduce waiting time',
      constraints: ['No additional hardware'],
    });
    const idea = await repository.createIdea(actorId, {
      problemId: createdRecord.id,
      title: 'Published idea field integration fixture',
      summary: 'A complete summary for the Idea field round trip.',
      thesis: 'A concrete thesis for testing the read contract.',
      solution: 'A concrete solution with sufficient explanation.',
      opportunity: 'Opportunity context',
      whyNow: 'New demand',
      targetUsers: ['operators'],
      risks: ['Adoption'],
      validationPlan: 'Run a controlled trial',
      visibility: 'public',
    });
    const ideaRecord = idea as { id: string; slug: string };
    await repository.publishEntity(actorId, 'ideas', ideaRecord.id);
    expect(await knowledge.findIdea(ideaRecord.slug)).toMatchObject({
      whyNow: 'New demand',
      risks: ['Adoption'],
      validationPlan: 'Run a controlled trial',
    });
  });

  it('makes the last result reachable after the first thirty search results', async () => {
    const marker = `auditcursor${crypto.randomUUID().replaceAll('-', '')}`;
    await pool.query(
      `insert into public.problems(slug,title,summary,description,created_by,status,visibility)
      select $1||'-'||n,$1||' record '||n,'Search pagination fixture','A temporary fixture for search pagination.',$2,'published','public' from generate_series(1,31) n`,
      [marker, actorId],
    );
    const first = (await repository.searchPublic(marker, 30, 0)) as { slug: string }[];
    const last = (await repository.searchPublic(marker, 30, 30)) as { slug: string }[];
    expect(first).toHaveLength(30);
    expect(last).toHaveLength(1);
    expect(new Set([...first, ...last].map((item) => item.slug)).size).toBe(31);
  });

  it('counts unread notifications across pages and rejects another account marking them read', async () => {
    const row = await pool.query<{ id: string }>(
      `insert into public.notifications(user_id,type,payload)
      select $1,'bounty_winner','{}'::jsonb from generate_series(1,31) returning id`,
      [actorId],
    );
    expect(await repository.unreadNotificationCount(actorId)).toBe(31);
    expect(await repository.unreadNotificationCount(stranger)).toBe(0);
    expect(await repository.listNotifications(actorId, 30, 30)).toHaveLength(1);
    const id = row.rows[0]!.id;
    expect(await repository.markNotificationRead(stranger, id)).toBe(false);
    expect(await repository.markNotificationRead(actorId, id)).toBe(true);
    expect(await repository.markNotificationRead(actorId, id)).toBe(true);
    expect(await repository.unreadNotificationCount(actorId)).toBe(30);
  });

  it('does not turn private, removed or submission-only media into public downloads', async () => {
    await pool.query("update public.problems set visibility='private' where id=$1", [problem.id]);
    expect(await repository.getMediaAssetForView(null, mediaId)).toBeNull();
    expect(await knowledge.findProblem(problem.slug)).toBeNull();
    await pool.query(
      "update public.problems set visibility='public',deleted_at=now() where id=$1",
      [problem.id],
    );
    expect(await repository.getMediaAssetForView(null, mediaId)).toBeNull();
    await pool.query(
      "update public.entity_media_assets set entity_type='submission',entity_id=$2 where media_asset_id=$1",
      [mediaId, crypto.randomUUID()],
    );
    expect(await repository.getMediaAssetForView(null, mediaId)).toBeNull();
    expect(await repository.getMediaAssetForView(stranger, mediaId)).toBeNull();
  });
});
