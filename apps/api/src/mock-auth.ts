import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { Keypair } from '@solana/web3.js';
import { issueDevAccessToken } from '@gimme-idea/auth';

export type DevMockSession = {
  accessToken: string;
  user: {
    id: 'dev-mock-builder';
    displayName: 'Devnet Builder';
    username: 'devnet-builder';
    avatarUrl: null;
  };
  wallet: {
    address: string;
    network: 'devnet';
    custody: 'development-server';
  };
};

async function readKeypair(filePath: string) {
  const bytes = JSON.parse(await readFile(filePath, 'utf8')) as unknown;
  if (
    !Array.isArray(bytes) ||
    bytes.length !== 64 ||
    bytes.some((value) => !Number.isInteger(value))
  ) {
    throw new Error('The development wallet keypair file is invalid.');
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes as number[]));
}

async function getOrCreateKeypair(filePath: string) {
  try {
    return await readKeypair(filePath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      const keypair = Keypair.generate();
      await mkdir(dirname(filePath), { recursive: true });
      try {
        await writeFile(filePath, JSON.stringify(Array.from(keypair.secretKey)), {
          encoding: 'utf8',
          mode: 0o600,
          flag: 'wx',
        });
        return keypair;
      } catch (writeError) {
        if (
          writeError &&
          typeof writeError === 'object' &&
          'code' in writeError &&
          writeError.code === 'EEXIST'
        ) {
          return readKeypair(filePath);
        }
        throw writeError;
      }
    }
    throw error;
  }
}

export function createDevMockAuthProvider(keypairPath: string, authSecret: string) {
  const absolutePath = resolve(keypairPath);
  return async (): Promise<DevMockSession> => {
    const keypair = await getOrCreateKeypair(absolutePath);
    return {
      accessToken: issueDevAccessToken('dev-mock-builder', authSecret),
      user: {
        id: 'dev-mock-builder',
        displayName: 'Devnet Builder',
        username: 'devnet-builder',
        avatarUrl: null,
      },
      wallet: {
        address: keypair.publicKey.toBase58(),
        network: 'devnet',
        custody: 'development-server',
      },
    };
  };
}
