import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PublicKey } from '@solana/web3.js';
import { afterEach, describe, expect, it } from 'vitest';
import { createDevMockAuthProvider } from './mock-auth.js';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('development mock account', () => {
  it('creates one persistent Solana keypair without exposing its secret', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'gimme-idea-wallet-'));
    temporaryDirectories.push(directory);
    const keypairPath = join(directory, 'mock.keypair.json');
    const authenticate = createDevMockAuthProvider(keypairPath);

    const first = await authenticate();
    const second = await authenticate();

    expect(first.wallet.address).toBe(second.wallet.address);
    expect(new PublicKey(first.wallet.address).toBase58()).toBe(first.wallet.address);
    expect(first).not.toHaveProperty('wallet.secretKey');
    expect((await stat(keypairPath)).mode & 0o777).toBe(0o600);
  });
});
