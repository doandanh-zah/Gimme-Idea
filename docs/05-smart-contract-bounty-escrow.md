# Gimme Idea — Smart Contract Bounty Escrow

## 1. Purpose

Tài liệu này định nghĩa smart contract architecture cho hệ thống Bounty Escrow của Gimme Idea V1.

Blockchain được dùng để đảm bảo:

- bounty money thực sự tồn tại;
- sponsor phải lock tiền trước khi bounty được hiển thị là funded;
- sponsor không thể tự ý rút tiền sau khi bounty đã bắt đầu;
- payout không thể vượt quá số tiền đã lock;
- payout/refund có transaction proof;
- cùng một prize không thể được payout hai lần.

Smart contract **không** chịu trách nhiệm cho:

- Problem content;
- Idea content;
- Project content;
- Submission content;
- judging logic;
- AI research;
- social interactions;
- reputation;
- hiring.

Smart contract chỉ xử lý:

**Money + Escrow State + Settlement Rules**

---

# 2. Technology

V1:

```text
Solana
Rust
Anchor
SPL Token Program
```

Recommended production bounty currency:

```text
USDC
```

V1 nên ưu tiên một stablecoin được allowlist thay vì cho phép arbitrary SPL token.

Development có thể sử dụng:

```text
Devnet test mint
```

Architecture vẫn lưu `mint`, để sau này support thêm asset mà không redesign toàn bộ contract.

---

# 3. Core Principle

Gimme Idea không được custody bounty bằng:

```text
Company
↓
Gimme Idea company wallet
↓
Winner
```

Thay vào đó:

```text
Company
↓
Solana Escrow Program
↓
Program-controlled Vault
↓
Winner(s)
```

Gimme Idea backend không được nắm private key có khả năng tùy ý rút toàn bộ escrow.

---

# 4. Source of Truth

## PostgreSQL

Source of truth cho:

```text
Problem
Bounty description
Requirements
Judging criteria
Submission
Winner metadata
Organization
User
```

## Solana

Source of truth cho:

```text
Escrow funded amount
Escrow state
Payout
Refund
Recipient payment
```

Frontend không được coi database field:

```text
funded = true
```

là bằng chứng cuối cùng.

Backend phải verify on-chain state.

---

# 5. High-Level Flow

```text
Create Problem
      ↓
Create Bounty
      ↓
Define Prize + Terms
      ↓
Initialize Escrow
      ↓
Sponsor Funds Escrow
      ↓
Blockchain Confirmation
      ↓
Activate Bounty
      ↓
━━━━━━━━ FUNDS LOCKED ━━━━━━━━
      ↓
Builders Submit
      ↓
Judging
      ↓
Winner(s) Finalized
      ↓
Settlement
      ↓
Winner Payout(s)
      +
Platform Fee
      ↓
Escrow Closed
```

---

# 6. Important State Distinction

`Funded`

và:

`Activated`

không giống nhau.

### Funded

Tiền đã vào escrow.

Nhưng bounty có thể chưa public/open.

### Activated

Bounty đã chính thức bắt đầu.

Sau activation:

**Sponsor không được unilateral cancel + withdraw funds.**

Điều này bảo vệ builder khỏi:

> Company treo $10,000 → 50 người build → company đổi ý → rút $10,000.

---

# 7. On-Chain Accounts

V1 nên giữ account model nhỏ.

Core accounts:

```text
PlatformConfig

BountyEscrow

EscrowVault

optional:
Prize / settlement data
```

---

# 8. PlatformConfig

Global config của Gimme Idea escrow program.

Conceptual structure:

```text
PlatformConfig {
    admin_authority
    arbitration_authority
    treasury
    max_platform_fee_bps

    paused

    bump
}
```

---

## admin_authority

Có quyền:

- maintain config;
- update approved configuration;
- emergency pause.

Production không nên sử dụng một developer hot wallet duy nhất làm admin.

Nên dùng một controlled multisig / secure governance authority.

---

## arbitration_authority

Dùng cho exceptional dispute cases.

Arbitrator không tham gia normal payout.

Normal path phải hoạt động mà không cần arbitrator.

---

## treasury

Wallet/token account nhận platform fee.

---

## max_platform_fee_bps

Smart contract không hardcode business fee hiện tại.

