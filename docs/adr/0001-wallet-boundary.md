# ADR 0001: Lazy Wallet Boundary

Date: 2026-07-20

## Status

Accepted

## Context

The Solana wallet stack, wallet modal CSS, Lazorkit provider, and Node polyfills were previously mounted from the root client layout. That forced wallet code onto public content routes such as `/landing` and `/idea`.

## Decision

The root shell must not mount wallet providers. Wallet providers are loaded through `WalletSurfaceHost` after explicit connect intent, or through `WalletRouteBoundary` for routes that need wallet hooks. Direct wallet/web3 imports are guarded by `npm run guard:imports`.

## Consequences

Public route initial bundles stay wallet-free. Wallet-specific screens still pay the wallet cost, but only after navigation or user intent.
