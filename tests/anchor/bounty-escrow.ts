import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { AnchorProvider, BN, Idl, Program, Wallet } from '@coral-xyz/anchor';
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

const PROGRAM_ID = new PublicKey('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6');
const PLATFORM_SEED = Buffer.from('platform');
const BOUNTY_SEED = Buffer.from('bounty');
const DECIMALS = 6;
const PRIZE_POOL = 5_000_000;
const PLATFORM_FEE = 100_000;

function loadPayer(): Keypair {
  const configuredPath = process.env.ANCHOR_WALLET ?? '~/.config/solana/id.json';
  const walletPath = configuredPath.startsWith('~/')
    ? resolve(homedir(), configuredPath.slice(2))
    : resolve(configuredPath);
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(walletPath, 'utf8'))));
}

function hash(value: string): number[] {
  return [...createHash('sha256').update(value).digest()];
}

async function expectFailure(label: string, operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch {
    console.log(`✓ ${label}`);
    return;
  }
  throw new Error(`Expected failure: ${label}`);
}

async function chainTime(connection: Connection) {
  const slot = await connection.getSlot('confirmed');
  return (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1000);
}

async function waitForChainTime(connection: Connection, timestamp: number) {
  const timeoutAt = Date.now() + 45_000;
  while ((await chainTime(connection)) < timestamp) {
    if (Date.now() > timeoutAt)
      throw new Error('Validator clock did not reach submission deadline');
    await new Promise((resolveWait) => setTimeout(resolveWait, 1_000));
  }
}

async function main() {
  const payer = loadPayer();
  const connection = new Connection(
    process.env.ANCHOR_PROVIDER_URL ?? 'http://127.0.0.1:8899',
    'confirmed',
  );
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  const idl = JSON.parse(readFileSync('target/idl/bounty_escrow.json', 'utf8')) as Idl;
  const program = new Program(idl, provider) as Program & {
    account: { bountyEscrow: { fetch(address: PublicKey): Promise<any> } };
  };

  const winner = Keypair.generate();
  const treasury = Keypair.generate();
  const intruder = Keypair.generate();
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
  await program.methods
    .initializePlatform(
      payer.publicKey,
      payer.publicKey,
      treasury.publicKey,
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

  const bountyId = hash(`local-bounty-${Date.now()}`);
  const termsHash = hash('Gimme Idea local integration bounty terms v1');
  const [bounty] = PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, Buffer.from(bountyId)],
    PROGRAM_ID,
  );
  const vault = getAssociatedTokenAddressSync(mint, bounty, true);
  const now = await chainTime(connection);
  const submissionDeadline = now + 8;
  const judgingDeadline = now + 120;

  await program.methods
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

  await program.methods
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

  await program.methods
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

  await expectFailure('active bounty cannot be cancelled by its sponsor', () =>
    program.methods
      .cancelBeforeActivation()
      .accountsStrict({
        bounty,
        vault,
        sponsorTokenAccount: sponsorTokenAccount.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc(),
  );

  await expectFailure('only the committed judge can finalize a winner', () =>
    program.methods
      .finalizeWinner(winner.publicKey)
      .accountsStrict({ platformConfig, bounty, judge: intruder.publicKey })
      .signers([intruder])
      .rpc(),
  );

  await waitForChainTime(connection, submissionDeadline);

  await program.methods
    .finalizeWinner(winner.publicKey)
    .accountsStrict({ platformConfig, bounty, judge: payer.publicKey })
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
    treasury.publicKey,
  );

  await program.methods
    .settleBounty()
    .accountsStrict({
      platformConfig,
      bounty,
      vault,
      winnerTokenAccount: winnerTokenAccount.address,
      treasuryTokenAccount: treasuryTokenAccount.address,
      sponsorTokenAccount: sponsorTokenAccount.address,
      winner: winner.publicKey,
      treasury: treasury.publicKey,
      sponsor: payer.publicKey,
      mint,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  const winnerBalance = await getAccount(connection, winnerTokenAccount.address);
  const treasuryBalance = await getAccount(connection, treasuryTokenAccount.address);
  const vaultBalance = await getAccount(connection, vault);
  const bountyAccount = await program.account.bountyEscrow.fetch(bounty);
  const finalState = Object.keys(bountyAccount.state)[0];

  if (winnerBalance.amount !== BigInt(PRIZE_POOL)) throw new Error('Winner payout mismatch');
  if (treasuryBalance.amount !== BigInt(PLATFORM_FEE)) throw new Error('Treasury fee mismatch');
  if (vaultBalance.amount !== 0n) throw new Error('Vault must be empty after settlement');
  if (finalState !== 'settled') throw new Error(`Unexpected final state: ${finalState}`);

  await expectFailure('a settled bounty cannot pay twice', () =>
    program.methods
      .settleBounty()
      .accountsStrict({
        platformConfig,
        bounty,
        vault,
        winnerTokenAccount: winnerTokenAccount.address,
        treasuryTokenAccount: treasuryTokenAccount.address,
        sponsorTokenAccount: sponsorTokenAccount.address,
        winner: winner.publicKey,
        treasury: treasury.publicKey,
        sponsor: payer.publicKey,
        mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc(),
  );

  console.log('✓ winner received 5.0 test USDC');
  console.log('✓ treasury received 0.1 test USDC');
  console.log('✓ vault is empty and bounty is settled');
  console.log(`bounty=${bounty.toBase58()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
