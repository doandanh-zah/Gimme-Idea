# Pass Report - Phase 1: Wallet & Provider Isolation

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Metrics

| Metric | Phase 0 | Phase 1 |
|--------|---------|---------|
| Next build `/landing` First Load JS | 885 kB | 374 kB |
| Next build `/idea` First Load JS | 524 kB | 238 kB |

## Evidence

- Root `ClientLayout` no longer mounts wallet or Lazorkit providers.
- Wallet UI is loaded through `components/wallet/WalletSurfaceHost.tsx` after connect intent.
- Wallet-required routes use `components/wallet/WalletRouteBoundary.tsx`.
- Manifest string scan after Phase 1: `/landing` and `/idea` initial chunks had no `wallet-adapter`, `Phantom`, `Solflare`, or `Lazorkit` hits.
- Final browser evidence: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- Cold `/idea` browser JS scan found 0 wallet/native/polyfill marker hits before wallet intent.
- Wallet intent proof: clicking "Sign in with wallet" opened the wallet modal, added 9 requests, and loaded JS chunks containing `wallet-adapter`, `Lazorkit`, and `crypto-browserify` only after the click.

## Checklist

- [x] Wallet provider removed from root layout.
- [x] Connect wallet popup lazy-loaded from wallet surface.
- [x] Google auth path no longer imports wallet hooks from `AuthContext`.
- [x] `/idea` First Load JS improved by more than 15%.
- [x] Browser Network proof for connect-click chunk load captured.
- [ ] Wallet/passkey/on-chain E2E verified with funded test wallet.

## Residual Risks

- Wallet boundary and post-intent chunk loading are browser-verified locally.
- Wallet, passkey, and on-chain/tip E2E still require a funded test wallet/account and wallet extension or native wallet environment.
