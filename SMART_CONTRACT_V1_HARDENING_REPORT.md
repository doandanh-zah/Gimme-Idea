# Gimme Idea — Smart Contract V1 Hardening Report

Audit date: 2026-09-04 (Asia/Ho_Chi_Minh)  
Scope: `programs/bounty-escrow`, `packages/solana`, Anchor tests, Devnet smoke tooling, and deterministic-build CI.  
Deployment target: Solana Devnet only.

## 1. Executive summary

The V1 escrow source is hardened locally around initialization authority, canonical PDA/ATA binding, unsolicited-token griefing, permissionless settlement, pause-safe exits, exact prize/fee accounting, vault closure, and replay-safe terminal states. The expanded local Anchor suite passes against the freshly built program, and the reviewed deterministic executable hash is `4a5901ecfb0e855531fd9ed7c1fc0a6b4708d2ae359a590cc5bdcd2516dfc612`.

Phase 2 is not operationally closed on Devnet. The deployed hash remains `e70ea81a2693facabfe3a51801d26c05ede271b4906dce9c417eb1f34e50b894`, it does not expose the repository `security.txt`, and the available wallet is not the upgrade authority. Therefore no hardened-ABI Devnet smoke result is claimed.

## 2. Actual contract before changes

The starting program already implemented one platform PDA, one independent bounty PDA per 32-byte ID, an approved mint, sponsor funding, activation, winner selection, settlement, pre-activation cancellation, deadline-triggered resolution, arbitration, pause control, checked arithmetic, and terminal `Settled`/`Refunded` states. It was a generic single-winner escrow; it did not know about Problems, Ideas, Builds, submissions, or parent/child bounties.

Before hardening, platform initialization depended on a hard-coded Devnet wallet rather than loader-derived upgrade authority. A canonical vault had to be newly created and an excess balance was rejected, allowing a third party to pre-create or donate into that ATA and block progress. Settlement destinations had to exist and the sponsor implicitly remained part of liveness. Terminal paths did not close the vault. Token-interface use also admitted a wider token-program surface than the documented V1 mint policy.

## 3. Security findings discovered

| Severity      | Finding                                                                       | Final disposition                                                                          |
| ------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Critical      | Deployed Devnet hash differs from reviewed build                              | Open operational blocker; requires the actual upgrade authority                            |
| Critical      | Deployed Devnet binary has no queryable `security.txt`                        | Open operational blocker; fixed in local binary only                                       |
| High          | Vault pre-creation or excess donation could permanently deny funding          | Fixed with `init_if_needed`, `>= required_total`, and deterministic terminal excess return |
| High          | Settlement depended on pre-existing destination accounts/sponsor availability | Fixed with arbitrary settler payer and canonical ATA creation                              |
| High          | Hard-coded initialization wallet was not bound to ProgramData authority       | Fixed with upgradeable-loader ProgramData validation                                       |
| Medium        | Broader token-interface surface did not match one-mint V1 policy              | Fixed by constraining accounts to the legacy SPL Token program                             |
| Medium        | Terminal vault rent and token dust could remain indefinitely                  | Fixed by emptying and closing the vault on settle/refund                                   |
| High          | `bigint-buffer` advisory in the `@solana/spl-token` client path               | Open; advisory reports no patched version                                                  |
| Informational | No external audit or formal verification exists                               | Open; required before real-money launch according to value at risk                         |

Specific required conclusions: sponsor cancellation of an Active bounty is rejected; the stored admin has no drain path; strict states prevent double payout; mint/PDA/vault/treasury/destination constraints reject substitution; and platform initialization requires loader provenance. The unresolved findings are deployment parity and deployed `security.txt`.

## 4. Files changed

- `programs/bounty-escrow/src/lib.rs`
- `tests/anchor/bounty-escrow.ts`
- `packages/solana/src/index.ts`
- `packages/solana/src/index.test.ts`
- `packages/solana/package.json`
- `pnpm-lock.yaml`
- `scripts/devnet-bounty-smoke.ts`
- `.github/workflows/verifiable-program-build.yml`
- `docs/BOUNTY_ESCROW_STATE_MACHINE.md`
- `SMART_CONTRACT_INTERFACE.json`
- `SMART_CONTRACT_V1_SECURITY_REVIEW.html`
- `.superstack/build-context.md`
- generated local artifacts: `target/idl/bounty_escrow.json` and `target/types/bounty_escrow.ts`

Existing Phase 1 frontend changes were preserved and were outside this phase's edit scope.

## 5. Final PDA architecture

