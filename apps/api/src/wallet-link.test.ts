import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';
import { createWalletLinkChallenge, verifyWalletLinkChallenge } from './wallet-link.js';

describe('wallet linking challenge', () => {
  it('binds a single signature to user, wallet, and nonce', () => {
    const keypair = Keypair.generate();
    const challenge = createWalletLinkChallenge('actor-1', keypair.publicKey.toBase58());
    const signature = Buffer.from(
      nacl.sign.detached(Buffer.from(challenge.message), keypair.secretKey),
    ).toString('base64');
    expect(
      verifyWalletLinkChallenge({
        userId: 'actor-1',
        walletAddress: keypair.publicKey.toBase58(),
        nonce: challenge.nonce,
        signature,
      }).nonceHash,
    ).toBe(challenge.nonceHash);
    expect(() =>
      verifyWalletLinkChallenge({
        userId: 'actor-2',
        walletAddress: keypair.publicKey.toBase58(),
        nonce: challenge.nonce,
        signature,
      }),
    ).toThrow('Wallet signature verification failed');
  });
});