Ví dụ architecture có thể support:

```text
0 – configured maximum
```

Bounty lưu fee cụ thể tại thời điểm activation.

Ví dụ:

```text
fee_bps = 1500
```

tương đương 15%.

Đây chỉ là example.

Business fee thực tế phải được quyết định riêng.

Sau khi bounty activated:

```text
fee_bps
```

không được thay đổi.

---

# 9. Bounty ID

PostgreSQL Bounty có UUID.

Smart contract không cần lưu toàn bộ database object.

Backend phải tạo một deterministic on-chain identifier từ Bounty ID.

Conceptually:

```text
bounty_id
```

có thể là:

```text
16-byte UUID representation
```

hoặc canonical hash.

Không dùng bounty title làm seed.

---

# 10. BountyEscrow PDA

Conceptual derivation:

```text
PDA(
    "bounty",
    bounty_id
)
```

BountyEscrow PDA là authority chính cho escrow state.

PDA model phù hợp vì address được derive deterministically từ program + seeds và program có thể ký CPI thay cho PDA mà không cần một private key tương ứng.

---

# 11. Escrow Vault

Token không được lưu trong normal Gimme Idea wallet.

Mỗi Bounty có token vault riêng hoặc deterministic token account do BountyEscrow PDA kiểm soát.

Concept:

```text
BountyEscrow PDA
      │
      └── authority of EscrowVault
```

Vault chỉ được chuyển tiền thông qua rules của escrow program.

---

# 12. BountyEscrow State

Conceptual structure:

```text
BountyEscrow {
    bounty_id

    sponsor
    judge_authority

    mint

    prize_pool
    platform_fee_amount
    total_deposited

    submission_deadline
    judging_deadline

    terms_hash

    prize_count
    prize_amounts[]

    state

    created_at
    activated_at
    settled_at

    bump
}
```

Không lưu:

```text
title
description
problem
solution
submission content
```

on-chain.

---

# 13. Money Representation

On-chain amount phải dùng integer base units.

Không dùng:

```text
float
double
```

cho money.

Example conceptually:

```text
10,000 USDC
↓
raw token units according to mint decimals
```

Frontend chịu trách nhiệm format display.

Program validate mint + decimals trong token transfer flow.

Solana hiện khuyến nghị `TransferChecked` cho token transfers vì instruction có thể kiểm tra mint và decimals trước khi transfer.

---

# 14. Supported Mint Policy

V1:

**USDC-first**

Không cho sponsor nhập arbitrary mint address rồi gọi đó là bounty.

Backend + contract phải có:

```text
approved mint policy
```

Mục tiêu:

- tránh scam tokens;
- tránh fake USDC;
- tránh exotic Token-2022 behavior;
- UX dễ hiểu;
- accounting đơn giản.

Future version có thể support additional approved stable assets.

---

# 15. Terms Hash

Đây là field quan trọng.

Full bounty terms sống off-chain:

```text
Problem
Description
Requirements
Eligibility
Judging Criteria
Prize Structure
Deadline
IP Terms
```

Trước khi funding/activation, backend tạo canonical representation rồi hash:

```text
SHA-256(
    canonical_bounty_terms
)
```

Result:

```text
terms_hash
```

được commit vào BountyEscrow.

---

# 16. Why Terms Hash Exists

Không có terms hash:

Company có thể:

1. treo $10k;
2. builder bắt đầu làm;
3. company sửa judging criteria;
4. database chỉ còn version mới.

Với committed hash:

```text
Terms V3
↓
SHA-256
↓
on-chain terms_hash
```

có thể chứng minh terms nào đang được escrow bảo vệ.

Không cần đưa toàn bộ terms lên blockchain.

---

# 17. Terms Immutability

Trước activation:

Sponsor có thể sửa terms.

Nếu sửa:

```text
terms_hash
```

được update.

Sau activation:

**material bounty terms phải immutable.**

Không được thay:

```text
prize pool
prize split
judging criteria
submission requirements
IP terms
fee
```

một cách âm thầm.

Nếu cần thay đổi material terms:

Recommended V1:

```text
Cancel before activation
→ Refund
→ Create new Bounty
```

Đừng build amendment governance phức tạp trong V1.

---

# 18. Deadline

Bounty có ít nhất:

