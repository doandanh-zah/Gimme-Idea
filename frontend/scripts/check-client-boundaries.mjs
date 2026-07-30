#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scanRoots = ['app', 'components', 'contexts', 'hooks', 'lib'];

const walletImportPattern =
  /(?:from\s+['"]|import\s*\(\s*['"])(@solana\/wallet-adapter[^'"]*|@solana\/web3\.js|@lazorkit\/wallet)['"]/;
const fullStorePattern = /\buseAppStore\s*\(\s*\)/;

const walletAllowed = [
  /^app\/admin\/AdminDashboardContent\.tsx$/,
  /^components\/wallet\//,
  /^components\/ideas\/CreatePoolButton\.tsx$/,
  /^components\/AIChatModal\.tsx$/,
  /^components\/ConnectWalletPopup\.tsx$/,
  /^components\/Donate\.tsx$/,
  /^components\/IdeaDetail\.tsx$/,
  /^components\/PaymentModal\.tsx$/,
  /^components\/Profile\.tsx$/,
  /^components\/ProposalSendModal\.tsx$/,
  /^components\/WalletProvider\.tsx$/,
  /^components\/WalletRequiredModal\.tsx$/,
  /^contexts\/LazorkitContext\.tsx$/,
  /^hooks\/useSelectAndConnect\.ts$/,
  /^lib\/metadao\//,
  /^lib\/solana\//,
];

function walk(dir) {
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolute));
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

const sourceFiles = scanRoots.flatMap((dir) => walk(path.join(root, dir)));
const walletViolations = [];
const fullStoreMatches = [];

for (const file of sourceFiles) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const source = fs.readFileSync(file, 'utf8');

  if (walletImportPattern.test(source) && !walletAllowed.some((pattern) => pattern.test(rel))) {
    walletViolations.push(rel);
  }

  if (fullStorePattern.test(source)) {
    fullStoreMatches.push(rel);
  }
}

if (walletViolations.length > 0) {
  console.error('Wallet/web3 imports outside the approved lazy wallet boundary:');
  for (const file of walletViolations) console.error(`- ${file}`);
  process.exitCode = 1;
}

if (fullStoreMatches.length > 0) {
  const message = [
    'Full Zustand store subscriptions found. Use selectors such as',
    'useAppStore((state) => state.user) instead of useAppStore().',
  ].join(' ');
  console.error(message);
  for (const file of fullStoreMatches) console.error(`- ${file}`);
  process.exitCode = 1;
}

if (!process.exitCode) {
  console.log('Client boundary guard passed.');
}
