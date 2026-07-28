import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const nextDir = join(process.cwd(), '.next');
const packageJsonPath = join(nextDir, 'package.json');

await mkdir(nextDir, { recursive: true });
await writeFile(packageJsonPath, `${JSON.stringify({ type: 'commonjs' })}\n`);
