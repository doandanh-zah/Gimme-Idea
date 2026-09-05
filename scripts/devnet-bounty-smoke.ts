import { createHash, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
  getMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import {
  BOUNTY_ESCROW_PROGRAM_ID,
  deriveBountyEscrowPda,
  deriveBountyIdFromUuid,
  derivePlatformConfigPda,
  deriveVaultAddress,
} from '../packages/solana/src/index.js';
import type { BountyEscrow } from '../target/types/bounty_escrow.js';

const PROGRAM_ID = new PublicKey(BOUNTY_ESCROW_PROGRAM_ID);
const PRIZE = 1_000_000n;
const FEE = 50_000n;
const REQUIRED = PRIZE + FEE;

function loadKeypair(pathValue: string) {
  const path = pathValue.startsWith('~/')
    ? resolve(homedir(), pathValue.slice(2))
    : resolve(pathValue);
  const secret: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(secret) || !secret.every((value) => Number.isInteger(value))) {
    throw new Error(`Invalid Solana keypair at ${path}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(secret as number[]));
}

async function chainTime(connection: Connection) {
  const slot = await connection.getSlot('confirmed');
  return (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1_000);
}

async function waitForChainTime(connection: Connection, timestamp: number) {
  const timeout = Date.now() + 180_000;
  while ((await chainTime(connection)) < timestamp) {
    if (Date.now() > timeout) throw new Error(`Devnet clock did not reach ${timestamp}`);
    await new Promise((done) => setTimeout(done, 2_000));
  }
}

function stateName(state: Record<string, unknown>) {
  return Object.keys(state)[0];
}

function hashSmokeTerms(input: {
  uuid: string;
  stage: 'IDEA' | 'BUILD' | 'CANCELLATION';
  mint: string;
  submissionDeadline: number;
  judgingDeadline: number;
}) {
  const canonicalPayload = JSON.stringify({
    version: 1,
    bountyUuid: input.uuid,
    stage: input.stage,
    mint: input.mint,
    prizePoolRaw: PRIZE.toString(),
    platformFeeRaw: FEE.toString(),
    submissionDeadline: input.submissionDeadline,
    judgingDeadline: input.judgingDeadline,
  });
  return createHash('sha256')
    .update('GIMME_IDEA_TERMS_V1\0', 'utf8')
    .update(canonicalPayload, 'utf8')
    .digest();
}

async function main() {
  const payer = loadKeypair(process.env.ANCHOR_WALLET ?? '~/.config/solana/id.json');
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL ?? 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  const idl = JSON.parse(readFileSync('target/idl/bounty_escrow.json', 'utf8')) as BountyEscrow;
  const program = new Program<BountyEscrow>(idl, provider);
  const deployed = await connection.getAccountInfo(PROGRAM_ID);
  if (!deployed?.executable) throw new Error(`Program ${PROGRAM_ID.toBase58()} is not executable`);

  const platformConfig = derivePlatformConfigPda(PROGRAM_ID);
  const config = await program.account.platformConfig.fetch(platformConfig);
  if (config.paused) throw new Error('Platform is paused; smoke test will not create commitments');
  const mint = config.approvedMint;
  const mintAccount = await getMint(connection, mint, 'confirmed', TOKEN_PROGRAM_ID);
  const sponsorAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  const requiredForRun = REQUIRED * 3n;
  if (sponsorAta.amount < requiredForRun) {
    if (!mintAccount.mintAuthority?.equals(payer.publicKey)) {
      throw new Error(
        `Sponsor needs ${requiredForRun} raw units of the approved mint; payer is not mint authority`,
      );
    }
    await mintTo(
      connection,
      payer,
      mint,
      sponsorAta.address,
      payer,
      requiredForRun - sponsorAta.amount,
    );
  }

  const runStage = async (kind: 'idea' | 'build') => {
    const uuid = randomUUID();
    const id = deriveBountyIdFromUuid(uuid);
    const bounty = deriveBountyEscrowPda(id, PROGRAM_ID);
    const vault = deriveVaultAddress(mint, bounty);
    const winner = Keypair.generate().publicKey;
    const winnerAta = getAssociatedTokenAddressSync(mint, winner);
    const treasuryAta = getAssociatedTokenAddressSync(mint, config.treasury);
    const now = await chainTime(connection);
    const submissionDeadline = now + 30;
    const judgingDeadline = now + 150;
    const termsHash = hashSmokeTerms({
      uuid,
      stage: kind.toUpperCase() as 'IDEA' | 'BUILD',
      mint: mint.toBase58(),
      submissionDeadline,
      judgingDeadline,
    });

    const initialize = await program.methods
      .initializeBounty(
        [...id],
        [...termsHash],
        payer.publicKey,
        new BN(PRIZE.toString()),
        new BN(FEE.toString()),
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
    const fund = await program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty,
        vault,
        sponsorTokenAccount: sponsorAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    const activate = await program.methods
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
    await waitForChainTime(connection, submissionDeadline);
    const finalize = await program.methods
      .finalizeWinner(winner)
      .accountsStrict({ platformConfig, bounty, judge: payer.publicKey })
      .rpc();
    const treasuryBefore = await connection.getTokenAccountBalance(treasuryAta).catch(() => null);
    const settle = await program.methods
      .settleBounty()
      .accountsStrict({
        platformConfig,
        bounty,
        vault,
        winnerTokenAccount: winnerAta,
        treasuryTokenAccount: treasuryAta,
        sponsorTokenAccount: sponsorAta.address,
        winner,
        treasury: config.treasury,
        sponsor: payer.publicKey,
        mint,
        settler: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.bountyEscrow.fetch(bounty);
    const winnerBalance = (await getAccount(connection, winnerAta)).amount;
    const treasuryAfter = (await getAccount(connection, treasuryAta)).amount;
    const treasuryBeforeRaw = BigInt(treasuryBefore?.value.amount ?? '0');
    const vaultClosed = (await connection.getAccountInfo(vault)) === null;
    if (stateName(account.state) !== 'settled') throw new Error(`${kind} bounty did not settle`);
    if (winnerBalance !== PRIZE) throw new Error(`${kind} winner payout mismatch`);
    if (treasuryAfter - treasuryBeforeRaw !== FEE) throw new Error(`${kind} treasury fee mismatch`);
    if (!vaultClosed) throw new Error(`${kind} vault did not close`);

    return {
      kind,
      databaseUuid: uuid,
      bountyIdHex: Buffer.from(id).toString('hex'),
      bounty: bounty.toBase58(),
      vault: vault.toBase58(),
      winner: winner.toBase58(),
      finalState: stateName(account.state),
      prizeRaw: PRIZE.toString(),
      feeRaw: FEE.toString(),
      winnerBalanceRaw: winnerBalance.toString(),
      treasuryDeltaRaw: (treasuryAfter - treasuryBeforeRaw).toString(),
      vaultClosed,
      signatures: { initialize, fund, activate, finalize, settle },
    };
  };

  const runCancellation = async () => {
    const uuid = randomUUID();
    const id = deriveBountyIdFromUuid(uuid);
    const bounty = deriveBountyEscrowPda(id, PROGRAM_ID);
    const vault = deriveVaultAddress(mint, bounty);
    const now = await chainTime(connection);
    const submissionDeadline = now + 120;
    const judgingDeadline = now + 240;
    const termsHash = hashSmokeTerms({
      uuid,
      stage: 'CANCELLATION',
      mint: mint.toBase58(),
      submissionDeadline,
      judgingDeadline,
    });
    const initialize = await program.methods
      .initializeBounty(
        [...id],
        [...termsHash],
        payer.publicKey,
        new BN(PRIZE.toString()),
        new BN(FEE.toString()),
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
    const fund = await program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty,
        vault,
        sponsorTokenAccount: sponsorAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    const cancel = await program.methods
      .cancelBeforeActivation()
      .accountsStrict({
        bounty,
        vault,
        sponsorTokenAccount: sponsorAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const account = await program.account.bountyEscrow.fetch(bounty);
    return {
      databaseUuid: uuid,
      bountyIdHex: Buffer.from(id).toString('hex'),
      bounty: bounty.toBase58(),
      finalState: stateName(account.state),
      vaultClosed: (await connection.getAccountInfo(vault)) === null,
      signatures: { initialize, fund, cancel },
    };
  };

  // Product invariant: Stage 2 is only created after Stage 1 is observably settled.
  const idea = await runStage('idea');
  const build = await runStage('build');
  if (idea.bountyIdHex === build.bountyIdHex || idea.bounty === build.bounty) {
    throw new Error('Idea and Build bounty identities collided');
  }
  const cancellation = await runCancellation();

  console.log(
    JSON.stringify(
      {
        schemaVersion: 1,
        network: 'devnet',
        programId: PROGRAM_ID.toBase58(),
        platformConfig: platformConfig.toBase58(),
        approvedMint: mint.toBase58(),
        sponsor: payer.publicKey.toBase58(),
        idea,
        build,
        cancellation,
        resolution: {
          status: 'not_run',
          reason:
            'The configured Devnet arbitration authority keypair was not supplied to this smoke run.',
        },
        completedAt: new Date().toISOString(),
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