```text
submission_deadline
judging_deadline
```

Ví dụ:

```text
Submission Deadline
Sep 20

Judging Deadline
Sep 27
```

Hai deadline phải khác nhau.

---

# 19. Why Judging Deadline Exists

Nếu chỉ có submission deadline:

Company có thể giữ escrow vô hạn:

> “Chúng tôi vẫn đang judging.”

Không chấp nhận.

Sau `judging_deadline` mà chưa settlement:

Bounty chuyển vào condition:

```text
Needs Resolution / Dispute
```

Funds vẫn lock.

Không tự động trả lại sponsor.

---

# 20. Prize Structure

V1:

```text
Winner Take All

or

Ranked Prizes
```

Example:

```text
Prize Pool: $10,000

#1 = $6,000
#2 = $2,500
#3 = $1,500
```

Smart contract không hardcode percentage.

Program chỉ enforce:

```text
sum(prize_amounts) == prize_pool
```

trước activation.

---

# 21. Maximum Prize Slots

V1 nên có giới hạn.

Recommended:

```text
MAX_PRIZE_SLOTS = 10
```

Không cần support 10,000 winners trong một bounty.

Nếu future use case cần mass reward distribution, tạo contract design khác.

---

# 22. Platform Fee

UI phải phân biệt:

```text
Prize Pool
```

và:

```text
Platform Fee
```

Không quảng cáo:

> $10,000 Bounty

rồi lấy $2,000 từ chính $10,000 khiến winner chỉ còn $8,000.

Recommended model:

```text
Prize Pool = amount promised to builders

Platform Fee = sponsor pays additionally
```

Example:

```text
Advertised Prize Pool: $10,000

Platform Fee: $2,000

Sponsor Deposits:
$12,000
```

Tỷ lệ cụ thể chưa được chốt trong product docs.

Contract chỉ support configurable fee.

---

# 23. Platform Fee Settlement

Recommended:

Platform fee chỉ được chuyển tới treasury khi bounty successfully settles.

Concept:

```text
Escrow $12,000

↓ settlement

$10,000 → Winners
$2,000  → Gimme Idea Treasury
```

Nếu bounty legitimately refunded:

platform fee policy có thể là:

```text
full refund
```

trong V1.

Business có thể thay đổi sau nhưng policy phải được commit trước activation.

---

# 24. Judge Authority

Smart contract không thể tự biết:

> Idea A tốt hơn Idea B.

Đây là subjective/off-chain judgment.

Do đó mỗi Bounty cần:

```text
judge_authority
```

Có thể là:

- sponsor wallet;
- company multisig;
- judge committee authority;
- approved arbitration authority.

---

# 25. Important Limitation

Blockchain escrow có thể đảm bảo:

> tiền đã được lock.

Blockchain **không thể tự chứng minh**:

> submission nào sáng tạo nhất.

Nếu judging subjective, một trusted/oracle-like authority vẫn cần thiết.

Smart contract không được giả vờ rằng subjective bounty judging là fully trustless.

---

# 26. Normal Winner Selection

Normal flow:

```text
Submission closes
↓
Company/Judges review
↓
Winner decision stored off-chain
↓
Authorized judge finalizes winner recipients
↓
Program validates prize structure
↓
Settlement
```

Program không cần đọc GitHub/demo/submission.

---

# 27. Winner Data

For each prize slot:

```text
rank
recipient_wallet
amount
```

Optional settlement metadata may include:

```text
submission_hash
```

hoặc canonical submission identifier hash.

Không bắt buộc V1 nếu complexity không đáng.

Database vẫn giữ mapping:

```text
submission_id
↔
recipient_wallet
↔
rank
```

---

# 28. Wallet Verification Before Submission

Trước khi một builder có thể nhận payout:

Wallet phải được verified với Gimme Idea account.

Flow:

```text
Backend creates nonce
↓
Builder signs nonce
↓
Backend verifies signature
↓
wallet verified
```

Submission/winner settlement phải reference verified payout wallet.

---

# 29. Core Instructions

V1 smart contract nên giữ instruction set nhỏ.

Recommended conceptual instructions:

```text
initialize_platform

update_platform_config

initialize_bounty

update_bounty_before_activation

fund_bounty

activate_bounty

finalize_winners

settle_bounty

cancel_before_activation

request_resolution

resolve_dispute

refund_bounty

pause_program
```

