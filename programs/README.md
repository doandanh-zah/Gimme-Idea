# Gimme Idea Smart Contract

Solana smart contract (Program) cho tính năng **Bounty Escrow** của Gimme Idea.

## Mô tả

Smart contract này cho phép:
1. **Khóa tiền thưởng (Bounty)**: Chủ dự án khóa USDC/SOL vào escrow account
2. **Giải phóng tiền**: Sau khi nhận feedback tốt, chủ dự án giải phóng tiền cho reviewer
3. **Huỷ bounty**: Chủ dự án có thể lấy lại tiền nếu chưa giải phóng

## Tech Stack

- **Framework**: Anchor 0.29.0
- **Language**: Rust
- **Blockchain**: Solana

## Cài đặt

### Yêu cầu

```bash
# Cài Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Cài Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Cài Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
```

### Build

```bash
cd programs
anchor build
```

Sau khi build, program ID sẽ được generate. Copy và thay thế vào:
- `Anchor.toml`: `[programs.devnet]`
- `lib.rs`: `declare_id!("...")`

### Test

```bash
anchor test
```

### Deploy

**Devnet:**
```bash
anchor deploy --provider.cluster devnet
```

**Mainnet:**
```bash
anchor deploy --provider.cluster mainnet
```

## Cấu trúc

```
programs/
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Workspace config
├── gimme-idea/
│   ├── Cargo.toml          # Program dependencies
│   ├── Xbuild.rs           # Build script
│   └── src/
│       └── lib.rs          # Main program logic
└── README.md
```

## Instructions

### 1. initialize_bounty

Tạo bounty mới và khóa tiền vào escrow.

**Params:**
- `bounty_amount: u64` - Số tiền (lamports)
- `project_id: String` - ID của dự án (từ database)

**Accounts:**
- `bounty` - Bounty account (PDA)
- `owner` - Người tạo bounty (signer)
- `system_program` - Solana System Program

### 2. release_bounty

Giải phóng bounty cho reviewer.

**Params:**
- `recipient: Pubkey` - Địa chỉ ví người nhận

**Accounts:**
- `bounty` - Bounty account
- `escrow_token_account` - Token account của escrow
- `recipient_token_account` - Token account của người nhận
- `owner` - Chủ bounty (signer)
- `token_program` - SPL Token Program

### 3. cancel_bounty

Huỷ bounty và hoàn tiền cho chủ dự án.

**Accounts:**
- `bounty` - Bounty account
- `escrow_token_account` - Token account của escrow
- `owner_token_account` - Token account của chủ
- `owner` - Chủ bounty (signer)
- `token_program` - SPL Token Program

## Tích hợp với Backend

Backend (NestJS) sẽ tương tác với smart contract qua `@solana/web3.js`:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize program
const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('GiMxxx...');

// Call initialize_bounty
await program.methods
  .initializeBounty(bountyAmount, projectId)
  .accounts({
    bounty: bountyPDA,
    owner: ownerPublicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Security

### Kiểm tra bảo mật quan trọng:

1. ✅ **Owner verification**: Chỉ chủ bounty mới được release/cancel
2. ✅ **Double-spend protection**: Không thể release bounty 2 lần
3. ✅ **PDA seeds**: Sử dụng `project_id` làm seed để tránh collision
4. ✅ **Signer checks**: Tất cả hành động quan trọng đều yêu cầu signature

### Audit Checklist (trước khi deploy mainnet):

- [ ] Code review bởi dev khác
- [ ] Unit tests đầy đủ
- [ ] Integration tests với Frontend
- [ ] Security audit bởi chuyên gia (nếu có budget)

## Lưu ý

### Hiện tại (MVP):

Smart contract này đang ở **giai đoạn cơ bản**. Trong production, bạn nên thêm:

1. **Multi-signature**: Yêu cầu nhiều chữ ký để release bounty
2. **Time-lock**: Tự động release sau X ngày nếu không có hành động
3. **Dispute mechanism**: Cho phép dispute nếu có tranh chấp
4. **Fee mechanism**: Thu phí platform từ mỗi bounty

### Phát triển thêm:

- **Milestone-based bounty**: Chia bounty thành nhiều mốc
- **Reputation-weighted**: Người có reputation cao nhận nhiều hơn
- **DAO voting**: Cộng đồng vote xem có release bounty không

## Testing

Xem folder `tests/` để biết cách test smart contract.

```bash
# Run all tests
anchor test

# Test specific file
anchor test --skip-local-validator tests/bounty.ts
```

## Deployment

### Devnet Deploy:

1. Build program: `anchor build`
2. Get program ID: `anchor keys list`
3. Update `Anchor.toml` và `lib.rs` với program ID
4. Deploy: `anchor deploy --provider.cluster devnet`

### Mainnet Deploy:

1. Đảm bảo đã test kỹ trên devnet
2. Có đủ SOL trong wallet (khoảng 5-10 SOL cho deploy)
3. Deploy: `anchor deploy --provider.cluster mainnet`

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Examples](https://github.com/solana-labs/solana-program-library)
