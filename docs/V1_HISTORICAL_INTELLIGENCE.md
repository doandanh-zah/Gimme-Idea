# V1 historical intelligence

Historical memory has three layers:

1. Imported source facts preserve the source name/type, external ID, raw payload hash, cursor, source timestamp, adapter version, and original URL.
2. AI extraction creates version-bound claims with field provenance, HTTPS sources, confidence, provider/model metadata, and an independent verifier verdict of `supported`, `unsupported`, or `unknown`.
3. Human review may promote a Problem Signal into a canonical Problem or link a historical Project to an existing Problem.

The Colosseum adapter accepts only a configured official JSON feed. It normalizes minimally, upserts idempotently by source/external ID and payload hash, and stores the source payload for audit. It does not scrape pages blindly or declare every project a failed previous attempt.

Problem Signals are non-canonical observations. A human promotion decision is required before one becomes a Problem. `problem_project_links` records relationship type, similarity method/score, rationale, and review state. “Attempt,” “related,” and “inspiration” remain distinct; a shutdown Project may still validate that a Problem exists.

V1 retrieval can use reviewed links and stored similarity metadata. pgvector is not enabled, so no vector-quality claim is made. General research/search excludes private submissions, private Projects, attachments, judge notes, and organization-only material. AI failure leaves the core create, submit, judge, and reconcile workflows available.
