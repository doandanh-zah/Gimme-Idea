# 📊 TIẾN ĐỘ DỰ ÁN GIMME IDEA

*Cập nhật lần cuối: 23/11/2025, 10:30 AM*

---

## 🎯 Tổng quan

Theo yêu cầu trong **README.md** và **README2.md**, dự án cần hoàn thành 3 phần chính:
1. **Backend API** (NestJS + PostgreSQL/Supabase)
2. **Frontend Integration** (Kết nối Frontend với Backend thật)
3. **Smart Contract** (Solana Program cho Bounty Escrow)

---

## ✅ PHẦN 1: BACKEND API

### 1.1. Kiến trúc & Setup
| Yêu cầu | Trạng thái | Ghi chú |
|---------|-----------|---------|
| Framework: NestJS + TypeScript | ✅ Hoàn thành | Đã setup cấu trúc module chuẩn |
| Database: PostgreSQL/Supabase | ✅ Hoàn thành | Sử dụng Supabase |
| ORM/Client: Prisma hoặc Supabase Client | ✅ Hoàn thành | Dùng @supabase/supabase-js |
| Environment Variables | ✅ Hoàn thành | File .env đã config đầy đủ |
| Port 3001 | ✅ Hoàn thành | Backend chạy http://localhost:3001 |

### 1.2. Database Schema
| Bảng | Trạng thái | Fields |
|------|-----------|--------|
| `users` | ✅ Hoàn thành | wallet, username, bio, avatar, reputation_score, social_links, **last_login_at**, **login_count** |
| `projects` | ✅ Hoàn thành | id, author_id, title, description, category, stage, tags, votes, feedback_count, bounty, images |
| `comments` | ✅ Hoàn thành | id, project_id, user_id, content, likes, parent_comment_id |
| `project_votes` | ✅ Hoàn thành | user_id, project_id (để chặn spam vote) |
| `comment_likes` | ✅ Hoàn thành | user_id, comment_id (để chặn spam like) |
| `transactions` | ✅ Hoàn thành | tx_hash, from_wallet, to_wallet, amount, type, project_id |
| `notifications` | ✅ Hoàn thành | user_id, message, type, read |

**Thêm mới:**
- ✅ `last_login_at` và `login_count` columns cho wallet persistence
- ✅ PostgreSQL Functions cho atomic operations (increment_login_count, increment_votes, etc.)

### 1.3. Authentication API (Theo README2.md Section 3A)
| Endpoint | Method | Trạng thái | Chức năng |
|----------|--------|-----------|-----------|
| `/auth/login` | POST | ✅ Hoàn thành | SIWS - Verify signature → Tạo/Lấy user → Trả JWT token |
| `/auth/me` | GET | ✅ Hoàn thành | Lấy thông tin user hiện tại từ JWT |
| `/auth/health` | GET | ✅ Hoàn thành | Health check endpoint |

**Tính năng đặc biệt:**
- ✅ **Wallet Persistence**: Connect wallet = Auto login/register
- ✅ **Login Tracking**: Tự động lưu last_login_at và login_count
- ✅ **JWT Token**: Hết hạn sau 7 ngày (configurable)

### 1.4. Projects API (Theo README2.md Section 3B)
| Endpoint | Method | Trạng thái | Chức năng |
|----------|--------|-----------|-----------|
| `/projects` | GET | ✅ Hoàn thành | List projects với filters (category, stage, search, sort) |
| `/projects/:id` | GET | ✅ Hoàn thành | Chi tiết 1 project + comments nested |
| `/projects` | POST | ✅ Hoàn thành | Tạo project mới (validate với Zod) |
| `/projects/:id` | PATCH | ✅ Hoàn thành | Update project (chỉ author) |
| `/projects/:id` | DELETE | ✅ Hoàn thành | Xóa project (chỉ author) |
| `/projects/:id/vote` | POST | ✅ Hoàn thành | Vote project (chặn spam với project_votes table) |