- Platform: `PDA([UTF8("platform")], program_id)`.
- Bounty: `PDA([UTF8("bounty"), bounty_id_32], program_id)`.
- Vault: canonical legacy SPL ATA with owner equal to the bounty PDA and mint equal to platform `approved_mint`.
- Platform initialization validates the executable program account, its ProgramData address, and its current upgrade authority. Anchor's slot-zero local-genesis sentinel accepts only the program-ID keypair signature and is unreachable for a normally deployed cluster program.
- Account layouts remain stable: PlatformConfig 180 bytes and BountyEscrow 266 bytes, including Anchor discriminators.

## 6. Bounty ID algorithm

`bounty_id = SHA-256(UTF8("GIMME_IDEA_BOUNTY_V1") || canonical_uuid_16_bytes)`.

The input UUID must use canonical `8-4-4-4-12` form. Hyphens are removed and the 32 hex digits decode to exactly 16 bytes. Mutable slugs, titles, organization names, and Problem identifiers are never escrow identity. The domain and algorithm are implemented by `deriveBountyIdFromUuid` in `packages/solana`.

## 7. Final state machine

`Initialized → Funded → Active → WinnerSelected → Settled` is the normal path. `Active → Resolution → WinnerSelected → Settled` and `Active → Resolution → Refunded` are recovery paths. Sponsor cancellation permits only `Initialized/Funded → Refunded`. `Settled` and `Refunded` are exclusive terminal states. Full actors, time boundaries, and Mermaid diagrams are in `docs/BOUNTY_ESCROW_STATE_MACHINE.md`.

## 8. Authority matrix

| Action                                    | Authorized actor                                                     |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Initialize platform                       | current ProgramData upgrade authority                                |
| Initialize, fund, activate bounty         | sponsor                                                              |
| Finalize winner during judging window     | judge                                                                |
| Settle selected winner                    | any signer/relayer paying optional ATA rent                          |
| Cancel before activation                  | sponsor                                                              |
| Request resolution after judging deadline | any signer                                                           |
| Resolve winner/refund                     | arbitration authority; refund ATA rent may be paid by another signer |
| Pause/unpause                             | pause authority                                                      |
| Arbitrary escrow withdrawal               | nobody; no such instruction exists                                   |

The stored `admin` is initialization provenance only and has no post-initialization power.

## 9. Token/mint policy

V1 supports exactly the legacy SPL Token program `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` and the mint stored in PlatformConfig. Current Devnet config uses `CK2tWF2k3PEAZti7bxZj5jcfCabYGus6TbdFwinNGFyQ`, six decimals, with no freeze authority. Token-2022 is intentionally rejected. Every vault and destination account is a canonical ATA bound to the expected owner, mint, and token program.

## 10. Fee model

Amounts are `u64` base units. `required_total = checked_add(prize_pool, platform_fee)`. The platform cap is `floor(prize_pool × max_platform_fee_bps / 10_000)`, calculated in `u128` and converted safely to `u64`. The configured cap may not exceed 10,000 bps, the prize must be nonzero, and required total must not exceed `max_bounty_amount`. Settlement transfers exactly the committed prize and fee; donated excess never increases either.

## 11. Deadline semantics

Initialization requires `submission_deadline > now` and `judging_deadline > submission_deadline`. Activation requires `now < submission_deadline`. Normal winner selection permits the inclusive interval `submission_deadline <= now <= judging_deadline`. Permissionless resolution request requires `now > judging_deadline`. Unix timestamps come from Solana `Clock`; backend/UI time is advisory only.

## 12. Terms hash contract

The account stores exactly 32 immutable bytes and rejects all-zero input. Contract-side meaning is `SHA-256(canonical_terms_bytes)`. Phase 3 must define a versioned canonical byte encoding and should domain-separate it, for example `GIMME_IDEA_TERMS_V1 || canonical_payload`. The payload must commit to immutable bounty UUID, Problem reference, stage (`IDEA`/`BUILD`), selected Idea reference for Build, amounts, mint, deadlines, evaluation rules, IP/license, visibility, and cancellation/resolution policy. The exact canonical bytes must be persisted off-chain for later verification. Rust intentionally does not implement product JSON canonicalization.

## 13. Unsolicited-token/excess policy

The canonical vault may exist before bounty initialization. Funding transfers only `max(required_total - current_balance, 0)` and accepts a final balance at or above the commitment. `total_deposited` records the contractual commitment, not donations. Excess is locked while Active and cannot change state, winner, prize, or fee. At settlement it returns to the canonical sponsor ATA; on either refund path all vault tokens return there. The emptied vault is then closed and rent returns to the sponsor system account.

## 14. Settlement liveness design

Settlement needs no sponsor, judge, arbitrator, winner, or treasury signature. Any signer can pay transaction fees and create missing canonical winner, treasury, and sponsor ATAs via `init_if_needed`. Destination wallet addresses are committed in state/config and cannot be selected by the relayer. Sponsor system account remains an unchecked, constrained destination only for vault-close rent. Solana atomicity rolls all state and CPI effects back on failure.

## 15. Pause behavior

