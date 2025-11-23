# Gimme Idea - Full Stack Project Structure

## 📁 Tổng quan cấu trúc

```
Gimme-Idea/
├── frontend/                 # Next.js Frontend (✅ DONE)
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities & stores
│   ├── constants.ts         # Mock data (cần thay thế bằng API)
│   ├── types.ts             # TypeScript types
│   └── package.json
│
├── backend/                 # NestJS Backend API (✅ NEW)
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── projects/       # Projects CRUD
│   │   ├── comments/       # Comments & likes
│   │   ├── users/          # User profiles
│   │   ├── payments/       # Payment verification
│   │   ├── shared/         # Shared services (Supabase, Solana)
│   │   ├── common/         # Guards, decorators
│   │   └── main.ts         # Entry point
│   ├── database/
│   │   └── schema.sql      # Database schema
│   ├── SETUP.md            # Setup guide
│   └── package.json
│
├── programs/                # Solana Smart Contract (✅ NEW)
│   ├── gimme-idea/
│   │   └── src/
│   │       └── lib.rs      # Bounty escrow program
│   ├── Anchor.toml         # Anchor config
│   ├── Cargo.toml          # Rust dependencies
│   └── README.md           # Smart contract docs
│
├── README.md                # Project overview
├── README2.md               # Technical specifications
└── PROJECT_STRUCTURE.md     # This file
```

---

## 🎯 Nhiệm vụ của từng phần

### Frontend (Next.js)
**Trạng thái**: ✅ Đã hoàn thành UI
**Cần làm**: Tích hợp Backend API

**Chức năng:**
- Landing page với animations
- Dashboard hiển thị dự án
- Upload dự án mới
- Vote & Comment
- Kết nối Solana wallet
- Payment modal

**Mock data hiện tại**: `constants.ts` - cần thay bằng API calls

---

### Backend (NestJS)
**Trạng thái**: ✅ Code hoàn thành, chưa chạy
**Cần làm**: Setup Supabase, config `.env`, test API

**Chức năng:**
- ✅ Authentication (SIWS - Sign In With Solana)
- ✅ Projects CRUD + Vote
- ✅ Comments + Likes
- ✅ User Profiles
- ✅ Payment Verification
- ✅ Supabase integration
- ✅ Solana on-chain verification

**API Endpoints:**
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - User hiện tại
- `GET /api/projects` - Danh sách dự án
- `POST /api/projects` - Tạo dự án
- `POST /api/projects/:id/vote` - Vote
- `POST /api/comments` - Comment
- `POST /api/payments/verify` - Verify transaction

---

### Smart Contract (Anchor/Rust)
**Trạng thái**: ✅ Code hoàn thành, chưa deploy
**Cần làm**: Build, test, deploy lên Devnet

**Chức năng:**
- ✅ Bounty escrow (khóa tiền thưởng)
- ✅ Release bounty (giải phóng cho reviewer)
- ✅ Cancel bounty (hoàn tiền)

**Instructions:**
- `initialize_bounty` - Tạo bounty mới
- `release_bounty` - Trả tiền cho reviewer
- `cancel_bounty` - Huỷ và hoàn tiền

---

## 🚀 Quy trình Setup đầy đủ

### Bước 1: Setup Database (Supabase)

```bash
# 1. Tạo project trên supabase.com
# 2. Chạy SQL schema
#    - Vào SQL Editor
#    - Copy nội dung backend/database/schema.sql
#    - Run
# 3. Tạo Storage buckets:
#    - project-images (public)
#    - avatars (public)
# 4. Lấy API keys từ Settings → API
```

---

### Bước 2: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Tạo .env file
cp .env.example .env

# Điền thông tin vào .env:
# - SUPABASE_URL (từ Supabase)
# - SUPABASE_ANON_KEY (từ Supabase)
# - SUPABASE_SERVICE_KEY (từ Supabase)
# - JWT_SECRET (random string mạnh)

# Chạy backend
npm run start:dev

# API sẽ chạy tại: http://localhost:3001
```

**Chi tiết**: Xem `backend/SETUP.md`

---

### Bước 3: Tích hợp Frontend với Backend

```bash
cd frontend

# Cập nhật .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>" >> .env.local

# Chạy frontend
npm run dev

# Frontend sẽ chạy tại: http://localhost:3000
```

**Cần sửa trong Frontend:**
1. Thay `PROJECTS` từ `constants.ts` → fetch từ API
2. Implement login flow với Solana wallet
3. Kết nối payment modal với smart contract

---

### Bước 4: Setup Smart Contract (Optional - cho Bounty)

```bash
cd programs

# Cài Anchor (nếu chưa có)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Build program
anchor build

# Lấy program ID
anchor keys list

# Cập nhật program ID vào:
# - Anchor.toml
# - gimme-idea/src/lib.rs

# Deploy lên Devnet
anchor deploy --provider.cluster devnet
```

**Chi tiết**: Xem `programs/README.md`

---

## 🔄 Luồng hoạt động (Flow)

### 1. User Login

```
Frontend → Wallet Adapter → Sign message
         ↓
Backend → Verify signature → Create/Get user → Return JWT
         ↓
Frontend → Store JWT in localStorage
```

### 2. Create Project

```
Frontend → User điền form → POST /api/projects (with JWT)
         ↓
Backend → Validate → Save to Supabase → Return project
         ↓
Frontend → Redirect to project detail page
```

### 3. Vote Project

```
Frontend → User click Vote → POST /api/projects/:id/vote (with JWT)
         ↓
Backend → Check duplicate vote → Increment count → Return
         ↓
Frontend → Update UI with new vote count
```

### 4. Payment/Tip

```
Frontend → User click Tip → Solana Wallet sign transaction
         ↓