### 1.5. Comments API (Theo README2.md Section 3C)
| Endpoint | Method | Trạng thái | Chức năng |
|----------|--------|-----------|-----------|
| `/comments/project/:projectId` | GET | ✅ Hoàn thành | Lấy comments của 1 project |
| `/comments` | POST | ✅ Hoàn thành | Tạo comment mới (support nested reply) |
| `/comments/:id/like` | POST | ✅ Hoàn thành | Like comment (chặn spam với comment_likes table) |

### 1.6. Users API (Theo README2.md Section 3D)
| Endpoint | Method | Trạng thái | Chức năng |
|----------|--------|-----------|-----------|
| `/users/:username` | GET | ✅ Hoàn thành | Xem profile public của user khác |
| `/users/:username/projects` | GET | ✅ Hoàn thành | Lấy danh sách projects của user |
| `/users/profile` | PATCH | ✅ Hoàn thành | Update profile của chính mình |

### 1.7. Payments API (Theo README2.md Section 4)
| Endpoint | Method | Trạng thái | Chức năng |
|----------|--------|-----------|-----------|
| `/payments/verify` | POST | ✅ Hoàn thành | Verify Solana transaction signature |
| `/payments/history` | GET | ✅ Hoàn thành | Lịch sử transactions của user |

**Logic Backend Verification:**
- ✅ Không tin client ngay
- ✅ Sử dụng `@solana/web3.js` để verify transaction on-chain
- ✅ Check recipient wallet + amount
- ✅ Cộng reputation points khi verify thành công

### 1.8. Shared Types (Theo README2.md Section 5)
| File | Trạng thái | Mục đích |
|------|-----------|----------|
| `backend/src/shared/types.ts` | ✅ Hoàn thành | Đồng bộ types giữa Frontend-Backend |
| Frontend import | ⏳ Chưa làm | Cần copy hoặc symlink types |

**Types đã implement:**
- ✅ `Project`, `Comment`, `User`, `Transaction`, `ApiResponse`
- ✅ Thêm `lastLoginAt` và `loginCount` vào User interface

---

## ⏳ PHẦN 2: FRONTEND INTEGRATION

### 2.1. Environment Setup
| Task | Trạng thái | File |
|------|-----------|------|
| Tạo .env.local | ✅ Hoàn thành | NEXT_PUBLIC_API_URL, SUPABASE_URL, SOLANA_RPC |
| Install dependencies | ✅ Hoàn thành | @supabase/supabase-js, axios, bs58 |
| API Client | ✅ Hoàn thành | `lib/api-client.ts` (Full CRUD methods) |
| Supabase Realtime Client | ✅ Hoàn thành | `lib/supabase-client.ts` (Subscriptions + Storage) |

### 2.2. Replace Mock Data (Theo README.md Section 3)
| Component/File | Trạng thái | Công việc cần làm |
|----------------|-----------|-------------------|
| `constants.ts` | ❌ Chưa làm | Xóa PROJECTS mock data |
| `lib/store.ts` - `connectWallet()` | ❌ Chưa làm | Thay setTimeout bằng real Wallet Adapter + API login |
| `lib/store.ts` - `addProject()` | ❌ Chưa làm | Gọi `apiClient.createProject()` |
| `lib/store.ts` - `voteProject()` | ❌ Chưa làm | Gọi `apiClient.voteProject()` |
| `lib/store.ts` - `addComment()` | ❌ Chưa làm | Gọi `apiClient.createComment()` |
| `components/PaymentModal.tsx` | ❌ Chưa làm | Thay Math.random() hash bằng real Solana transaction |
| `components/UploadProject.tsx` | ❌ Chưa làm | Thay animation bằng POST request thật |