Implementation có thể combine một số instructions nếu security model vẫn rõ.

---

# 30. initialize_bounty

Creates:

```text
BountyEscrow PDA
+
Escrow Vault
```

Required:

```text
sponsor
bounty_id
mint
prize_pool
prize_structure
deadlines
terms_hash
fee
judge_authority
```

Initial state:

```text
Initialized
```

No public `Funded` badge yet.

---

# 31. fund_bounty

Sponsor transfers:

```text
prize_pool
+
platform fee reserve
```

vào escrow vault.

Program must validate:

```text
correct sponsor
correct mint
correct vault
correct amount
approved mint
```

Possible result:

```text
Funded
```

Backend chỉ update DB sau chain confirmation.

---

# 32. Partial Funding

V1 nên tránh UX partial funding.

Recommended:

Bounty chỉ considered:

```text
Funded
```

khi:

```text
vault_balance >= required_total
```

Nếu sponsor chuyển thiếu:

```text
Awaiting Funding
```

Không public `Funded`.

---

# 33. Overfunding

Không nên dựa vào arbitrary excess transfer.

Program nên require exact expected amount hoặc có explicit logic cho excess.

Recommended V1:

```text
exact required deposit
```

để accounting đơn giản.

---

# 34. activate_bounty

Activation là trust boundary quan trọng.

Requirements:

```text
escrow fully funded
terms_hash valid
deadlines valid
prize structure valid
bounty not previously activated
```

After activation:

```text
state = Active
```

và sponsor mất quyền unilateral refund.

---

# 35. Cancellation Before Activation

Allowed:

```text
Initialized
Funded but not Activated
```

Sponsor có thể:

```text
cancel_before_activation
```

Funds:

```text
return sponsor
```

Không có builder nào được hứa rằng bounty đang active.

---

# 36. Cancellation After Activation

**NOT ALLOWED unilaterally.**

Sponsor không được gọi:

```text
cancel
→ refund me
```

sau activation.

Nếu có exceptional issue:

```text
request_resolution
```

và đi qua dispute/resolution flow.

---

# 37. Submission Data Is Off-Chain

Smart contract không lưu mỗi submission.

Reason:

- submission count có thể lớn;
- content thay đổi;
- GitHub/demo không phù hợp on-chain;
- cost/complexity không cần thiết.

Backend controls submission deadline.

On-chain contract controls money deadline.

---

# 38. finalize_winners

Allowed:

```text
after submission_deadline
before or at judging_deadline
```

By:

```text
judge_authority
```

Inputs:

```text
recipient(s)
rank(s)
```

Program validates:

```text
number of recipients <= prize_count

rank exists

amount for rank matches committed prize

recipient valid

no duplicate prize rank

bounty not settled

bounty active
```

---

# 39. Can One Wallet Win Multiple Prizes?

Recommended V1:

**No within the same bounty unless explicitly allowed in terms.**

Default program/business rule:

```text
unique recipient per ranked prize
```

Simplifies abuse prevention.

Future bounty type may allow otherwise.

---

# 40. Settlement

After winners finalized:

```text
settle_bounty
```

Program executes transfers.

Concept:

```text
Escrow Vault
├── Prize #1 → Winner A
├── Prize #2 → Winner B
├── Prize #3 → Winner C
└── Fee      → Treasury
```

After successful completion:

```text
state = Settled
```

---

# 41. Atomicity

Preferred:

Prize settlement should be atomic where practical.

Do not create state where:

```text
Winner #1 paid
Winner #2 not paid
but bounty says Settled
```

If technical transaction limits make one transaction impossible in future large prize structures:

Use explicit per-prize payout state.

For V1 with maximum small prize slots:

prefer simple settlement.

---

# 42. Recipient Token Account

If recipient does not have required token account, transaction flow may create the appropriate Associated Token Account before/while transferring where supported.

Token account ownership/mint must be validated before transfer. Solana's payment/token model uses token accounts for balances rather than storing SPL balances directly on the wallet address.

---

# 43. Double Payout Protection

After prize payout:

that prize cannot be executed again.

State must make calls idempotent/replay-safe.

Examples:

```text
prize.paid = true
```

hoặc bounty-level:

```text
Settled
```

for atomic settlement.

A repeated `settle_bounty` must fail safely.

---

# 44. Judging Timeout

Situation:

```text
Deadline passed
↓
Builders submitted
↓
Sponsor disappears
↓
Judging deadline passed
```

Wrong behavior:

```text
Auto refund sponsor
```

because sponsor could intentionally disappear to recover funds after receiving free submissions.

Correct V1 behavior:

```text
Needs Resolution
```

Funds remain locked.

---

# 45. Dispute / Resolution

Some bounty outcomes cannot be resolved fully on-chain.

Examples:

- sponsor disappears;
- judging dispute;
- no valid submissions;
- plagiarism;
- terms violation;
- sponsor alleges no valid work;
- builder alleges sponsor changed requirements.

These require human/off-chain resolution.

---

# 46. Arbitration Authority

V1 may use:

```text
arbitration_authority
```

controlled by a secure Gimme Idea multisig.

It should only be usable when bounty enters a permitted dispute state.

Not for normal payout.

---

# 47. resolve_dispute

Possible authorized resolution:

```text
PAY_WINNERS

REFUND_SPONSOR

SPLIT_RESOLUTION
```

For V1, simpler may be:

```text
payout according to declared winner structure
or
full refund
```

Avoid arbitrary percentage dispute distribution unless product policy requires it.

---

# 48. No Valid Submission

Terms must define this before activation.

Example policy:

If no submission satisfies eligibility/requirements:

```text
Refund Sponsor
```

But this decision cannot simply be:

> Sponsor says nobody was valid.

Need documented judging result / platform resolution if contested.

---

# 49. Refund

Refund is allowed only under explicit states/rules.

Examples:

### Before Activation

Sponsor cancellation:

```text
allowed
```

### After Activation

Only through:

```text
defined no-valid-submission outcome
or
dispute resolution
```

### After Settlement

```text
not allowed
```

---

# 50. Escrow Closure

After:

```text
settlement
or
full refund
```

remaining token balance should be zero except unavoidable dust rules.

Eligible accounts may be closed according to Solana account lifecycle best practice.

Any reclaimed rent must go to the clearly defined account, normally original payer/sponsor where appropriate.

---

# 51. Program Pause

Emergency mechanism:

```text
paused = true
```

should prevent new high-risk actions such as:

```text
initialize new bounty
activate bounty
```

During incident response.

Pause policy must be carefully designed so it does **not** give admin an arbitrary mechanism to steal escrowed funds.

Existing funds remain governed by escrow state.

---

# 52. Upgrade Authority

Production upgrade authority is a critical security key.

Do NOT leave program upgrade authority on:

```text
one developer hot wallet
```

Use:

```text
multisig / secured governance
```

with documented operational policy.

Before meaningful bounty volume:

consider independent smart contract audit.

---

# 53. Admin Cannot Withdraw Escrow

Critical invariant:

There must NOT be an instruction equivalent to:

```text
admin_withdraw_any_escrow(
    amount,
    destination
)
```

Gimme Idea admin should never have arbitrary withdrawal capability.

Every money movement must correspond to:

```text
settlement
refund
documented dispute resolution
```

---

# 54. Treasury Cannot Pull

Treasury is only a recipient.

It cannot call:

```text
pull_fee
```

from arbitrary active bounty.

Platform fee is released only under valid settlement rules.

---

# 55. Sponsor Cannot Change Recipient After Settlement

After winner finalization / settlement begins:

Winner data becomes immutable according to settlement state.

Sponsor cannot:

```text
Winner A
↓
change
↓
Sponsor Wallet
```

after payout authorization.

---

# 56. Backend / Contract Boundary

Backend is responsible for:

```text
creating DB bounty
displaying bounty
accepting submissions
judging UI
wallet identity
deadline UI
notification
winner metadata
```

Smart contract is responsible for:

```text
funding verification
money lock
activation
financial state
settlement constraints
payout
refund constraints
```

---

# 57. Blockchain Worker

Frontend must not directly mutate canonical DB blockchain status.

Flow:

```text
Wallet transaction
↓
Solana
↓
RPC/Webhook
↓
Blockchain Event Queue
↓
Blockchain Worker
↓
Verify actual account state
↓
Update PostgreSQL
```

