import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const appRoot = resolve(import.meta.dirname, '..');
const standaloneRoot = resolve(appRoot, '.next/standalone/apps/web');

await mkdir(resolve(standaloneRoot, '.next'), { recursive: true });
await cp(resolve(appRoot, '.next/static'), resolve(standaloneRoot, '.next/static'), {
  recursive: true,
  force: true,
});
await cp(resolve(appRoot, 'public'), resolve(standaloneRoot, 'public'), {
  recursive: true,
  force: true,
});