### 2.3. Wallet Integration (Theo README.md Section 3.1)
| Task | Trạng thái | Mô tả |
|------|-----------|-------|
| WalletMultiButton UI | ❓ Cần kiểm tra | Có thể đã có từ frontend cũ |
| Sign message với wallet | ❌ Chưa làm | Dùng `signMessage()` từ wallet adapter |
| Gửi signature lên `/auth/login` | ❌ Chưa làm | Cần tích hợp trong `connectWallet()` |
| Lưu JWT token | ❌ Chưa làm | localStorage.setItem('auth_token') |
| Auto-login on page load | ❌ Chưa làm | useEffect check token → fetch /auth/me |

### 2.4. Real Solana Transactions (Theo README2.md Section 4)
| Task | Trạng thái | Mô tả |
|------|-----------|-------|
| SystemProgram.transfer() | ❌ Chưa làm | Chuyển SOL thật |
| SPL Token transfer (USDC) | ❌ Chưa làm | Tipping/Bounty bằng USDC |
| confirmTransaction() | ❌ Chưa làm | Đợi transaction confirmed |
| Link Solscan thật | ❌ Chưa làm | `https://solscan.io/tx/${signature}` |
| Gọi `/payments/verify` | ❌ Chưa làm | Backend verify on-chain |

### 2.5. Realtime Features (Theo README2.md Section 3C)
| Feature | Trạng thái | Mô tả |
|---------|-----------|-------|
| Subscribe new comments | ❌ Chưa làm | Dùng `subscribeToProjectComments()` |
| Subscribe vote changes | ❌ Chưa làm | Dùng `subscribeToProjectVotes()` |
| Subscribe new projects | ❌ Chưa làm | Dùng `subscribeToNewProjects()` |
| Unsubscribe on unmount | ❌ Chưa làm | Cleanup trong useEffect |

---

## 🔗 PHẦN 3: SMART CONTRACT (Solana Program)

### 3.1. Simple Tipping (Theo README.md Section 5.1)
| Task | Trạng thái | Mô tả |
|------|-----------|-------|
| Client-side SPL Token transfer | ❌ Chưa làm | Dùng @solana/spl-token |
| Không cần Smart Contract | ✅ Hiểu | Chỉ cần SDK transfer |

### 3.2. Bounty Escrow Contract (Theo README.md Section 5.2)
| Task | Trạng thái | Mô tả |
|------|-----------|-------|
| Anchor program skeleton | ✅ Hoàn thành | Created `programs/gimme-idea/` |
| `lock_bounty` instruction | ✅ Hoàn thành | Lock USDC vào vault |
| `release_bounty` instruction | ✅ Hoàn thành | Release khi feedback accepted |
| Deploy to Devnet | ❌ Chưa làm | Cần test trên Devnet |
| Frontend integration | ❌ Chưa làm | Gọi program từ React |

**File structure:**
```
programs/gimme-idea/
├── Cargo.toml ✅
├── src/
│   └── lib.rs ✅ (Instructions: lock_bounty, release_bounty)
└── Anchor.toml ✅
```

---

## 📈 Tổng kết tiến độ

### Backend: **95%** ✅
- ✅ Kiến trúc hoàn chỉnh (NestJS + Supabase)
- ✅ Tất cả API endpoints theo specs
- ✅ Database schema đầy đủ
- ✅ Wallet persistence & login tracking
- ✅ PostgreSQL functions cho atomic operations
- ✅ Shared types
- ⏳ Realtime Socket.io (Dùng Supabase Realtime thay thế)

### Frontend: **30%** ⏳
- ✅ Environment variables
- ✅ API Client created
- ✅ Supabase Realtime client created
- ❌ Chưa replace mock data
- ❌ Chưa tích hợp wallet thật
- ❌ Chưa có real Solana transactions
- ❌ Chưa connect realtime subscriptions

### Smart Contract: **60%** ⏳
- ✅ Anchor program code
- ❌ Chưa deploy
- ❌ Chưa test
- ❌ Chưa tích hợp frontend

---

## 🎯 Next Steps (Theo thứ tự ưu tiên)

