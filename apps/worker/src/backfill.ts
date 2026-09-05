import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createWorkerRepository } from '@gimme-idea/db';
import { normalizeColosseumProject } from './runtime.js';

const databaseUrl = process.env.DATABASE_URL;
const sourceFile = process.env.COLOSSEUM_EXPORT_FILE;
if (!databaseUrl || !sourceFile)
  throw new Error('DATABASE_URL and COLOSSEUM_EXPORT_FILE are required.');
const payload = JSON.parse(await readFile(resolve(sourceFile), 'utf8')) as {
  projects?: Record<string, unknown>[];
};
if (!Array.isArray(payload.projects)) throw new Error('The export must contain a projects array.');
const repository = createWorkerRepository(databaseUrl);
let changed = 0;
try {
  for (const raw of payload.projects) {
    const item = normalizeColosseumProject(raw);
    if (!item) continue;
    const payloadHash = createHash('sha256').update(JSON.stringify(raw)).digest('hex');
    if (
      await repository.upsertImportedEntity({
        sourceName: 'Colosseum',
        sourceType: 'official_json_export',
        ...item,
        payloadHash,
        payload: raw,
      })
    )
      changed++;
  }
  await repository.updateImportCursor('Colosseum', {
    mode: 'backfill',
    processed: payload.projects.length,
    completedAt: new Date().toISOString(),
  });
} finally {
  await repository.close();
}
console.log(JSON.stringify({ processed: payload.projects.length, changed }));
