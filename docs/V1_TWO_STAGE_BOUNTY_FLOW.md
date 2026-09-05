# V1 two-stage Bounty flow

```text
Problem
  -> Idea Bounty escrow #1
  -> private Idea Submissions
  -> DB winner lock + verified payout snapshot
  -> on-chain winner commitment and permissionless settlement
  -> restricted winning Idea
  -> Build Bounty escrow #2
  -> exact terms acceptance
  -> selected Idea unlock
  -> private Project workspace
  -> immutable Project Submission snapshot
  -> DB winner lock + verified payout snapshot
  -> on-chain winner commitment and permissionless settlement
  -> restricted winning Project
  -> optional interview / contract interest
```

Every Bounty belongs to one Problem. An Idea Bounty has no parent. A Build Bounty must reference a completed, chain-paid Idea Bounty for the same Problem and its selected winning Idea. The two rows use independently derived bounty IDs, PDAs, terms hashes, funding intents, and escrow histories.

Idea submissions store private structured payloads before a canonical Idea exists. Selecting a winner creates a restricted Idea; it does not publish it. Losing entrants may later choose to publish their own work, but no automatic publication occurs.

A builder cannot see the restricted direction until the Build Bounty is open and they accept the exact current terms hash. Project work remains private to its team. Submission creates an immutable versioned snapshot; continued Project edits do not rewrite judging evidence. The designated payout address is the verified reward-wallet snapshot, and team submissions must acknowledge the payout designation.

Interview and contract interest are optional off-chain outcomes and never modify prize settlement. Their API/UI workflow is not complete in this phase.

Operational status: the database invariants and reconciliation mapping exist, but the reviewed hardened program is not the binary currently deployed on Devnet. Until the upgrade authority deploys and verifies that binary and backend transaction/relayer paths are added, the complete economic journey remains blocked.