### Priority 1: Frontend-Backend Connection (Cần làm ngay)
1. ✅ ~~Install frontend dependencies~~
2. ⏳ **Update Zustand store** để dùng apiClient thay vì mock
3. ⏳ **Tích hợp Wallet Adapter** thật (WalletMultiButton + signMessage)
4. ⏳ **Test flow**: Connect wallet → Login → Create project
5. ⏳ **Enable Realtime**: Subscribe to comments/votes

### Priority 2: Solana Transactions (Sau khi P1 xong)
1. ⏳ Implement real SPL Token transfer (USDC)
2. ⏳ Replace fake transaction hashes
3. ⏳ Test tipping flow end-to-end

### Priority 3: Smart Contract (Cuối cùng)
1. ⏳ Deploy Anchor program to Devnet
2. ⏳ Test bounty escrow flow
3. ⏳ Integrate với frontend

### Priority 4: Deploy to Production
1. ⏳ Frontend → Vercel (gimmeidea.com)
2. ⏳ Backend → Railway/Render
3. ⏳ Database → Supabase Production
4. ⏳ Smart Contract → Mainnet

---

## 📝 Notes

### Đã làm tốt:
- ✅ Backend architecture rất chuẩn, module hóa tốt
- ✅ Có error handling và validation (Zod)
- ✅ JWT authentication secure
- ✅ Database schema complete với indexes
- ✅ Wallet persistence tự động (Connect = Login)

### Cần cải thiện:
- ⚠️ Frontend vẫn đang dùng 100% mock data
- ⚠️ Chưa test end-to-end flow
- ⚠️ Smart contract chưa deploy

### Rủi ro:
- ⚠️ Nếu Frontend types không sync với Backend → Lỗi runtime
- ⚠️ Realtime có thể lag nếu không optimize subscriptions
- ⚠️ Smart contract cần audit trước khi lên Mainnet

---

## 🔗 Files quan trọng

### Backend
- `backend/src/auth/auth.service.ts` - Wallet login logic
- `backend/src/shared/types.ts` - Shared types
- `backend/database/schema.sql` - Database schema
- `backend/database/functions.sql` - PostgreSQL functions
- `backend/.env` - Environment variables

### Frontend
- `frontend/lib/api-client.ts` - API client (MỚI TẠO)
- `frontend/lib/supabase-client.ts` - Realtime client (MỚI TẠO)
- `frontend/lib/store.ts` - Zustand store (CẦN UPDATE)
- `frontend/.env.local` - Environment variables
- `frontend/constants.ts` - Mock data (CẦN XÓA)

### Smart Contract
- `programs/gimme-idea/src/lib.rs` - Anchor program
- `programs/gimme-idea/Cargo.toml` - Dependencies

---

**Kết luận**: Backend đã sẵn sàng production. Bước tiếp theo là kết nối Frontend với Backend để hoàn thiện luồng end-to-end.

---

## 🗺️ ROADMAP ĐẾN PRODUCTION (Chi tiết từng bước)

### PHASE 1: LOCAL INTEGRATION (1-2 ngày)
*Mục tiêu: Frontend + Backend chạy tốt trên localhost*

#### Step 1.1: Wallet Connection Thật (QUAN TRỌNG NHẤT)
**Tại sao làm đầu tiên?** Wallet = Authentication = Nền tảng của toàn bộ app

**Công việc:**
1. ✅ Kiểm tra `@solana/wallet-adapter-react` đã cài chưa (package.json)
2. ⏳ Tạo `WalletContextProvider` wrapper cho app (nếu chưa có)
3. ⏳ Update `lib/store.ts` - function `connectWallet()`:
   ```typescript
   // Thay setTimeout bằng:
   - Lấy publicKey từ wallet
   - Sign message: "Login to GimmeIdea - {timestamp}"
   - Gọi apiClient.login({ publicKey, signature, message })
   - Lưu token + user vào localStorage
   - Update Zustand state
   ```
4. ⏳ Test: Click "Connect Wallet" → Phantom mở → Approve → Thấy user info

