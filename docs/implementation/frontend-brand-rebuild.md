# Frontend brand rebuild — 2026-09-06

## Authority and direction

Read `AI_READ_FIRST.md`, the numbered product/domain/architecture/frontend documents,
`brand-assets/README.md`, the frontend contract, convergence reports and current V1
privacy/two-stage bounty documents. Current code and later V1 contracts take precedence
over stale implementation reports. This is a frontend redesign, not a backend rollout.

Design guidance: nextlevelbuilder/ui-ux-pro-max-skill, revision
`f3ac195224eac1eb0dfe1a3059c2a6add78ffbe3`, with Zahlook product constraints.
Design-system searches for developer knowledge networks and research interfaces informed
information hierarchy, search prominence, geometric layouts and progressive disclosure.
Their generic palette/font/FAQ recommendations do not fit this product and are not adopted.

## Brand contract

- Preserve logo unchanged from `brand-assets/logo-gmi.png`.
- Gold `#F9D65C`: primary CTA, Idea, active selection.
- Purple `#BA91F5`: brand blocks, Problem, restricted context.
- Both user-selected accents use dark text when used as a button/block background.
- Alumni Sans from Adobe kit `qqv3drj`: display, interface and reading text.
- Near-black canvas, subtly violet surfaces, ivory text. Small-radius geometry;
  confident typography and clear separators rather than floating rounded cards.
- Display: 48–80px, card title: 30–36px, reading: 20–22px, controls: 18–20px.
  Vietnamese diacritics require generous line height and normal tracking.

## Page families

- Landing: large typographic statement + isolated Three.js brain; problem-to-build
  narrative, research/provenance explanation, audience entry points, real catalog links.
- Discovery: persistent navigation, search, purposeful category entry points,
  searchable/filterable records and explicit zero-result recovery.
- Canonical detail: distinct Problem/Idea/Project identity, creator content first,
  numbered reading sections, source rail, related objects and contextual actions.
- Bounty: stage, prize intent, actual funding verification, deadline, requirements,
  private submission and terms acceptance; no fabricated funded status.
- Workspace/account: calmer operational layout, form hierarchy, permission gates,
  honest unavailable states. No private content introduced into public UI.

## Motion map

- Landing mount: Anime.js scoped headline/action entrance, 350–450ms.
- Landing scroll: scoped narrative reveal + R3F brain separation/assembly progress.
- Feed filter: small scoped Anime.js entrance on the updated result set, 220ms.
- Menus/dialogs: CSS entrance, 160–220ms; controls: 120–160ms feedback.
- Reduced motion: immediate final state; no WebGL import. Mobile/low-power: SVG fallback.
- Offscreen 3D rendering pauses; no scroll hijacking or motion on financial review text.

## Verification scope

Production build, lint, TypeScript, existing frontend unit tests; browser review at
375/768/1024/1440px, bilingual text, keyboard/mobile navigation, filters, empty states,
permission gates, accessible dialogs and reduced motion. Preserve API and escrow semantics.

## Verification results

- Latest production build (including TypeScript), ESLint and 14 unit tests pass.
- Initial production browser review: no horizontal overflow at 375/768/1024/1440px;
  feed reset, guest sign-in and reduced motion: 6 checks passed.
- Extended checks found and fixed landing number contrast and the shared loading
  boundary that hid server-rendered content when JavaScript was disabled. Landing
  entrance now preserves text contrast throughout its movement.
- Final targeted run: 10 desktop/mobile checks passed, including bilingual landing
  axe audits, keyboard navigation, compact sidebar, no-JavaScript canonical reading
  and reduced motion. This run used a temporary read-only API fixture adapted from
  cached records, because the local database stopped and Colima could not restart.
- Landing remains readable when the API is unavailable; optional record teasers
  are omitted. Collection/detail routes retain their explicit error states.
- Authenticated writes, payments and full backend E2E were not rerun for this styling
  change. Earlier browser coverage is not a claim of current backend availability.
- Screenshots: `artifacts/frontend-brand/landing-desktop.png` and
  `artifacts/frontend-brand/landing-mobile.png`.

The shared locale loading boundary is removed to keep landing and canonical content
readable without JavaScript. Bounty-specific loading and client loading states retain
the shared skeleton.
