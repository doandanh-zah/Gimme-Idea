{
"defi": {
"protocol_type": "custom",
"program_id": "BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6",
"security_review": "self",
"oracle_integration": "none",
"emergency_pause": true
},
"pipeline": {
"ingestion_method": "webhook",
"data_types": ["program-events", "account-state", "payout-reconciliation", "historical-project-imports"],
"storage": "postgresql",
"backfill_implemented": false,
"recovery_method": "rpc-polling",
"idempotency_key": ["chain", "signature", "event_index"],
"runtime_verified": false
},
"review": {
"security_score": "B",
"quality_score": "A-",
"findings": [
{
"severity": "critical",
"category": "deployment",
"description": "The Devnet executable hash does not match the reviewed deterministic build, and the deployed binary does not expose the repository security.txt metadata.",
"fix": "Have upgrade authority FzcnaZMYcoAYpLgr7Wym2b8hrKYk3VXsRxWSLuvZKLJm deploy build hash 4a5901ecfb0e855531fd9ed7c1fc0a6b4708d2ae359a590cc5bdcd2516dfc612, then verify the deployed hash and query security.txt before running smoke tests."
},
{
"severity": "high",
"category": "assurance",
"description": "No independent external security audit or formal verification has been performed.",
"fix": "Commission an independent Solana program audit appropriate to value at risk and consider invariant-focused fuzzing or formal verification before real-money mainnet use."
},
{
"severity": "high",
"category": "supply-chain",
"description": "pnpm overrides remediated 19 advisories with upstream fixes; three high advisories remain in unpatched bigint-buffer and image-size transitive paths.",
"fix": "Do not pass attacker-controlled buffers or image formats to vulnerable conversion/parser APIs; track upstream remediation and require explicit release risk acceptance."
},
{
"severity": "medium",
"category": "governance",
"description": "Pause and arbitration remain centralized authorities, and V1 has no on-chain authority rotation instruction.",
"fix": "In Phase 3, custody these keys with documented multisig and incident procedures; add a separately reviewed authority-rotation upgrade if operational requirements demand it."
},
{
"severity": "low",
"category": "token-policy",
"description": "V1 intentionally supports only the legacy SPL Token program and one configured mint.",
"fix": "Reject Token-2022 in integrations and verify mint owner/decimals against SMART_CONTRACT_INTERFACE.json; add Token-2022 only through a separately tested upgrade."
},
{
"severity": "informational",
"category": "integration",
"description": "The contract stores an immutable 32-byte terms hash but canonical terms generation belongs to the Phase 3 backend.",
"fix": "Implement and version canonical terms bytes in Phase 3, hash them with SHA-256, and persist the exact bytes alongside each transaction record."
}
],
"ready_for_mainnet": false,
"report": "SMART_CONTRACT_V1_HARDENING_REPORT.md",
"artifact": "SMART_CONTRACT_V1_SECURITY_REVIEW.html",
"backend_security_score": "B-",
"backend_quality_score": "A-",
"backend_ready_for_mainnet": false,
"backend_report": "BACKEND_V1_CONVERGENCE_REPORT.md",
"backend_artifact": "BACKEND_V1_ACTIONABLE_REVIEW.html",
"backend_blockers": [
"reviewed Devnet binary parity",
"transaction preparation and settlement relayer",
"Redis recovery runtime verification",
"four-role privacy E2E",
"3 unpatched production dependency advisories",
"independent security audit"
]
}
}