Solana Network → Transaction confirmed → Get signature
         ↓
Frontend → POST /api/payments/verify { txHash, amount }
         ↓
Backend → Verify on-chain → Save to DB → Update reputation
         ↓
Frontend → Show success + Solscan link
```

### 5. Bounty Escrow (Advanced)

```
Frontend → Create bounty → Call Smart Contract
         ↓
Smart Contract → Lock funds in escrow account
         ↓
Backend → Store bounty info in DB
         ↓
(Later) Owner release bounty → Smart Contract transfer to reviewer
```

---

## 📊 Database Schema

### Users
- `id` (UUID)
- `wallet` (string) - Solana wallet address
- `username` (string)
- `bio`, `avatar`
- `reputation_score` (integer)
- `social_links` (JSONB)

### Projects
- `id` (UUID)
- `author_id` → users.id
- `title`, `description`
- `category` (DeFi, NFT, Gaming, Infrastructure, DAO)
- `stage` (Idea, Prototype, Devnet, Mainnet)
- `tags` (array)
- `votes`, `feedback_count`
- `bounty` (amount)

### Comments
- `id` (UUID)
- `project_id` → projects.id
- `user_id` → users.id
- `content`
- `parent_comment_id` (for replies)
- `likes`

### Transactions
- `id` (UUID)
- `tx_hash` (Solana transaction signature)
- `from_wallet`, `to_wallet`
- `amount`
- `type` (tip, bounty, reward)
- `status` (pending, confirmed, failed)

---

## 🧪 Testing Checklist

### Backend API Tests

```bash
# Test health check
curl http://localhost:3001/api/auth/health

# Test get projects
curl http://localhost:3001/api/projects

# Test login (cần signature thật từ wallet)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"publicKey":"...","signature":"...","message":"..."}'
```

### Frontend Integration Tests

- [ ] Connect wallet thành công
- [ ] Login flow hoàn chỉnh (signature → JWT)
- [ ] Hiển thị projects từ API (không phải mock data)
- [ ] Tạo project mới thành công
- [ ] Vote project thành công
- [ ] Comment thành công
- [ ] Payment modal tạo transaction thật
- [ ] Solscan link hiển thị đúng

### Smart Contract Tests

```bash
cd programs
anchor test
```

---

## 🚢 Deployment Plan

### Phase 1: MVP (Minimum Viable Product)
- ✅ Frontend UI
- ✅ Backend API
- ✅ Database (Supabase)
- ⏳ Frontend ↔ Backend integration
- ⏳ Test trên localhost

### Phase 2: Devnet Deploy
- Deploy Backend lên Railway/Render
- Deploy Frontend lên Vercel
- Test với Solana Devnet
- Invite beta testers

### Phase 3: Smart Contract
- Deploy smart contract lên Devnet
- Test bounty flow
- Security audit

### Phase 4: Mainnet Launch
- Deploy smart contract lên Mainnet
- Switch Solana network to Mainnet
- Connect domain gimmeidea.com
- Marketing & launch

---

## 🔧 Tech Stack Summary

| Component | Technology | Status |
|-----------|-----------|--------|
| Frontend | Next.js 14 + TypeScript | ✅ Done |
| Styling | Tailwind CSS | ✅ Done |
| State | Zustand | ✅ Done |
| Backend | NestJS + TypeScript | ✅ Done |
| Database | Supabase (PostgreSQL) | ⏳ Need setup |
| Auth | JWT + Solana Signature | ✅ Done |
| Blockchain | Solana Devnet/Mainnet | ⏳ Need deploy |
| Smart Contract | Anchor + Rust | ✅ Done |
| Wallet | Phantom, Solflare | ✅ Done |
| Hosting (Frontend) | Vercel | ⏳ TBD |
| Hosting (Backend) | Railway/Render | ⏳ TBD |

---

## 📝 Next Steps (Ưu tiên)

### Ngay lập tức:

1. **Setup Supabase**
   - Tạo project
   - Chạy schema.sql
   - Lấy API keys

2. **Test Backend**
   - Config .env
   - npm install && npm run start:dev
   - Test API với curl/Postman

3. **Tích hợp Frontend**
   - Thay mock data bằng API calls
   - Test login flow
   - Test CRUD operations

### Tuần tới:

4. **Deploy Backend**
   - Deploy lên Railway
   - Config environment variables
   - Test production API

5. **Deploy Frontend**
   - Deploy lên Vercel
   - Connect với Backend API
   - Test end-to-end

### Sau đó:

6. **Smart Contract** (nếu cần Bounty)
   - Build & deploy lên Devnet
   - Test escrow flow
   - Integrate với Frontend

---

## 🐛 Troubleshooting

### "Backend không connect được Supabase"
→ Kiểm tra SUPABASE_URL và keys trong .env

### "Frontend không call được API"
→ Kiểm tra CORS settings trong backend/src/main.ts

### "Login không hoạt động"
→ Kiểm tra signature format (phải là Base58)

### "Smart contract build error"
→ Đảm bảo đã cài Rust, Solana CLI, Anchor đúng version

---

## 📚 Documentation Links

- [Backend Setup Guide](backend/SETUP.md)
- [Smart Contract README](programs/README.md)
- [API Specifications](README2.md)
- [Frontend Overview](README.md)

---

## 💡 Tips

1. **Làm từng bước một**: Setup Backend trước, test kỹ, rồi mới tích hợp Frontend
2. **Dùng Postman**: Test API trước khi code Frontend
3. **Check logs**: Backend logs rất chi tiết, giúp debug nhanh
4. **Start simple**: Chạy local trước, deploy sau
5. **Backup .env**: Lưu .env file ở nơi an toàn

---

Chúc bạn build thành công! 🚀
