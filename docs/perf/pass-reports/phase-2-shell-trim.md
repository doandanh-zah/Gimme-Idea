# Pass Report - Phase 2: Fonts, Polyfills, Capacitor Split

Date: 2026-07-20; updated 2026-07-26
Branch / commit: main / 68afd91 + working tree changes
Author: Codex

## Metrics

| Metric | Phase 0 | Phase 2 |
|--------|---------|---------|
| Next build `/landing` First Load JS | 885 kB | 371 kB |
| Next build `/idea` First Load JS | 524 kB | 238 kB |

## Evidence

- Default shell fonts reduced to Inter + JetBrains Mono.
- Global `../polyfills` import removed from `ClientLayout`; wallet polyfills now load from `WalletProvider`.
- Capacitor imports in `AuthContext` moved behind native-platform dynamic import.
- `next-font-manifest` app layout contained two font files after Phase 2.
- `/landing` and `/idea` initial chunks had no `@capacitor/app`, `@capacitor/browser`, `crypto-browserify`, or `stream-browserify` package hits.
- Final browser evidence screenshots captured at 375px, 768px, and 1280px: [summary](../browser-evidence/2026-07-26T09-43-28Z/summary.md).
- The same browser artifact confirms 0 wallet/native/polyfill marker hits in `/idea` initial JS.

## Checklist

- [x] Default layout loads two font families.
- [x] Polyfills moved out of root shell.
- [x] Capacitor packages moved out of web initial route graph.
- [x] `/idea` improved by more than 25% vs Phase 0.
- [x] Visual screenshots captured for typography and responsive shell review.

## Residual Risks

- Subjective product/design approval remains outside automated checks, but local browser screenshots now exist for the production build viewport matrix.
