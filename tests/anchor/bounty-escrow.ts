import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  closeAccount,
  createMint,
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
} from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import BN from 'bn.js';
import { deriveBountyIdFromUuid } from '../../packages/solana/src/index.js';
import type { BountyEscrow } from '../../target/types/bounty_escrow.js';

const PROGRAM_ID = new PublicKey('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6');
const UPGRADEABLE_LOADER_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
const PLATFORM_SEED = Buffer.from('platform');
const BOUNTY_SEED = Buffer.from('bounty');
const DECIMALS = 6;
const PRIZE = 1_000_000;
const FEE = 50_000;
const REQUIRED = PRIZE + FEE;
const EXCESS = 7;

type Fixture = {
  bountyId: number[];
  bounty: PublicKey;
  vault: PublicKey;
  sponsor: Keypair;
  submissionDeadline: number;
  judgingDeadline: number;
};

function loadKeypair(configured: string) {
  const path = configured.startsWith('~/')
    ? resolve(homedir(), configured.slice(2))
    : resolve(configured);
  const bytes: unknown = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(bytes) || !bytes.every((value) => Number.isInteger(value))) {
    throw new Error(`Invalid Solana keypair at ${path}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes as number[]));
}

function loadPayer() {
  return loadKeypair(process.env.ANCHOR_WALLET ?? '~/.config/solana/id.json');
}

function terms(label: string) {
  return [...createHash('sha256').update(`Gimme Idea terms:${label}`).digest()];
}

function bountyId(sequence: number) {
  const uuid = `00000000-0000-4000-8000-${sequence.toString(16).padStart(12, '0')}`;
  return [...deriveBountyIdFromUuid(uuid)];
}

function stateName(state: Record<string, unknown>) {
  return Object.keys(state)[0];
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
  return (await connection.getBlockTime(slot)) ?? Math.floor(Date.now() / 1_000);
}

async function waitForChainTime(connection: Connection, timestamp: number) {
  const timeout = Date.now() + 60_000;
  while ((await chainTime(connection)) < timestamp) {
    if (Date.now() > timeout) throw new Error(`Validator clock did not reach ${timestamp}`);
    await new Promise((done) => setTimeout(done, 500));
  }
}

async function airdrop(connection: Connection, address: PublicKey, sol: number) {
  const signature = await connection.requestAirdrop(address, sol * 1_000_000_000);
  await connection.confirmTransaction(signature, 'confirmed');
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
  const idl = JSON.parse(readFileSync('target/idl/bounty_escrow.json', 'utf8')) as BountyEscrow;
  const program = new Program<BountyEscrow>(idl, provider);

  const attacker = Keypair.generate();
  const relay = Keypair.generate();
  const detachedSponsor = Keypair.generate();
  const refundSponsor = Keypair.generate();
  const winner = Keypair.generate();
  const resolutionWinner = Keypair.generate();
  await Promise.all([
    airdrop(connection, attacker.publicKey, 3),
    airdrop(connection, relay.publicKey, 6),
    airdrop(connection, detachedSponsor.publicKey, 3),
    airdrop(connection, refundSponsor.publicKey, 3),
  ]);

  const mint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  const wrongMint = await createMint(connection, payer, payer.publicKey, null, DECIMALS);
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey,
  );
  const attackerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    attacker.publicKey,
  );
  await mintTo(connection, payer, mint, payerAta.address, payer, 30_000_000);

  const [platformConfig] = PublicKey.findProgramAddressSync([PLATFORM_SEED], PROGRAM_ID);
  const [programData] = PublicKey.findProgramAddressSync(
    [PROGRAM_ID.toBuffer()],
    UPGRADEABLE_LOADER_ID,
  );
  const programDataInfo = await connection.getAccountInfo(programData);
  if (!programDataInfo || programDataInfo.data.length < 45) {
    throw new Error('Upgradeable ProgramData account is unavailable');
  }
  const programDataView = new DataView(
    programDataInfo.data.buffer,
    programDataInfo.data.byteOffset,
    programDataInfo.data.byteLength,
  );
  const deployedSlot = programDataView.getBigUint64(4, true);
  const deployedAuthority = new PublicKey(programDataInfo.data.subarray(13, 45));
  const platformInitializer = deployedAuthority.equals(payer.publicKey)
    ? payer
    : deployedSlot === 0n && deployedAuthority.equals(PublicKey.default)
      ? loadKeypair('target/deploy/bounty_escrow-keypair.json')
      : null;
  if (!platformInitializer) {
    throw new Error(`Test does not control upgrade authority ${deployedAuthority.toBase58()}`);
  }
  const platformAccounts = (admin: PublicKey, platformPayer: PublicKey) => ({
    platformConfig,
    approvedMint: mint,
    program: PROGRAM_ID,
    programData,
    admin,
    payer: platformPayer,
    systemProgram: SystemProgram.programId,
  });
  const platformInitializerSigners = platformInitializer.publicKey.equals(payer.publicKey)
    ? []
    : [platformInitializer];
  const initializePlatform = (
    pauseAuthority: PublicKey,
    arbitrationAuthority: PublicKey,
    treasury: PublicKey,
    maximumFeeBps = 500,
    maximumBountyAmount = 100_000_000,
  ) =>
    program.methods
      .initializePlatform(
        pauseAuthority,
        arbitrationAuthority,
        treasury,
        maximumFeeBps,
        new BN(maximumBountyAmount),
      )
      .accountsStrict(platformAccounts(platformInitializer.publicKey, payer.publicKey))
      .signers(platformInitializerSigners)
      .rpc();

  await expectFailure('attacker cannot front-run platform initialization', () =>
    program.methods
      .initializePlatform(
        attacker.publicKey,
        attacker.publicKey,
        attacker.publicKey,
        500,
        new BN(100_000_000),
      )
      .accountsStrict(platformAccounts(attacker.publicKey, attacker.publicKey))
      .signers([attacker])
      .rpc(),
  );
  await expectFailure('zero pause authority is rejected', () =>
    initializePlatform(PublicKey.default, payer.publicKey, payer.publicKey),
  );
  await expectFailure('zero arbitration authority is rejected', () =>
    initializePlatform(payer.publicKey, PublicKey.default, payer.publicKey),
  );
  await expectFailure('zero treasury is rejected', () =>
    initializePlatform(payer.publicKey, payer.publicKey, PublicKey.default),
  );
  await expectFailure('zero maximum bounty amount is rejected', () =>
    initializePlatform(payer.publicKey, payer.publicKey, payer.publicKey, 500, 0),
  );
  await expectFailure('platform fee cap above 10000 bps is rejected', () =>
    initializePlatform(payer.publicKey, payer.publicKey, payer.publicKey, 10_001),
  );
  await initializePlatform(payer.publicKey, payer.publicKey, payer.publicKey);
  await expectFailure('platform initialization cannot replay', () =>
    initializePlatform(payer.publicKey, payer.publicKey, payer.publicKey),
  );
  await expectFailure('unauthorized pause is rejected', () =>
    program.methods
      .setPaused(true)
      .accountsStrict({ platformConfig, pauseAuthority: attacker.publicKey })
      .signers([attacker])
      .rpc(),
  );

  let sequence = 1;
  const rawInitialize = async (input: {
    id?: number[];
    hash?: number[];
    sponsor?: Keypair;
    selectedMint?: PublicKey;
    prize?: number;
    fee?: number;
    submissionDeadline: number;
    judgingDeadline: number;
    judge?: PublicKey;
    bountyOverride?: PublicKey;
    vaultOverride?: PublicKey;
    tokenProgram?: PublicKey;
  }) => {
    const id = input.id ?? bountyId(sequence++);
    const sponsor = input.sponsor ?? payer;
    const selectedMint = input.selectedMint ?? mint;
    const tokenProgram = input.tokenProgram ?? TOKEN_PROGRAM_ID;
    const [derived] = PublicKey.findProgramAddressSync([BOUNTY_SEED, Buffer.from(id)], PROGRAM_ID);
    const bounty = input.bountyOverride ?? derived;
    const vault =
      input.vaultOverride ??
      getAssociatedTokenAddressSync(selectedMint, derived, true, tokenProgram);
    const signature = await program.methods
      .initializeBounty(
        id,
        input.hash ?? terms(`fixture-${sequence}`),
        input.judge ?? payer.publicKey,
        new BN(input.prize ?? PRIZE),
        new BN(input.fee ?? FEE),
        new BN(input.submissionDeadline),
        new BN(input.judgingDeadline),
      )
      .accountsStrict({
        platformConfig,
        bounty,
        vault,
        mint: selectedMint,
        sponsor: sponsor.publicKey,
        tokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers(sponsor.publicKey.equals(payer.publicKey) ? [] : [sponsor])
      .rpc();
    return { signature, id, bounty, vault };
  };
  const initialize = async (
    sponsor = payer,
    submissionOffset = 30,
    judgingOffset = 60,
  ): Promise<Fixture> => {
    const now = await chainTime(connection);
    const initialized = await rawInitialize({
      sponsor,
      submissionDeadline: now + submissionOffset,
      judgingDeadline: now + judgingOffset,
    });
    return {
      bountyId: initialized.id,
      bounty: initialized.bounty,
      vault: initialized.vault,
      sponsor,
      submissionDeadline: now + submissionOffset,
      judgingDeadline: now + judgingOffset,
    };
  };
  const fund = (fixture: Fixture, sponsorAta: PublicKey) =>
    program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty: fixture.bounty,
        vault: fixture.vault,
        sponsorTokenAccount: sponsorAta,
        mint,
        sponsor: fixture.sponsor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers(fixture.sponsor.publicKey.equals(payer.publicKey) ? [] : [fixture.sponsor])
      .rpc();
  const activate = (fixture: Fixture) =>
    program.methods
      .activateBounty()
      .accountsStrict({
        platformConfig,
        bounty: fixture.bounty,
        vault: fixture.vault,
        mint,
        sponsor: fixture.sponsor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers(fixture.sponsor.publicKey.equals(payer.publicKey) ? [] : [fixture.sponsor])
      .rpc();
  const cancel = (fixture: Fixture, sponsorAta: PublicKey) =>
    program.methods
      .cancelBeforeActivation()
      .accountsStrict({
        bounty: fixture.bounty,
        vault: fixture.vault,
        sponsorTokenAccount: sponsorAta,
        mint,
        sponsor: fixture.sponsor.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers(fixture.sponsor.publicKey.equals(payer.publicKey) ? [] : [fixture.sponsor])
      .rpc();
  const pause = (paused: boolean) =>
    program.methods
      .setPaused(paused)
      .accountsStrict({ platformConfig, pauseAuthority: payer.publicKey })
      .rpc();

  const validationNow = await chainTime(connection);
  const validDeadline = {
    submissionDeadline: validationNow + 30,
    judgingDeadline: validationNow + 60,
  };
  await expectFailure('zero bounty ID is rejected', () =>
    rawInitialize({ ...validDeadline, id: new Array<number>(32).fill(0) }),
  );
  await expectFailure('zero terms hash is rejected', () =>
    rawInitialize({ ...validDeadline, hash: new Array<number>(32).fill(0) }),
  );
  await expectFailure('zero judge is rejected', () =>
    rawInitialize({ ...validDeadline, judge: PublicKey.default }),
  );
  await expectFailure('zero prize is rejected', () =>
    rawInitialize({ ...validDeadline, prize: 0, fee: 0 }),
  );
  await expectFailure('past deadline is rejected', () =>
    rawInitialize({
      submissionDeadline: validationNow - 1,
      judgingDeadline: validationNow + 30,
    }),
  );
  await expectFailure('deadline ordering is enforced', () =>
    rawInitialize({
      submissionDeadline: validationNow + 30,
      judgingDeadline: validationNow + 30,
    }),
  );
  await expectFailure('fee ceiling is enforced', () =>
    rawInitialize({ ...validDeadline, fee: FEE + 1 }),
  );
  await expectFailure('platform bounty maximum is enforced', () =>
    rawInitialize({ ...validDeadline, prize: 100_000_000, fee: 1 }),
  );
  await expectFailure('unapproved mint is rejected', () =>
    rawInitialize({ ...validDeadline, selectedMint: wrongMint }),
  );
  await expectFailure('wrong bounty PDA is rejected', () =>
    rawInitialize({ ...validDeadline, bountyOverride: Keypair.generate().publicKey }),
  );
  await expectFailure('wrong vault is rejected', () =>
    rawInitialize({ ...validDeadline, vaultOverride: payerAta.address }),
  );
  await expectFailure('Token-2022 is rejected by the legacy SPL policy', () =>
    rawInitialize({ ...validDeadline, tokenProgram: TOKEN_2022_PROGRAM_ID }),
  );

  const duplicate = await initialize();
  await expectFailure('duplicate bounty ID is rejected', () =>
    rawInitialize({
      ...validDeadline,
      id: duplicate.bountyId,
      bountyOverride: duplicate.bounty,
      vaultOverride: duplicate.vault,
    }),
  );

  const unfunded = await initialize();
  await expectFailure('unfunded bounty cannot activate', () => activate(unfunded));
  await expectFailure('fake sponsor cannot fund', () =>
    program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty: unfunded.bounty,
        vault: unfunded.vault,
        sponsorTokenAccount: payerAta.address,
        mint,
        sponsor: attacker.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([attacker])
      .rpc(),
  );
  await expectFailure('wrong sponsor token account is rejected', () =>
    program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty: unfunded.bounty,
        vault: unfunded.vault,
        sponsorTokenAccount: attackerAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc(),
  );
  await expectFailure('wrong funding vault is rejected', () =>
    program.methods
      .fundBounty()
      .accountsStrict({
        platformConfig,
        bounty: unfunded.bounty,
        vault: payerAta.address,
        sponsorTokenAccount: payerAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc(),
  );
  if (
    stateName((await program.account.bountyEscrow.fetch(unfunded.bounty)).state) !== 'initialized'
  ) {
    throw new Error('Unfunded bounty state changed unexpectedly');
  }
  const fundSignature = await fund(unfunded, payerAta.address);
  const transaction = await connection.getTransaction(fundSignature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  const events =
    transaction?.meta?.logMessages
      .filter((log) => log.startsWith('Program data: '))
      .map((log) => program.coder.events.decode(log.slice('Program data: '.length)))
      .filter((event) => event !== null) ?? [];
  if (!events.some((event) => event?.name.toLowerCase() === 'bountyfunded')) {
    throw new Error('BountyFunded event could not be decoded');
  }
  await expectFailure('double funding is rejected', () => fund(unfunded, payerAta.address));

  const partiallyDonated = await initialize(payer, 60, 120);
  await transfer(connection, payer, payerAta.address, partiallyDonated.vault, payer, 123);
  const partialBefore = (await getAccount(connection, payerAta.address)).amount;
  await fund(partiallyDonated, payerAta.address);
  const partialAfter = (await getAccount(connection, payerAta.address)).amount;
  if (partialBefore - partialAfter !== BigInt(REQUIRED - 123)) {
    throw new Error('Sponsor did not fund only the missing partial amount');
  }

  const exactlyDonated = await initialize(payer, 60, 120);
  await transfer(connection, payer, payerAta.address, exactlyDonated.vault, payer, REQUIRED);
  const exactBefore = (await getAccount(connection, payerAta.address)).amount;
  await fund(exactlyDonated, payerAta.address);
  const exactAfter = (await getAccount(connection, payerAta.address)).amount;
  if (exactBefore !== exactAfter) throw new Error('Exactly funded vault charged the sponsor again');
  await expectFailure('fake sponsor cannot cancel a funded bounty', () =>
    program.methods
      .cancelBeforeActivation()
      .accountsStrict({
        bounty: exactlyDonated.bounty,
        vault: exactlyDonated.vault,
        sponsorTokenAccount: attackerAta.address,
        mint,
        sponsor: attacker.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([attacker])
      .rpc(),
  );
  await cancel(duplicate, payerAta.address);
  await cancel(partiallyDonated, payerAta.address);
  await cancel(exactlyDonated, payerAta.address);

  const activationExpired = await initialize(payer, 2, 30);
  await fund(activationExpired, payerAta.address);
  await waitForChainTime(connection, activationExpired.submissionDeadline);
  await expectFailure('activation at or after submission deadline is rejected', () =>
    activate(activationExpired),
  );
  await cancel(activationExpired, payerAta.address);

  // A third party can pre-create and overfund the canonical vault before bounty initialization.
  const overfundedId = bountyId(sequence++);
  const [overfundedPda] = PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, Buffer.from(overfundedId)],
    PROGRAM_ID,
  );
  const overfundedVault = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    overfundedPda,
    true,
  );
  const donor = Keypair.generate();
  const donorAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    donor.publicKey,
  );
  await mintTo(connection, payer, mint, donorAta.address, payer, REQUIRED + EXCESS);
  await transfer(
    connection,
    payer,
    donorAta.address,
    overfundedVault.address,
    donor,
    REQUIRED + EXCESS,
  );
  const overfundedNow = await chainTime(connection);
  await rawInitialize({
    id: overfundedId,
    submissionDeadline: overfundedNow + 20,
    judgingDeadline: overfundedNow + 60,
  });
  const overfunded: Fixture = {
    bountyId: overfundedId,
    bounty: overfundedPda,
    vault: overfundedVault.address,
    sponsor: payer,
    submissionDeadline: overfundedNow + 20,
    judgingDeadline: overfundedNow + 60,
  };
  await fund(overfunded, payerAta.address);
  if ((await getAccount(connection, overfunded.vault)).amount !== BigInt(REQUIRED + EXCESS)) {
    throw new Error('Funding altered unsolicited excess');
  }
  await expectFailure('fake sponsor cannot activate', () =>
    program.methods
      .activateBounty()
      .accountsStrict({
        platformConfig,
        bounty: overfunded.bounty,
        vault: overfunded.vault,
        mint,
        sponsor: attacker.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([attacker])
      .rpc(),
  );
  await expectFailure('wrong activation vault is rejected', () =>
    program.methods
      .activateBounty()
      .accountsStrict({
        platformConfig,
        bounty: overfunded.bounty,
        vault: payerAta.address,
        mint,
        sponsor: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc(),
  );
  await activate(overfunded);
  await expectFailure('double activation is rejected', () => activate(overfunded));
  await expectFailure('winner cannot be finalized before submission deadline', () =>
    program.methods
      .finalizeWinner(winner.publicKey)
      .accountsStrict({ platformConfig, bounty: overfunded.bounty, judge: payer.publicKey })
      .rpc(),
  );
  await expectFailure('resolution cannot be requested before judging deadline', () =>
    program.methods
      .requestResolution()
      .accountsStrict({ bounty: overfunded.bounty, requester: relay.publicKey })
      .signers([relay])
      .rpc(),
  );
  await expectFailure('active sponsor cancellation is rejected', () =>
    cancel(overfunded, payerAta.address),
  );

  // The committed sponsor ATA is deliberately closed after funding.
  const detachedAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    detachedSponsor.publicKey,
  );
  await mintTo(connection, payer, mint, detachedAta.address, payer, REQUIRED);
  const detached = await initialize(detachedSponsor, 7, 60);
  await fund(detached, detachedAta.address);
  await closeAccount(
    connection,
    payer,
    detachedAta.address,
    detachedSponsor.publicKey,
    detachedSponsor,
  );
  await activate(detached);

  const refundAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    refundSponsor.publicKey,
  );
  await mintTo(connection, payer, mint, refundAta.address, payer, REQUIRED);
  const resolutionRefund = await initialize(refundSponsor, 10, 12);
  await fund(resolutionRefund, refundAta.address);
  await closeAccount(connection, payer, refundAta.address, refundSponsor.publicKey, refundSponsor);
  await activate(resolutionRefund);

  const resolutionPay = await initialize(payer, 10, 12);
  await fund(resolutionPay, payerAta.address);
  await activate(resolutionPay);
  const pauseFund = await initialize();
  const pauseActivate = await initialize();
  await fund(pauseActivate, payerAta.address);

  await waitForChainTime(
    connection,
    Math.max(
      overfunded.submissionDeadline,
      detached.submissionDeadline,
      resolutionRefund.judgingDeadline + 1,
      resolutionPay.judgingDeadline + 1,
    ),
  );
  await pause(true);
  const pausedNow = await chainTime(connection);
  await expectFailure('pause blocks initialization', () =>
    rawInitialize({
      submissionDeadline: pausedNow + 30,
      judgingDeadline: pausedNow + 60,
    }),
  );
  await expectFailure('pause blocks funding', () => fund(pauseFund, payerAta.address));
  await expectFailure('pause blocks activation', () => activate(pauseActivate));
  await expectFailure('pause blocks normal finalization', () =>
    program.methods
      .finalizeWinner(winner.publicKey)
      .accountsStrict({ platformConfig, bounty: detached.bounty, judge: payer.publicKey })
      .rpc(),
  );
  await cancel(pauseFund, payerAta.address);
  await cancel(pauseActivate, payerAta.address);
  await expectFailure('double refund is rejected', () => cancel(pauseActivate, payerAta.address));

  const requestResolution = (fixture: Fixture) =>
    program.methods
      .requestResolution()
      .accountsStrict({ bounty: fixture.bounty, requester: relay.publicKey })
      .signers([relay])
      .rpc();
  await requestResolution(resolutionRefund);
  await expectFailure('fake arbitrator cannot resolve refund', () =>
    program.methods
      .resolveRefund()
      .accountsStrict({
        platformConfig,
        bounty: resolutionRefund.bounty,
        vault: resolutionRefund.vault,
        sponsorTokenAccount: refundAta.address,
        sponsor: refundSponsor.publicKey,
        mint,
        arbitrationAuthority: attacker.publicKey,
        settler: relay.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([attacker, relay])
      .rpc(),
  );
  await program.methods
    .resolveRefund()
    .accountsStrict({
      platformConfig,
      bounty: resolutionRefund.bounty,
      vault: resolutionRefund.vault,
      sponsorTokenAccount: refundAta.address,
      sponsor: refundSponsor.publicKey,
      mint,
      arbitrationAuthority: payer.publicKey,
      settler: relay.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([relay])
    .rpc();
  if ((await getAccount(connection, refundAta.address)).amount !== BigInt(REQUIRED)) {
    throw new Error('Resolution refund amount mismatch');
  }

  await requestResolution(resolutionPay);
  await expectFailure('resolution request cannot replay', () => requestResolution(resolutionPay));
  await expectFailure('fake arbitrator cannot select a resolution winner', () =>
    program.methods
      .resolveWinner(attacker.publicKey)
      .accountsStrict({
        platformConfig,
        bounty: resolutionPay.bounty,
        arbitrationAuthority: attacker.publicKey,
      })
      .signers([attacker])
      .rpc(),
  );
  await program.methods
    .resolveWinner(resolutionWinner.publicKey)
    .accountsStrict({
      platformConfig,
      bounty: resolutionPay.bounty,
      arbitrationAuthority: payer.publicKey,
    })
    .rpc();
  await expectFailure('resolution winner selection cannot replay', () =>
    program.methods
      .resolveWinner(attacker.publicKey)
      .accountsStrict({
        platformConfig,
        bounty: resolutionPay.bounty,
        arbitrationAuthority: payer.publicKey,
      })
      .rpc(),
  );

  const treasuryAta = getAssociatedTokenAddressSync(mint, payer.publicKey);
  const settle = (
    fixture: Fixture,
    selectedWinner: PublicKey,
    winnerAta: PublicKey,
    sponsorAta: PublicKey,
    treasury = payer.publicKey,
    treasuryTokenAccount = treasuryAta,
  ) =>
    program.methods
      .settleBounty()
      .accountsStrict({
        platformConfig,
        bounty: fixture.bounty,
        vault: fixture.vault,
        winnerTokenAccount: winnerAta,
        treasuryTokenAccount,
        sponsorTokenAccount: sponsorAta,
        winner: selectedWinner,
        treasury,
        sponsor: fixture.sponsor.publicKey,
        mint,
        settler: relay.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([relay])
      .rpc();
  const resolutionWinnerAta = getAssociatedTokenAddressSync(mint, resolutionWinner.publicKey);
  await expectFailure('wrong committed winner is rejected at settlement', () =>
    settle(resolutionPay, attacker.publicKey, attackerAta.address, payerAta.address),
  );
  await settle(resolutionPay, resolutionWinner.publicKey, resolutionWinnerAta, payerAta.address);
  if ((await getAccount(connection, resolutionWinnerAta)).amount !== BigInt(PRIZE)) {
    throw new Error('Resolution payout mismatch');
  }

  await pause(false);
  await expectFailure('zero winner is rejected', () =>
    program.methods
      .finalizeWinner(PublicKey.default)
      .accountsStrict({ platformConfig, bounty: overfunded.bounty, judge: payer.publicKey })
      .rpc(),
  );
  await expectFailure('unauthorized judge cannot finalize', () =>
    program.methods
      .finalizeWinner(winner.publicKey)
      .accountsStrict({ platformConfig, bounty: detached.bounty, judge: attacker.publicKey })
      .signers([attacker])
      .rpc(),
  );
  await program.methods
    .finalizeWinner(winner.publicKey)
    .accountsStrict({ platformConfig, bounty: detached.bounty, judge: payer.publicKey })
    .rpc();
  await expectFailure('winner finalization cannot replay', () =>
    program.methods
      .finalizeWinner(attacker.publicKey)
      .accountsStrict({ platformConfig, bounty: detached.bounty, judge: payer.publicKey })
      .rpc(),
  );
  const winnerAta = getAssociatedTokenAddressSync(mint, winner.publicKey);
  const detachedSponsorAta = getAssociatedTokenAddressSync(mint, detachedSponsor.publicKey);
  await expectFailure('sponsor cannot cancel after winner selection', () =>
    cancel(detached, detachedSponsorAta),
  );

  await expectFailure('wrong winner ATA is rejected', () =>
    settle(detached, winner.publicKey, detachedSponsorAta, detachedSponsorAta),
  );
  const wrongTreasuryAta = getAssociatedTokenAddressSync(mint, attacker.publicKey);
  await expectFailure('wrong treasury is rejected', () =>
    settle(
      detached,
      winner.publicKey,
      winnerAta,
      detachedSponsorAta,
      attacker.publicKey,
      wrongTreasuryAta,
    ),
  );
  await expectFailure('wrong treasury token account is rejected', () =>
    settle(
      detached,
      winner.publicKey,
      winnerAta,
      detachedSponsorAta,
      payer.publicKey,
      attackerAta.address,
    ),
  );
  const treasuryBefore = (await getAccount(connection, treasuryAta)).amount;
  await pause(true);
  await settle(detached, winner.publicKey, winnerAta, detachedSponsorAta);
  const treasuryAfter = (await getAccount(connection, treasuryAta)).amount;
  if ((await getAccount(connection, winnerAta)).amount !== BigInt(PRIZE)) {
    throw new Error('Winner payout mismatch');
  }
  if (treasuryAfter - treasuryBefore !== BigInt(FEE)) throw new Error('Treasury fee mismatch');
  if ((await getAccount(connection, detachedSponsorAta)).amount !== 0n) {
    throw new Error('Unexpected sponsor excess');
  }
  if (await connection.getAccountInfo(detached.vault)) throw new Error('Vault was not closed');
  if (stateName((await program.account.bountyEscrow.fetch(detached.bounty)).state) !== 'settled') {
    throw new Error('Bounty was not settled');
  }
  await expectFailure('double settlement is rejected', () =>
    settle(detached, winner.publicKey, winnerAta, detachedSponsorAta),
  );

  await pause(false);
  await program.methods
    .finalizeWinner(winner.publicKey)
    .accountsStrict({ platformConfig, bounty: overfunded.bounty, judge: payer.publicKey })
    .rpc();
  const payerBefore = (await getAccount(connection, payerAta.address)).amount;
  await settle(overfunded, winner.publicKey, winnerAta, payerAta.address);
  const payerAfter = (await getAccount(connection, payerAta.address)).amount;
  if (payerAfter - payerBefore !== BigInt(FEE + EXCESS)) {
    throw new Error('Terminal excess return mismatch');
  }

  const ideaId = bountyId(10_001);
  const buildId = bountyId(10_002);
  const [ideaPda] = PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, Buffer.from(ideaId)],
    PROGRAM_ID,
  );
  const [buildPda] = PublicKey.findProgramAddressSync(
    [BOUNTY_SEED, Buffer.from(buildId)],
    PROGRAM_ID,
  );
  if (Buffer.from(ideaId).equals(Buffer.from(buildId)) || ideaPda.equals(buildPda)) {
    throw new Error('Idea and Build bounty identities collided');
  }

  console.log('✓ upgrade-authority initialization and front-run protection');
  console.log('✓ deterministic independent Idea and Build bounty identities');
  console.log('✓ overfund/pre-created vault griefing resistance and terminal excess return');
  console.log('✓ sponsor ATA closure and missing destination ATA liveness');
  console.log('✓ pause-safe cancel, resolution, arbitration, and settlement');
  console.log(
    '✓ exact prize/fee, terminal exclusivity, replay, authority, mint, PDA, vault checks',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