**Output:** User có thể login bằng ví Solana thật

---

#### Step 1.2: Load Projects từ Backend
**Công việc:**
1. ⏳ Update `lib/store.ts` - Thay `projects: PROJECTS` bằng:
   ```typescript
   projects: [], // Empty ban đầu
   loadProjects: async () => {
     const { data } = await apiClient.getProjects();
     set({ projects: data });
   }
   ```
2. ⏳ Trong `app/dashboard/page.tsx`, gọi `loadProjects()` khi mount:
   ```typescript
   useEffect(() => {
     useAppStore.getState().loadProjects();
   }, []);
   ```
3. ⏳ Xóa mock data trong `constants.ts` (PROJECTS array)

**Test:** Dashboard hiển thị projects từ database

---

#### Step 1.3: Create Project Flow
**Công việc:**
1. ⏳ Update `components/UploadProject.tsx`:
   - Thay animation success bằng `await apiClient.createProject(formData)`
   - Handle errors (toast notification)
2. ⏳ Sau khi create thành công → Reload danh sách projects

**Test:** Tạo project mới → Thấy ngay trong Dashboard

---

#### Step 1.4: Vote & Comment Features
**Công việc:**
1. ⏳ Update `voteProject()` trong store:
   ```typescript
   voteProject: async (id) => {
     await apiClient.voteProject(id);
     // Reload project hoặc update local state
   }
   ```
2. ⏳ Update `addComment()` trong store tương tự

**Test:** Vote project → Count tăng. Comment → Hiện trong list

---

#### Step 1.5: Realtime Subscriptions
**Công việc:**
1. ⏳ Trong `components/ProjectDetail.tsx`:
   ```typescript
   useEffect(() => {
     const channel = subscribeToProjectComments(projectId, (newComment) => {
       // Thêm vào state
     });

     return () => unsubscribe(channel);
   }, [projectId]);
   ```

**Test:** Mở 2 browser → Comment ở tab 1 → Tab 2 thấy ngay (không cần F5)

---

### PHASE 2: SOLANA TRANSACTIONS (1 ngày)
*Mục tiêu: Thay fake transaction hash bằng thật*

#### Step 2.1: Tipping với SOL
**Công việc:**
1. ⏳ Update `components/PaymentModal.tsx`:
   ```typescript
   import { useConnection, useWallet } from '@solana/wallet-adapter-react';
   import { SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

   const handleTip = async () => {
     const transaction = new Transaction().add(
       SystemProgram.transfer({
         fromPubkey: publicKey,
         toPubkey: new PublicKey(recipientWallet),
         lamports: amount * LAMPORTS_PER_SOL,
       })
     );

     const signature = await sendTransaction(transaction, connection);
     await connection.confirmTransaction(signature);

     // Gọi backend verify
     await apiClient.verifyTransaction({
       signature,
       type: 'tip',
       recipientWallet,
       amount,
       commentId,
     });
   }
   ```
2. ⏳ Thay Math.random() hash bằng real `signature`
3. ⏳ Link Solscan: `https://solscan.io/tx/${signature}?cluster=devnet`

**Test:** Tip comment → Wallet mở → Approve → Link Solscan thật

---

#### Step 2.2: USDC Tipping (Optional - Nâng cao)
**Công việc:**
1. ⏳ Install `@solana/spl-token`
2. ⏳ Tạo instruction transfer USDC thay vì SOL
3. ⏳ Test với devnet USDC

**Test:** Tip bằng USDC token

---

### PHASE 3: POLISH & TESTING (1 ngày)
*Mục tiêu: Đảm bảo mọi thứ hoạt động ổn định*

#### Step 3.1: Error Handling
**Công việc:**
1. ⏳ Thêm try-catch cho tất cả API calls
2. ⏳ Toast notifications cho errors
3. ⏳ Loading states (spinners) khi đang fetch data

---

