#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, PublicKey, Keypair, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { IDL as FUTARCHY_IDL } from "../node_modules/@metadaoproject/futarchy/dist/v0.7/types/futarchy.js";

const DEFAULT_FUTARCHY_PROGRAM_ID = "metaRK9dUBnrAdZN6uUDKvxBVKW5pyCbPVmLtUZwtBp";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if ((arg === "--dao" || arg === "--pool") && next && !next.startsWith("--")) {
      if (arg === "--dao") out.dao = next;
      if (arg === "--pool") out.pool = next;
      i += 1;
      continue;
    }
    if (arg === "--rpc" && next && !next.startsWith("--")) {
      out.rpc = next;
      i += 1;
      continue;
    }
    if (arg === "--keypair" && next && !next.startsWith("--")) {
      out.keypair = next;
      i += 1;
      continue;
    }
    if (arg === "--program-id" && next && !next.startsWith("--")) {
      out.programId = next;
      i += 1;
      continue;
    }
    if (arg === "--execute") out.execute = true;
    if (arg === "--scan") out.scan = true;
    if (arg === "--help" || arg === "-h") out.help = true;
  }
  return out;
}

function printHelp() {
  console.log(`
Recover liquidity from MetaDAO AMM position (one-time script).

Usage:
  node frontend/scripts/recover-liquidity.mjs --dao <DAO_PUBKEY> [--rpc <RPC_URL>] [--keypair <KEYPAIR_JSON>] [--program-id <FUTARCHY_PROGRAM_ID>] [--scan] [--execute]

Notes:
  - Default mode is dry-run (no tx). Add --execute to send tx.
  - --pool is accepted as alias for --dao.
  - The signer keypair must be the amm_position authority that provided liquidity.
`);
}