This avoids trusting manipulated client data.

---

# 58. Idempotency

All important blockchain workflows must be idempotent.

Examples:

```text
fund_bounty
settlement event
refund event
webhook
payout confirmation
```

Backend should store:

```text
transaction signature
event type
processed state
```

and deduplicate.

---

# 59. Transaction Confirmation

Backend should verify more than:

```text
signature exists
```

It should validate:

```text
correct program
correct escrow PDA
correct mint
correct amount
expected state transition
successful transaction
```

before updating business state.

---

# 60. Terms Verification in Frontend

Before sponsor signs activation:

UI should show:

```text
Prize Pool
Platform Fee
Token
Submission Deadline
Judging Deadline
Prize Split
Terms Version
```

Sponsor explicitly confirms.

Builders viewing active bounty should be able to see:

```text
Funded ✓
Terms locked
```

Optionally expose:

```text
transaction
escrow address
terms hash
```

under advanced details.

Low-tech users do not need to understand PDA terminology.

---

# 61. UX Language

Do not expose:

```text
PDA derivation
CPI
Token account authority
instruction discriminator
```

in normal UX.

Use:

```text
$10,000 Funded

Funds locked in escrow

View on Solana
```

Advanced technical users can inspect chain details.

---

# 62. Core Security Invariants

### Invariant 1

Only approved mint can fund a bounty.

### Invariant 2

A bounty cannot activate until fully funded.

### Invariant 3

Advertised prize pool must equal committed prize amounts.

### Invariant 4

Sponsor cannot unilateral refund after activation.

### Invariant 5

Platform cannot arbitrarily withdraw escrow funds.

### Invariant 6

Payout cannot exceed committed prize pool.

### Invariant 7

Platform fee cannot exceed fee committed before activation.

### Invariant 8

Material bounty terms cannot silently change after activation.

### Invariant 9

A prize cannot be paid twice.

### Invariant 10

Settled bounty cannot be refunded.

### Invariant 11

Refunded bounty cannot later settle.

### Invariant 12

Wrong mint/vault/PDA must fail.

### Invariant 13

Unauthorized wallet cannot select winners.

### Invariant 14

Judging timeout does not automatically return funds to sponsor.

### Invariant 15

Every finalized money movement has on-chain proof.

---

# 63. State Machine

Recommended conceptual state machine:

```text
INITIALIZED
     │
     ▼
FUNDED
     │
     ├──── cancel before activation ───► REFUNDED
     │
     ▼
ACTIVE
     │
     ▼
JUDGING
     │
     ├──── normal ─────────────────────► SETTLED
     │
     └──── timeout/dispute
               │
               ▼
          RESOLUTION
            │     │
            │     └────────────────────► REFUNDED
            │
            └──────────────────────────► SETTLED
```

Invalid:

```text
ACTIVE → Sponsor Withdraw
```

---

# 64. State Transition Authorization

Conceptually:

| Transition | Authority |
|---|---|
| Initialize | Sponsor |
| Fund | Sponsor |
| Edit pre-activation terms | Sponsor |
| Activate | Sponsor / approved workflow |
| Enter judging | State/time based |
| Finalize winners | Judge Authority |
| Normal settle | Program rules + authorized instruction |
| Cancel before activation | Sponsor |
| Request resolution | Relevant participant/platform |
| Resolve dispute | Arbitration Authority |
| Emergency pause | Platform Admin |
| Arbitrary escrow withdrawal | Nobody |

---

# 65. Contract Does Not Need User Accounts

Smart contract only needs wallet addresses.

It does not know:

```text
username
email
profile
reputation
```

Mapping:

```text
Gimme User
↔
Verified Solana Wallet
```

belongs to backend.

---

# 66. Contract Does Not Judge Hiring

Fields such as:

```text
open_to_hiring
employee offer
interview status
```

stay off-chain.

Winning bounty merely creates proof of bounty result/payout.

---

# 67. Contract Does Not Store Problem

Problem ID can be linked indirectly through Bounty database.

On-chain only requires stable:

```text
bounty_id
```

No reason to store Problem text.

---

# 68. Testing Strategy

Smart contract must have extensive tests before mainnet.

At minimum:

## Initialization