#### Step 3.2: Type Safety
**Công việc:**
1. ⏳ Copy `backend/src/shared/types.ts` sang `frontend/lib/types.ts`
2. ⏳ Đảm bảo Frontend và Backend dùng chung types
3. ⏳ Fix TypeScript errors (nếu có)

---

#### Step 3.3: Testing Checklist
- [ ] Connect wallet → Login thành công
- [ ] Create project → Hiện trong Dashboard
- [ ] Vote project → Count tăng
- [ ] Comment → Hiện ngay (realtime)
- [ ] Tip comment → Transaction thành công
- [ ] Profile update → Lưu đúng
- [ ] Logout → Clear state
- [ ] F5 page → Auto-login nếu còn token

---

### PHASE 4: BACKEND DEPLOYMENT (30 phút)
*Mục tiêu: Deploy backend lên Railway*

#### Step 4.1: Chuẩn bị Backend
**Công việc:**
1. ⏳ Tạo file `backend/.gitignore` đảm bảo .env không bị push
2. ⏳ Tạo file `backend/Procfile` (nếu cần):
   ```
   web: npm run start:prod
   ```
3. ⏳ Build test: `npm run build` → Đảm bảo không lỗi

---

#### Step 4.2: Deploy lên Railway
**Công việc:**
1. ⏳ Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. ⏳ Chọn repo `Gimme-Idea` → Root directory: `backend`
3. ⏳ Add Environment Variables:
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   JWT_SECRET=...
   JWT_EXPIRES_IN=7d
   SOLANA_NETWORK=devnet
   SOLANA_RPC_URL=...
   FRONTEND_URL=https://gimmeidea.com (tạm thời để *)
   ```
4. ⏳ Deploy → Chờ build thành công
5. ⏳ Copy Railway URL (ví dụ: `https://gimme-idea-backend.up.railway.app`)

**Test:** Gọi `https://your-backend.railway.app/api/auth/health` → Thấy response

---

#### Step 4.3: Update CORS
**Công việc:**
1. ⏳ Update `backend/src/main.ts`:
   ```typescript
   app.enableCors({
     origin: [
       'http://localhost:3000',
       'https://gimmeidea.com',
       'https://www.gimmeidea.com'
     ],
     credentials: true,
   });
   ```
2. ⏳ Push code → Railway auto redeploy

---

### PHASE 5: FRONTEND DEPLOYMENT (30 phút)
*Mục tiêu: Deploy frontend lên Vercel với domain gimmeidea.com*

#### Step 5.1: Chuẩn bị Frontend
**Công việc:**
1. ⏳ Update `frontend/.env.local` → `.env.production`:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   ```
2. ⏳ Build test local: `npm run build` → Fix errors nếu có

---

#### Step 5.2: Deploy lên Vercel
**Công việc:**
1. ⏳ Vào [vercel.com](https://vercel.com) → Add New Project
2. ⏳ Import GitHub repo `Gimme-Idea`
3. ⏳ Settings:
   - Framework Preset: **Next.js**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. ⏳ Environment Variables: Copy từ `.env.production`
5. ⏳ Deploy → Chờ build thành công
6. ⏳ Vercel tự tạo URL: `https://gimme-idea.vercel.app`

**Test:** Truy cập Vercel URL → App hoạt động

---

#### Step 5.3: Config Domain gimmeidea.com
**Công việc:**
1. ⏳ Trong Vercel Project Settings → Domains → Add `gimmeidea.com`
2. ⏳ Vercel sẽ cho DNS records cần thêm
3. ⏳ Vào GoDaddy → DNS Management → Thêm records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. ⏳ Chờ DNS propagate (5-30 phút)

**Test:** Truy cập `https://gimmeidea.com` → Thấy app

---

#### Step 5.4: Update Backend FRONTEND_URL
**Công việc:**
1. ⏳ Railway → Environment Variables → Update:
   ```
   FRONTEND_URL=https://gimmeidea.com
   ```
2. ⏳ Redeploy backend

---

