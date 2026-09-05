import { createHash, randomBytes } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

const DOMAIN = 'GIMME_IDEA_LINK_SOLANA_WALLET_V1';

export function createWalletLinkChallenge(userId: string, walletAddress: string) {
  const address = new PublicKey(walletAddress).toBase58();
  const nonce = randomBytes(24).toString('base64url');
  const message = `${DOMAIN}\nUser: ${userId}\nWallet: ${address}\nNonce: ${nonce}`;
  return { address, nonce, message, nonceHash: createHash('sha256').update(nonce).digest('hex') };
}

export function verifyWalletLinkChallenge(input: {
  userId: string;
  walletAddress: string;
  nonce: string;
  signature: string;
}) {
  const address = new PublicKey(input.walletAddress).toBase58();
  const message = `${DOMAIN}\nUser: ${input.userId}\nWallet: ${address}\nNonce: ${input.nonce}`;
  const signature = Buffer.from(input.signature, 'base64');
  if (
    signature.length !== 64 ||
    !nacl.sign.detached.verify(Buffer.from(message), signature, new PublicKey(address).toBytes())
  )
    throw Object.assign(new Error('Wallet signature verification failed.'), {
      statusCode: 401,
      code: 'INVALID_WALLET_SIGNATURE',
    });
  return { address, nonceHash: createHash('sha256').update(input.nonce).digest('hex') };
}
