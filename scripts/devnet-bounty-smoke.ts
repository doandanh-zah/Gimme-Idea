import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import type { BountyEscrow } from '../target/types/bounty_escrow.js';

const PROGRAM_ID = new PublicKey('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6');
const OWNER_AUTHORITY = new PublicKey('FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm');
const PLATFORM_SEED = Buffer.from('platform');
const BOUNTY_SEED = Buffer.from('bounty');
const DECIMALS = 6;
const PRIZE_POOL = 10_000_000;
const PLATFORM_FEE = 250_000;

function isSecretKey(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        typeof item === 'number' && Number.isInteger(item) && item >= 0 && item <= 255,
    )
  );
}

function loadPayer(): Keypair {
  const configuredPath = process.env.ANCHOR_WALLET ?? '~/.config/solana/id.json';
  const walletPath = configuredPath.startsWith('~/')
    ? resolve(homedir(), configuredPath.slice(2))
    : resolve(configuredPath);
  const secretKey: unknown = JSON.parse(readFileSync(walletPath, 'utf8'));
  if (!isSecretKey(secretKey)) throw new Error(`Invalid Solana keypair at ${walletPath}`);
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}

function hash(value: string) {
  return [...createHash('sha256').update(value).digest()];
}

async function chainTime(connection: Connection) {
  const slot = await connection.getSlot('confirmed');
  return (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1_000);
}

async function waitForChainTime(connection: Connection, timestamp: number) {
  const timeoutAt = Date.now() + 150_000;
  while ((await chainTime(connection)) < timestamp) {
    if (Date.now() > timeoutAt)
      throw new Error('Devnet clock did not reach the submission deadline');
    await new Promise((resolveWait) => setTimeout(resolveWait, 2_000));
  }
}

async function main() {
  const payer = loadPayer();
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL ?? 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  const idl = JSON.parse(readFileSync('target/idl/bounty_escrow.json', 'utf8')) as BountyEscrow;
  const program = new Program<BountyEscrow>(idl, provider);

  const deployed = await connection.getAccountInfo(PROGRAM_ID);
  if (!deployed?.executable)
    throw new Error(`Program ${PROGRAM_ID.toBase58()} is not deployed on Devnet`);

  const winner = Keypair.generate();
  const mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  const sponsorTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  await mintTo(
    connection,
    payer,
    mint,
    sponsorTokenAccount.address,
    payer,
    PRIZE_POOL + PLATFORM_FEE,
  );

  const [platformConfig] = PublicKey.findProgramAddressSync([PLATFORM_SEED], PROGRAM_ID);
  const initializePlatformSignature = await program.methods
    .initializePlatform(
      OWNER_AUTHORITY,
      OWNER_AUTHORITY,
      OWNER_AUTHORITY,
      500,
      new BN(1_000_000_000),
    )
    .accountsStrict({
      platformConfig,
      approvedMint: mint,
      admin: payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const nonce = `${Date.now()}-${payer.publicKey.toBase58()}`;
  const bountyId = hash(`gimme-idea-devnet-bounty:${nonce}`);
  const termsHash = hash(`Gimme Idea Devnet test bounty terms v1:${nonce}`);
  const [bounty] = PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, Buffer.from(bountyId)],
    PROGRAM_ID,
  );
  const vault = getAssociatedTokenAddressSync(mint, bounty, true);
  const now = await chainTime(connection);
  const submissionDeadline = now + 60;
  const judgingDeadline = now + 300;

  const initializeBountySignature = await program.methods
    .initializeBounty(
      bountyId,
      termsHash,
      payer.publicKey,
      new BN(PRIZE_POOL),
      new BN(PLATFORM_FEE),
      new BN(submissionDeadline),
      new BN(judgingDeadline),
    )
    .accountsStrict({
      platformConfig,
      bounty,
      vault,
      mint,
      sponsor: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  const fundSignature = await program.methods
    .fundBounty()
    .accountsStrict({
      platformConfig,
      bounty,
      vault,
      sponsorTokenAccount: sponsorTokenAccount.address,
      mint,
      sponsor: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const activateSignature = await program.methods
    .activateBounty()
    .accountsStrict({
      platformConfig,
      bounty,
      vault,
      mint,
      sponsor: payer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const winnerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    winner.publicKey,
  );
  const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    OWNER_AUTHORITY,
  );

  await waitForChainTime(connection, submissionDeadline);
  const finalizeSignature = await program.methods
    .finalizeWinner(winner.publicKey)
    .accountsStrict({ platformConfig, bounty, judge: payer.publicKey })
    .rpc();

  const settleSignature = await program.methods
    .settleBounty()
    .accountsStrict({
      platformConfig,
      bounty,
      vault,
      winnerTokenAccount: winnerTokenAccount.address,
      treasuryTokenAccount: treasuryTokenAccount.address,
      sponsorTokenAccount: sponsorTokenAccount.address,
      winner: winner.publicKey,
      treasury: OWNER_AUTHORITY,
      sponsor: payer.publicKey,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const winnerBalance = await getAccount(connection, winnerTokenAccount.address);
  const treasuryBalance = await getAccount(connection, treasuryTokenAccount.address);
  const vaultBalance = await getAccount(connection, vault);
  if (winnerBalance.amount !== BigInt(PRIZE_POOL)) throw new Error('Winner payout mismatch');
  if (treasuryBalance.amount !== BigInt(PLATFORM_FEE)) throw new Error('Treasury fee mismatch');
  if (vaultBalance.amount !== 0n) throw new Error('Vault must be empty after settlement');

  console.log(
    JSON.stringify(
      {
        network: 'devnet',
        program: PROGRAM_ID.toBase58(),
        platformConfig: platformConfig.toBase58(),
        ownerAuthority: OWNER_AUTHORITY.toBase58(),
        mint: mint.toBase58(),
        bounty: bounty.toBase58(),
        vault: vault.toBase58(),
        winner: winner.publicKey.toBase58(),
        prizeRaw: PRIZE_POOL.toString(),
        platformFeeRaw: PLATFORM_FEE.toString(),
        signatures: {
          initializePlatform: initializePlatformSignature,
          initializeBounty: initializeBountySignature,
          fund: fundSignature,
          activate: activateSignature,
          finalize: finalizeSignature,
          settle: settleSignature,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
