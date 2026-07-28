# Entry Import Inventory - Phase 0

## Wallet / Lazorkit / Web3

| File | Static imports |
|------|----------------|
| `frontend/app/ClientLayout.tsx` | `WalletProvider`, `LazorkitProvider` |
| `frontend/components/WalletProvider.tsx` | `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-wallets`, `@solana/wallet-adapter-base`, `@solana/web3.js`, wallet CSS |
| `frontend/contexts/AuthContext.tsx` | `useWallet`, `WalletReadyState` |
| `frontend/contexts/LazorkitContext.tsx` | `@lazorkit/wallet`, `@solana/web3.js` |
| `frontend/components/ConnectWalletPopup.tsx` | `useWallet` |
| `frontend/components/IdeaDetail.tsx` | `useWallet`, `useConnection`, `@solana/web3.js` |
| `frontend/components/PaymentModal.tsx` | `useWallet`, `useConnection`, `@solana/web3.js` |
| `frontend/components/Donate.tsx` | `useWallet`, `useConnection`, Lazorkit hook, `@solana/web3.js` |
| `frontend/components/AIChatModal.tsx` | `useWallet`, `useConnection`, `@solana/web3.js` |
| `frontend/components/WalletRequiredModal.tsx` | `useWallet` |
| `frontend/components/Profile.tsx` | `useWallet` |
| `frontend/components/FundingPoolBox.tsx` | `useConnection`, `@solana/web3.js`, dynamic `@solana/spl-token` |
| `frontend/components/DaoRequestModal.tsx` | `useWallet`, `useConnection`, `@solana/web3.js` |
| `frontend/components/ideas/CreatePoolButton.tsx` | `useWallet`, `@solana/web3.js`, `@solana/spl-token` |
| `frontend/components/ideas/TradingWidget.tsx` | `useWallet`, `@solana/web3.js` |
| `frontend/components/ProposalSendModal.tsx` | `useWallet`, `@solana/web3.js`, `@solana/spl-token` |
| `frontend/components/SupportDepositModal.tsx` | `useWallet`, `useConnection`, `@solana/web3.js`, `@solana/spl-token` |
| `frontend/components/admin/FinalizeIdeaButton.tsx` | `useWallet`, `@solana/web3.js` |
| `frontend/app/admin/page.tsx` | `useWallet`, `@solana/web3.js`, `@solana/spl-token` |

Type-only Solana imports also exist in `frontend/lib/metadao/client.ts`.

## Capacitor

| File | Static imports |
|------|----------------|
| `frontend/contexts/AuthContext.tsx` | `@capacitor/core`, `@capacitor/app`, `@capacitor/browser` |

## Node Polyfills

| File | Static/global behavior |
|------|------------------------|
| `frontend/app/ClientLayout.tsx` | imports `../polyfills` before other imports |
| `frontend/next.config.js` | injects `./polyfills.js` into `main.app`; global webpack fallbacks for `buffer`, `crypto`, `stream`, `process`, `zlib`, `util`, `assert`; global `ProvidePlugin` for `Buffer` and `process` |

## Framer Motion Entrypoints

Framer Motion is imported across public routes and modals, including `app/landing`, `app/feeds`, `app/hackathons`, `app/admin`, `app/privacy`, `app/terms`, `components/Navbar`, `components/IdeaDetail`, `components/ProjectCard`, and multiple modal components.