Pause blocks new bounty initialization, funding, activation, and normal judge finalization. It does not block settlement, pre-activation cancellation, resolution request, arbitration winner selection, or arbitration refund. Thus pause contains new commitments without becoming a fund-freezing or drain authority.

## 16. Resolution behavior

After the judging deadline has strictly passed, anyone may move Active to Resolution. Only the configured arbitration authority may select a nonzero winner or authorize refund. Winner resolution transitions to WinnerSelected, after which anyone may settle. Refund resolution transfers the entire vault to the canonical sponsor ATA and closes it. The arbitrator has no arbitrary destination or generic withdrawal capability.

## 17. Event schema

Events are `PlatformInitialized`, `PauseChanged`, `BountyInitialized`, `BountyFunded`, `BountyActivated`, `WinnerFinalized`, `BountySettled`, `BountyRefunded`, and `ResolutionRequested`. Lifecycle events now include bounty address and `bounty_id`; financial events include relevant mint and amounts. `BountyFunded` distinguishes committed total, sponsor contribution, and observed vault balance. `BountySettled` distinguishes winner, treasury, and excess amounts. Events are indexing hints, not sole proof: Phase 3 must fetch confirmed accounts and token deltas.

## 18. IDL path

Fresh local IDL: `target/idl/bounty_escrow.json`. Fresh generated TypeScript type: `target/types/bounty_escrow.ts`. Both reflect the separate initializer payer and permissionless settler accounts. `target` is generated/ignored, so CI and release workflows must regenerate it from the reviewed source.

## 19. packages/solana client API

The shared client exports `derivePlatformConfigPda`, `deriveBountyEscrowPda`, `deriveBountyIdFromUuid`, `deriveVaultAddress`, `decodeBountyEscrow`, `mapBountyState`, and `validateProgramId`. Raw token quantities remain `bigint`; the decoder validates the 266-byte length and account discriminator. `decodeBountyAccount` remains as a deprecated compatibility alias. Tests cover deterministic UUID vectors, PDA/vault derivation, state mapping, decoding, bigint formatting, and invalid inputs.

## 20. Local Anchor test matrix + results

Result: PASS against a fresh local validator and freshly built SBF binary. Coverage includes upgrade-authority initialization/front-run and replay protection; invalid bounty identifiers/terms/deadlines/fees/limits/mint/PDA/vault/token program; unfunded activation and fake sponsor; decoded events; funding replay; a pre-created overfunded canonical vault; Active cancellation rejection; sponsor ATA closure; missing destination ATA creation; pause blocking new actions while preserving cancel/resolution/refund/settlement; fake judge/arbitrator; resolution refund and resolution winner; wrong winner ATA/treasury; exact prize/fee/excess deltas; vault closure; double settlement; and distinct Idea/Build IDs and PDAs. Rust tests cover overflow, integer fee boundaries, initializer provenance, state distinction, and committed-outflow invariants.

Supporting gates passed during this phase: Rust format/check/clippy/tests, Anchor build/test, package typecheck/tests, repository lint/tests/typecheck, local `security.txt` query, and deterministic verifiable build. Scoped Phase 2 formatting passes. The repository-wide formatting check remains red on 48 pre-existing Phase 1 frontend/test files, which this contract-only phase did not rewrite. Final rerun evidence is recorded at handoff time; CI itself has not run on these uncommitted changes.

`pnpm audit --prod` reports 22 transitive advisories (6 high, 16 moderate). The Phase 2 client path includes the high `bigint-buffer` advisory through `@solana/spl-token`; the advisory reports no patched version. Other displayed high paths are in existing frontend dependencies outside this phase. `cargo-audit` was not installed, so no Rust advisory scan is claimed.

## 21. Devnet happy-path results

Not run for the hardened binary. The Devnet program still contains the old deployed hash, while the smoke client targets the new ABI. Running it now would not validate this source and could create misleading state. Execute the machine-readable smoke script only after authorized upgrade and deployed-hash verification.

## 22. Devnet cancellation results

Not run for the hardened binary for the same deployment-parity blocker. The local Anchor cancellation paths pass for both Initialized and Funded, including unsolicited excess and vault closure.

## 23. Devnet resolution results if run

Not run. In addition to the deployment mismatch, a real Devnet arbitration test requires control of the configured arbitration authority. Local Anchor tests pass both resolution-to-winner-to-settlement and resolution-to-refund, including unauthorized arbitrator rejection.

## 24. Two-stage Idea→Build smoke results

Not run on Devnet for the hardened binary. The rewritten smoke sequence creates and fully settles the Idea bounty before creating a separate Build bounty, then exercises a separate cancellation path. Local helper/test evidence confirms distinct UUID-derived IDs and PDAs. The on-chain program deliberately sees independent escrows; Phase 3 backend enforces their shared Problem and ordering.