### PHASE 6: PRODUCTION TESTING (1 giờ)
*Mục tiêu: Test mọi flow trên production*

#### Checklist Production
- [ ] `https://gimmeidea.com` load đúng
- [ ] Connect wallet trên production → Login thành công
- [ ] Backend API respond (check Network tab)
- [ ] Create project → Lưu vào DB
- [ ] Realtime comments hoạt động
- [ ] Solana transactions thành công (devnet)
- [ ] Solscan links đúng
- [ ] CORS không bị lỗi
- [ ] JWT token persist sau khi F5

---

### PHASE 7: SMART CONTRACT (Tùy chọn - Sau production)
*Mục tiêu: Deploy Anchor program lên Devnet*

#### Step 7.1: Deploy Contract
**Công việc:**
1. ⏳ `cd programs/gimme-idea`
2. ⏳ `anchor build`
3. ⏳ Update `Anchor.toml`:
   ```toml
   [provider]
   cluster = "devnet"
   wallet = "~/.config/solana/id.json"
   ```
4. ⏳ `anchor deploy`
5. ⏳ Copy Program ID

---

#### Step 7.2: Frontend Integration
**Công việc:**
1. ⏳ Install `@coral-xyz/anchor`
2. ⏳ Tạo `lib/anchor-client.ts` để gọi program
3. ⏳ Update PaymentModal để dùng bounty escrow

**Test:** Lock bounty → Release khi accept feedback

---

## 📊 Timeline Tổng Thể

| Phase | Thời gian | Output |
|-------|-----------|--------|
| **Phase 1: Local Integration** | 1-2 ngày | Frontend + Backend hoạt động localhost |
| **Phase 2: Solana Transactions** | 1 ngày | Real transactions thay vì fake |
| **Phase 3: Polish & Testing** | 1 ngày | Stable, no critical bugs |
| **Phase 4: Backend Deploy** | 30 phút | Backend live trên Railway |
| **Phase 5: Frontend Deploy** | 30 phút | Frontend live trên gimmeidea.com |
| **Phase 6: Production Testing** | 1 giờ | End-to-end production test |
| **Phase 7: Smart Contract** | 1-2 ngày | Bounty escrow on-chain |

**TỔNG CỘNG: 3-5 ngày** để có production app hoàn chỉnh (không tính smart contract)

---

## ⚠️ Các Lưu Ý Quan Trọng

### 1. Security Checklist
- [ ] `.env` files KHÔNG được push lên GitHub
- [ ] JWT_SECRET phải random và khác giữa dev/production
- [ ] CORS chỉ allow domain chính thức
- [ ] Supabase RLS (Row Level Security) đã enable
- [ ] Rate limiting cho API (tránh spam)

### 2. Performance Checklist
- [ ] Images optimize (Next.js Image component)
- [ ] API responses có caching headers
- [ ] Realtime subscriptions cleanup khi unmount
- [ ] Database indexes cho các query thường xuyên

### 3. Monitoring (Sau production)
- [ ] Backend logs (Railway có built-in)
- [ ] Frontend errors (Vercel Analytics)
- [ ] Supabase usage metrics
- [ ] Transaction success rate

---

## 🎯 HÀNH ĐỘNG NGAY BÂY GIỜ

**Bước tiếp theo tức thì:**
1. ⏳ Chạy `cd frontend && npm install` (cài dependencies)
2. ⏳ **PHASE 1.1**: Implement real wallet connection
3. ⏳ Test wallet login flow

**Sau khi Phase 1.1 xong:**
→ Tiếp tục Phase 1.2, 1.3, 1.4 tuần tự
→ Không skip steps (mỗi step build trên step trước)

---

**Kết luận cuối cùng:**
- ✅ Backend production-ready
- ✅ API client và Realtime client đã tạo
- ⏳ Cần 3-5 ngày để integrate và deploy lên gimmeidea.com
- 🎯 Bắt đầu với **PHASE 1.1: Wallet Connection** ngay bây giờ!