function expandHome(p) {
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function loadKeypairFromFile(filePath) {
  const absolutePath = expandHome(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  const secret = JSON.parse(raw);
  if (!Array.isArray(secret)) {
    throw new Error(`Invalid keypair file format: ${absolutePath}`);
  }
  return Keypair.fromSecretKey(Uint8Array.from(secret));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log("[recover-liquidity] boot");
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const daoAddress = args.dao || args.pool;
  if (!daoAddress) {
    throw new Error("Missing required --dao <DAO_PUBKEY> (or --pool).");
  }

  const rpc =
    args.rpc ||
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    process.env.SOLANA_RPC_URL ||
    clusterApiUrl("mainnet-beta");

  const keypairPath =
    args.keypair ||
    process.env.RECOVER_KEYPAIR_PATH ||
    path.join(os.homedir(), ".config", "solana", "id.json");
  const programId = new PublicKey(args.programId || process.env.FUTARCHY_PROGRAM_ID || DEFAULT_FUTARCHY_PROGRAM_ID);
  const signer = loadKeypairFromFile(keypairPath);
  console.log("[recover-liquidity] signer loaded:", signer.publicKey.toBase58());
  console.log("[recover-liquidity] futarchy program:", programId.toBase58());

  const connection = new Connection(rpc, "confirmed");
  const wallet = {
    publicKey: signer.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(signer);
      return tx;
    },
    signAllTransactions: async (txs) =>
      txs.map((tx) => {
        tx.partialSign(signer);
        return tx;
      }),
  };
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  const program = new Program(FUTARCHY_IDL, programId, provider);

  const daoPubkey = new PublicKey(daoAddress);
  console.log("[recover-liquidity] fetching dao:", daoPubkey.toBase58());
  const dao = await program.account.dao.fetch(daoPubkey);
  console.log("[recover-liquidity] dao loaded");

  const [eventAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("__event_authority")],
    program.programId
  );

  const signerAuthority = signer.publicKey;
  const [signerAmmPosition] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_position"), daoPubkey.toBuffer(), signerAuthority.toBuffer()],
    program.programId
  );
  const signerPosition = await program.account.ammPosition.fetchNullable(signerAmmPosition);

  console.log("=== Recover Liquidity Check ===");
  console.log("DAO:", daoPubkey.toBase58());
  console.log("Signer:", signerAuthority.toBase58());
  console.log("RPC:", rpc);
  console.log("Signer amm_position:", signerAmmPosition.toBase58());
  console.log("Signer position exists:", !!signerPosition);
  console.log("Signer liquidity:", signerPosition?.liquidity?.toString?.() || "0");

  if (args.scan || !signerPosition) {
    const allPositions = await program.account.ammPosition.all();
    const daoPositions = allPositions.filter((x) => x.account.dao.equals(daoPubkey));
    console.log(`\nDAO amm_position count: ${daoPositions.length}`);
    for (const item of daoPositions) {
      console.log(
        JSON.stringify({
          ammPosition: item.publicKey.toBase58(),
          positionAuthority: item.account.positionAuthority.toBase58(),
          liquidity: item.account.liquidity.toString(),
        })
      );
    }
  }

  if (!args.execute) {
    console.log("\nDry-run complete. Re-run with --execute to send withdrawLiquidity tx.");
    return;
  }

  if (!signerPosition) {
    throw new Error(
      "No amm_position found for signer on this DAO. Cannot execute withdrawLiquidity."
    );
  }
  if (!signerPosition.liquidity || signerPosition.liquidity.lte(new BN(0))) {
    throw new Error("Signer amm_position has zero liquidity. Nothing to withdraw.");
  }

  const baseAta = getAssociatedTokenAddressSync(dao.baseMint, signerAuthority, true);
  const quoteAta = getAssociatedTokenAddressSync(dao.quoteMint, signerAuthority, true);
  const createAtaIxs = [];
  const baseAtaInfo = await connection.getAccountInfo(baseAta, "confirmed");
  if (!baseAtaInfo) {
    createAtaIxs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        signerAuthority,
        baseAta,
        signerAuthority,
        dao.baseMint
      )
    );
  }
  const quoteAtaInfo = await connection.getAccountInfo(quoteAta, "confirmed");
  if (!quoteAtaInfo) {
    createAtaIxs.push(
      createAssociatedTokenAccountIdempotentInstruction(
        signerAuthority,
        quoteAta,
        signerAuthority,
        dao.quoteMint
      )
    );
  }

  const beforeBase = await connection
    .getTokenAccountBalance(baseAta, "confirmed")
    .then((r) => BigInt(r.value.amount))
    .catch(() => 0n);
  const beforeQuote = await connection
    .getTokenAccountBalance(quoteAta, "confirmed")
    .then((r) => BigInt(r.value.amount))
    .catch(() => 0n);

  console.log("\nSending withdrawLiquidity...");
  const sig = await program.methods
    .withdrawLiquidity({
      liquidityToWithdraw: signerPosition.liquidity,
      minBaseAmount: new BN(0),
      minQuoteAmount: new BN(0),
    })
    .accounts({
      dao: daoPubkey,
      positionAuthority: signerAuthority,
      liquidityProviderBaseAccount: baseAta,
      liquidityProviderQuoteAccount: quoteAta,
      ammBaseVault: getAssociatedTokenAddressSync(dao.baseMint, daoPubkey, true),
      ammQuoteVault: getAssociatedTokenAddressSync(dao.quoteMint, daoPubkey, true),
      ammPosition: signerAmmPosition,
      tokenProgram: TOKEN_PROGRAM_ID,
      eventAuthority,
      program: program.programId,
    })
    .preInstructions(createAtaIxs)
    .rpc();

  const afterBase = await connection
    .getTokenAccountBalance(baseAta, "confirmed")
    .then((r) => BigInt(r.value.amount))
    .catch(() => 0n);
  const afterQuote = await connection
    .getTokenAccountBalance(quoteAta, "confirmed")
    .then((r) => BigInt(r.value.amount))
    .catch(() => 0n);

  console.log("\nWithdraw tx:", sig);
  console.log("Solscan:", `https://solscan.io/tx/${sig}`);
  console.log("Base delta:", (afterBase - beforeBase).toString());
  console.log("Quote delta:", (afterQuote - beforeQuote).toString());
}

main().catch((err) => {
  console.error("\n[recover-liquidity] ERROR");
  console.error(err?.message || err);
  process.exit(1);
});