## 25. Program ID

`BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6` on Devnet.

## 26. Upgrade authority

ProgramData `23EgEZUnytRFNVAdVrNFuaU3UKo9meDbJ14xhLP1f8if` reports upgrade authority `FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm`. The available wallet is `HrsRZ43rXfXJjLtzdyNYAVvNEZc6faQkMJwFhiHnVSUu`; it is not authorized to upgrade this program. No secret material was read into or copied into this report.

## 27. Source commit

Base commit: `18654703edd8b8728eb9926ba5c6464bb316029e` on branch `rebuild-gimme-idea-v2`. Phase 2 changes are currently uncommitted, so this commit alone does not reproduce the hardened source. A release commit must be created and reviewed before deployment.

## 28. CI binary hash

No CI result exists yet for the uncommitted Phase 2 source; machine metadata uses `null`, not an invented value. The same pinned builder was run locally with Solana 2.1.16 and Rust 1.81.0 and produced executable hash `4a5901ecfb0e855531fd9ed7c1fc0a6b4708d2ae359a590cc5bdcd2516dfc612`. The workflow now builds/tests without Devnet credentials and must publish/compare its own hash before deployment.

## 29. Deployed binary hash

Current Devnet executable hash: `e70ea81a2693facabfe3a51801d26c05ede271b4906dce9c417eb1f34e50b894`. It does not match the reviewed local deterministic hash `4a5901ecfb0e855531fd9ed7c1fc0a6b4708d2ae359a590cc5bdcd2516dfc612`. Deployment verification: FAIL / upgrade required.

## 30. Security.txt query result

Local hardened binary: PASS; `query-security-txt target/deploy/bounty_escrow.so` finds the declared project, contact, policy, source, languages, and `auditors: None`. Current Devnet deployment: FAIL; the query reports no security.txt start marker. This is a deployment blocker, not a source-code absence.

## 31. Stale buffer status

Previously reported buffer `G9hakQxdF6oifzA7tkWLLxTY64M5FKJGjgZhEBkw6VGT` is absent at the latest Devnet account query (`Unable to find account`). This phase did not close it and claims no recovered rent. No new buffer was created because the available wallet cannot authorize the target upgrade; deployment should avoid leaving another buffer and verify uploaded bytes before upgrade.

## 32. Remaining risks

- Critical operational: reviewed source is not deployed; deployed hash and `security.txt` fail parity.
- High assurance: no external audit, fuzz campaign, or formal verification has been performed.
- Centralized pause/arbitration keys require secure custody, ideally multisig, monitoring, and incident procedures.
- No on-chain authority rotation exists in V1; rotation would require a separately reviewed upgrade.
- Phase 3 has not yet implemented canonical terms generation, durable transaction reconciliation, idempotency, or chain-derived product status.
- The configured Devnet test mint has a mint authority and is not production USDC; production mint/configuration must be reviewed independently.
- Legacy SPL Token-only support is intentional; Token-2022 assets are unsupported.
- JavaScript dependency audit remains nonzero, including an unpatched high advisory in the SPL client dependency path; this is off-chain but must be threat-modeled or removed before production.
- Test scale is functional rather than adversarial/fuzz-scale; high-value custody warrants Trident/LiteSVM/property expansion and invariant-focused formal review.

## 33. Phase 3 backend integration requirements

Phase 3 must treat PostgreSQL as workflow intent and Solana as financial truth. It must persist UUID, derived bounty ID/PDA/vault, canonical terms bytes/hash/version, cluster, program ID, mint, raw bigint amounts, submitted signatures, confirmation slot/status, and decoded account state. Instructions must be idempotent and reconcile after RPC timeouts or restarts.

The backend—not this contract—must enforce Problem → Idea bounty → selected Idea → Build bounty ordering. A bounty is “funded” only after confirmed account state is `Funded` or later and the observed chain commitment is consistent; it is “paid” only after confirmed `Settled` plus expected token balance deltas/transaction evidence. An event alone, a submitted signature, or an optimistic UI flag is insufficient. Before sending any instruction, derive and validate program/PDA/ATA/mint values with `packages/solana` and reject cluster/program mismatches.

## 34. Mainnet readiness: NO

NO. Local hardening and tests do not establish real-money production safety. The reviewed binary is not deployed even on Devnet, CI has not produced a hash for the final commit, deployed `security.txt` is absent, Devnet smoke/reconciliation is incomplete, authorities are not yet production-operated, Phase 3 integration is absent, production mint/configuration is unreviewed, and no external audit has occurred. No mainnet deployment was attempted.

## 35. External audit status

External audit: **Not performed**.

This work is an internal implementation review using the `review-and-iterate` checklist. Before meaningful value is placed at risk, obtain an independent Solana security review appropriate to the custody and invariants, then resolve and retest all findings.