```text
valid bounty initializes
duplicate bounty fails
invalid mint fails
invalid deadline fails
invalid prize total fails
excess fee fails
```

## Funding

```text
correct funding succeeds
underfunding not marked funded
wrong mint fails
wrong vault fails
wrong sponsor fails
double funding handled safely
```

## Activation

```text
unfunded cannot activate
funded can activate
terms mismatch fails
invalid deadline fails
second activation fails
```

## Cancellation

```text
pre-activation cancel succeeds
post-activation sponsor cancel fails
```

## Winners

```text
authorized judge succeeds
unauthorized judge fails
invalid rank fails
duplicate rank fails
duplicate recipient default fails
winner amount cannot be changed
```

## Payout

```text
correct payout succeeds
overpay fails
double payout fails
wrong recipient account fails
wrong mint fails
payout before winner finalization fails
payout from refunded bounty fails
```

## Refund

```text
valid pre-activation refund succeeds
active unilateral refund fails
authorized dispute refund succeeds
refund after settlement fails
double refund fails
```

## Deadline

```text
boundary timestamps
judging before submission close fails
judging timeout enters resolution path
```

## Authorization

```text
fake sponsor
fake judge
fake arbitrator
fake treasury
fake PDA
```

all fail.

---

# 69. Property / Invariant Testing

Beyond normal example tests, test invariants such as:

```text
total_outflow <= total_deposited

winner_payout_total <= prize_pool

treasury_fee <= committed_fee

settled XOR refunded

vault cannot be drained by arbitrary signer
```

Consider fuzz/property testing for amount and state transitions.

---

# 70. Mainnet Rollout

Do not immediately allow unlimited bounty amounts.

Recommended staged rollout:

### Phase 1

Devnet only.

### Phase 2

Mainnet pilot with:

```text
small maximum bounty
allowlisted organizations
manual monitoring
```

### Phase 3

Increase limits after:

- real usage;
- security review;
- incident response testing;
- contract audit if economically justified.

---

# 71. Maximum Bounty Guard

V1 may include operational maximum:

```text
max_bounty_amount
```

controlled by PlatformConfig.

Purpose:

limit blast radius during early mainnet launch.

Increase later through secure admin process.

---

# 72. Legal / Operational Boundary

The contract architecture can reduce custody/trust risk but does not by itself determine whether Gimme Idea's bounty/escrow business is legally classified as:

- escrow;
- payment service;
- marketplace;
- money transmission;
- another regulated activity.

Before meaningful real-money deployment across jurisdictions, legal review should cover:

- custody;
- dispute handling;
- platform fees;
- stablecoin usage;
- cross-border payouts;
- KYC/AML obligations;
- sanctions compliance;
- tax/reporting obligations.

Technical architecture must not be treated as legal clearance.

---

# 73. AI Implementation Instructions

Before writing Rust code, an AI agent must read:

```text
00-product-overview.md
01-domain-model.md
02-prd-core-flows.md
03-system-architecture.md
04-database-schema-draft.md
05-smart-contract-bounty-escrow.md
```

Then:

1. Produce account diagram.
2. Produce instruction list.
3. Produce state transition table.
4. Produce threat model.
5. Produce test matrix.
6. Confirm all security invariants.
7. Only then generate Anchor program code.

Do not start by generating `lib.rs`.

---

# 74. Explicit Anti-Patterns

Do NOT implement:

```text
admin can withdraw any vault

sponsor can cancel after activation

frontend controls funded status

arbitrary SPL token bounty

floating point token amounts

judging criteria on-chain as large text

submission content on-chain

one global wallet holding all bounty funds

private key for escrow PDA

automatic sponsor refund after judging timeout

fee percentage editable after activation
```

---

# 75. V1 Contract Mental Model

The simplest correct way to understand the contract:

```text
Company says:
"I promise $10,000 for this bounty."

↓

Company proves the promise:
$10,000 + fee enters escrow.

↓

Bounty activates:
Company can no longer simply take the money back.

↓

Community builds.

↓

Authorized judging produces winner(s).

↓

Program only allows the previously committed money
to move through an allowed settlement path.

↓

Every payment is publicly verifiable.
```

The contract's job is **not to decide who deserves to win**.

Its job is to make the economic promise behind a funded bounty credible.