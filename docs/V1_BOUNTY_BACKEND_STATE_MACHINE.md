# V1 Bounty backend state machine

PostgreSQL owns workflow intent; Solana owns financial truth. API writes never make a Bounty funded, paid, or refunded by assertion alone.

```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> awaiting_funding: canonical terms frozen
  awaiting_funding --> funding_pending: funding intent + submitted signature
  funding_pending --> funded: finalized escrow account matches all commitments
  funded --> open: activation observed
  open --> closed: submission deadline
  closed --> judging
  judging --> winner_pending_chain: DB winner locked + payout wallet snapshotted
  winner_pending_chain --> settlement_pending: winner commitment observed
  settlement_pending --> completed: settled account observed
  awaiting_funding --> cancelled: valid pre-activation cancellation
  funding_pending --> resolution: mismatch or dispute
  funded --> refunded: finalized refund observed
  open --> resolution: deadline/arbitration path
  resolution --> completed: resolved winner + settlement observed
  resolution --> refunded: resolved refund observed
```

| Solana escrow state | Required commitment checks                                  | PostgreSQL projection              |
| ------------------- | ----------------------------------------------------------- | ---------------------------------- |
| account absent      | expected PDA derived from UUID; no funding claim            | `awaiting_funding` / `not_created` |
| Initialized         | program owner, PDA, bounty ID, terms hash, mint, prize, fee | `funding_pending` at most          |
| Funded              | all commitments plus exact total deposit                    | `funded`                           |
| Active              | all commitments                                             | `open`                             |
| WinnerSelected      | designated winner equals verified payout snapshot           | `settlement_pending`               |
| Settled             | terminal state and winner match                             | `completed`, payout confirmed      |
| Refunded            | terminal refund state                                       | `refunded`                         |
| Resolution          | arbitration state                                           | `resolution`                       |

Any address, UUID-derived ID, terms, mint, amount, fee, winner, owner, or state mismatch records reconciliation evidence, moves escrow metadata to error, and opens a resolution record. Duplicate chain events are ignored by a unique chain/signature/event-index key. Scheduled reconciliation is the recovery path for missed webhooks and restarts.

The current worker observes and reconciles accounts. Transaction preparation, judge winner commitment, relayer settlement, and arbitration/refund execution are not implemented in the backend, so related API responses explicitly say that a chain action is required.
