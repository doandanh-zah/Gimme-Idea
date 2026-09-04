'use client';

import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { useCallback, useMemo, useState } from 'react';
import {
  BPF_LOADER_UPGRADEABLE_PROGRAM_ID,
  buildCloseStaleBufferInstruction,
  buildUpgradeInstruction,
  EXPECTED_CI_EXECUTABLE_HASH,
  PROGRAM_ID,
  REQUIRED_AUTHORITY,
  STALE_BUFFER,
} from '@/lib/devnet-program-upgrade';
import { SOLANA_RPC_URL } from '@/lib/devnet-wallet';

type WalletKind = 'phantom' | 'solflare';
type WalletResult = string | { signature: string };
type InjectedWallet = {
  publicKey?: PublicKey;
  connect: () => Promise<{ publicKey?: PublicKey } | void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<WalletResult>;
};

declare global {
  interface Window {
    phantom?: { solana?: InjectedWallet };
    solflare?: InjectedWallet;
    solana?: InjectedWallet;
  }
}

function findWallet(kind: WalletKind) {
  if (kind === 'phantom') return window.phantom?.solana ?? window.solana;
  return window.solflare;
}

function shortAddress(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

export function DevnetProgramAdmin() {
  const connection = useMemo(() => new Connection(SOLANA_RPC_URL, 'confirmed'), []);
  const [wallet, setWallet] = useState<InjectedWallet>();
  const [walletAddress, setWalletAddress] = useState('');
  const [targetBuffer, setTargetBuffer] = useState('');
  const [staleBufferExists, setStaleBufferExists] = useState<boolean>();
  const [status, setStatus] = useState('Connect the Devnet upgrade-authority wallet to continue.');
  const [busy, setBusy] = useState(false);

  const authorized = walletAddress === REQUIRED_AUTHORITY.toBase58();

  const refresh = useCallback(async () => {
    const stale = await connection.getAccountInfo(STALE_BUFFER, 'confirmed');
    setStaleBufferExists(Boolean(stale));
  }, [connection]);

  async function connect(kind: WalletKind) {
    setBusy(true);
    setStatus(`Connecting ${kind === 'phantom' ? 'Phantom' : 'Solflare'}…`);
    try {
      const provider = findWallet(kind);
      if (!provider)
        throw new Error(`${kind === 'phantom' ? 'Phantom' : 'Solflare'} extension was not found.`);
      const result = await provider.connect();
      const address = result?.publicKey ?? provider.publicKey;
      if (!address) throw new Error('The wallet did not return a public key.');
      const addressText = address.toBase58();
      setWallet(provider);
      setWalletAddress(addressText);
      await refresh();
      setStatus(
        addressText === REQUIRED_AUTHORITY.toBase58()
          ? 'Authority verified. No transaction has been sent.'
          : `Wrong wallet: expected ${shortAddress(REQUIRED_AUTHORITY.toBase58())}.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not connect the wallet.');
    } finally {
      setBusy(false);
    }
  }

  async function send(instruction: ReturnType<typeof buildUpgradeInstruction>, label: string) {
    if (!wallet || !authorized)
      throw new Error('Connect the exact upgrade-authority wallet first.');
    setBusy(true);
    setStatus(`${label}: waiting for wallet confirmation…`);
    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: REQUIRED_AUTHORITY,
      }).add(instruction);
      const result = await wallet.signAndSendTransaction(transaction);
      const signature = typeof result === 'string' ? result : result.signature;
      setStatus(`${label}: confirming ${shortAddress(signature)}…`);
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        'confirmed',
      );
      await refresh();
      setStatus(`${label} confirmed: ${signature}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${label} failed.`);
    } finally {
      setBusy(false);
    }
  }

  async function closeStaleBuffer() {
    await send(buildCloseStaleBufferInstruction(), 'Recover stale buffer rent');
  }

  async function upgradeProgram() {
    let buffer: PublicKey;
    try {
      buffer = new PublicKey(targetBuffer.trim());
    } catch {
      setStatus('Enter a valid prepared buffer address.');
      return;
    }

    const account = await connection.getAccountInfo(buffer, 'confirmed');
    if (!account || !account.owner.equals(BPF_LOADER_UPGRADEABLE_PROGRAM_ID)) {
      setStatus('The target is not a Devnet upgradeable-loader buffer.');
      return;
    }

    await send(buildUpgradeInstruction(buffer), 'Upgrade program');
  }

  return (
    <main className="devnet-admin">
      <section className="devnet-admin__panel" aria-labelledby="devnet-admin-title">
        <p className="devnet-admin__eyebrow">Local utility · Solana Devnet</p>
        <h1 id="devnet-admin-title">Program upgrade signer</h1>
        <p className="devnet-admin__intro">
          This page never asks for a seed phrase. Your wallet extension signs only the transaction
          shown in its confirmation window.
        </p>

        <dl className="devnet-admin__facts">
          <div>
            <dt>Program</dt>
            <dd>{PROGRAM_ID.toBase58()}</dd>
          </div>
          <div>
            <dt>Required authority</dt>
            <dd>{REQUIRED_AUTHORITY.toBase58()}</dd>
          </div>
          <div>
            <dt>Expected CI hash</dt>
            <dd>{EXPECTED_CI_EXECUTABLE_HASH}</dd>
          </div>
          <div>
            <dt>Stale buffer</dt>
            <dd>
              {staleBufferExists === undefined
                ? 'Checking…'
                : staleBufferExists
                  ? 'Open'
                  : 'Closed'}
            </dd>
          </div>
        </dl>

        <div className="devnet-admin__actions" aria-label="Connect an upgrade-authority wallet">
          <button type="button" onClick={() => void connect('phantom')} disabled={busy}>
            Connect Phantom
          </button>
          <button type="button" onClick={() => void connect('solflare')} disabled={busy}>
            Connect Solflare
          </button>
        </div>

        <p
          className={authorized ? 'devnet-admin__status is-success' : 'devnet-admin__status'}
          role="status"
        >
          {walletAddress ? `Connected: ${walletAddress}. ` : ''}
          {status}
        </p>

        <div className="devnet-admin__step">
          <span>01</span>
          <div>
            <h2>Recover the incompatible buffer</h2>
            <p>
              Returns its 2.716888665 Devnet SOL rent to the CLI deployer so the CI binary can be
              uploaded.
            </p>
            <button
              type="button"
              className="is-danger"
              onClick={() => void closeStaleBuffer()}
              disabled={busy || !authorized || staleBufferExists !== true}
            >
              Close stale buffer
            </button>
          </div>
        </div>

        <div className="devnet-admin__step">
          <span>02</span>
          <div>
            <h2>Approve the verified upgrade</h2>
            <p>
              Only use the buffer address supplied after its executable hash has been checked
              against CI.
            </p>
            <label htmlFor="verified-buffer">Prepared buffer address</label>
            <input
              id="verified-buffer"
              value={targetBuffer}
              onChange={(event) => setTargetBuffer(event.target.value)}
              placeholder="Paste verified Devnet buffer"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => void upgradeProgram()}
              disabled={busy || !authorized || !targetBuffer.trim()}
            >
              Review upgrade in wallet
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
