# 🎯 DANH SÁCH ĐẦY ĐỦ ENV VARS CẦN COPY

## Đã phân tích code và tìm ra 6 biến BẮT BUỘC:

### ✅ Các biến PHẢI CÓ (từ code analysis)

```env
# 1. Backend API URL - QUAN TRỌNG NHẤT!
NEXT_PUBLIC_API_URL=http://localhost:3001/api
# Production: https://gimme-idea.onrender.com/api
# Hoặc URL backend của bạn

# 2. Supabase URL - Để kết nối database
NEXT_PUBLIC_SUPABASE_URL=https://_____.supabase.co

# 3. Supabase Anon Key - Để auth và query database
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._____

# 4. Solana RPC URL - Để kết nối blockchain
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
# Hoặc: https://api.mainnet-beta.solana.com (free, slower)

# 5. Solana Network - mainnet hoặc devnet
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# 6. LazorKit Paymaster URL - Cho passkey wallet
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.lazorkit.com/
```

### 🔸 Biến OPTIONAL (nice to have)

```env
# ImgBB API Key - Cho upload ảnh (có default key)
NEXT_PUBLIC_IMGBB_API_KEY=c46f48a848428c48a80fa1fd1db02c96
# Note: Code đã có default key này, nhưng nên dùng key riêng
```

---

## 📋 HƯỚNG DẪN COPY NHANH

### Bước 1: Lấy giá trị từ bản cũ

**Nếu còn access Vercel account cũ:**

1. Vào **Vercel Dashboard** (account cũ)
2. Project → **Settings** → **Environment Variables**
3. Copy 6 giá trị trên:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SOLANA_RPC_URL`
   - `NEXT_PUBLIC_SOLANA_NETWORK`
   - `NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL`

**Nếu KHÔNG còn access:**

Các giá trị có thể suy ra:

```env
# Backend URL - Có thể là:
NEXT_PUBLIC_API_URL=https://gimme-idea.onrender.com/api
# Hoặc check domain bản cũ + /api

# Supabase - Cần lấy từ Supabase Dashboard:
# 1. Vào https://supabase.com/dashboard
# 2. Chọn project
# 3. Settings → API
# 4. Copy URL và anon key

# Solana - Dùng giá trị default:
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# LazorKit - Dùng giá trị default:
NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL=https://kora.lazorkit.com/
```

### Bước 2: Paste vào Vercel (bản mới)

**Cách nhanh nhất:**

1. Vào **Vercel Dashboard** (account mới)
2. Project → **Settings** → **Environment Variables**
3. Paste từng biến một:

```
Key: NEXT_PUBLIC_API_URL
Value: [copy từ bản cũ]
Environment: ✓ Production ✓ Preview

Key: NEXT_PUBLIC_SUPABASE_URL
Value: [copy từ bản cũ]
Environment: ✓ Production ✓ Preview

Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [copy từ bản cũ]
Environment: ✓ Production ✓ Preview

... (lặp lại cho 6 biến)
```

### Bước 3: Verify

Sau khi add xong, check:

- [ ] Tổng cộng: **6 biến** (hoặc 7 nếu có IMGBB_API_KEY)
- [ ] Tất cả đều có environment: Production ✓
- [ ] Không có typo trong tên biến
- [ ] Giá trị không có khoảng trắng thừa

---

## 🔍 So sánh với bản cũ

Bạn nói bản cũ có nhiều hơn 5 biến. Đó có thể là:

### Các biến có thể thiếu (guess):

```env
# Analytics (nếu dùng)
NEXT_PUBLIC_GA_ID=G-65VF8CLCR7

# Google Tag Manager (nếu dùng)
NEXT_PUBLIC_GTM_ID=GTM-XXXXX

# Custom RPC endpoint (nếu dùng)
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key

# Feature flags (nếu có)
NEXT_PUBLIC_ENABLE_FEATURE_X=true

# Backend auth (nếu cần)
NEXT_PUBLIC_BACKEND_AUTH_TOKEN=xxxxx
```

**Cách check chính xác:**

1. Vào bản cũ → Vercel → Settings → Environment Variables
2. Count số lượng: ____ biến
3. List tất cả tên biến
4. So với list ở trên

---

## ⚠️ CHÚ Ý QUAN TRỌNG

### 1. Supabase credentials

Nếu bạn đang dùng **CÙNG database** với bản cũ:
- `NEXT_PUBLIC_SUPABASE_URL` phải **GIỐNG HỆT** bản cũ
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` phải **GIỐNG HỆT** bản cũ

Nếu không, app sẽ không kết nối được database!

### 2. Backend URL

Nếu bạn đang dùng **CÙNG backend** với bản cũ:
- `NEXT_PUBLIC_API_URL` phải **GIỐNG HỆT** bản cũ

### 3. Environment selection

Khi add env var, chọn:
- ✅ **Production** - BẮT BUỘC
- ✅ **Preview** - Recommended (để test PR)
- ⬜ **Development** - Optional (dùng local .env)

---

## 🚀 Timeline

Sau khi add đủ 6-7 biến:

1. **Không cần làm gì thêm** - Vercel đã có Node 22.x (từ commit trước)
2. **Auto-redeploy** sẽ trigger với cấu hình mới
3. **Chờ 2-3 phút** để build
4. **Test** - Mở URL và check console

---

## ✅ Expected Result

Sau khi add env vars và redeploy:

### Build Logs:
```
✓ Node.js version: v22.11.0
✓ Environment variables loaded (6 public vars)
✓ Installing dependencies...
✓ Building...
✓ Compiled successfully
```

### Browser Console:
```
✅ No errors
✅ Supabase connected
✅ Backend API reachable
✅ Phantom wallet works
```

### Features:
- ✅ Login/Register
- ✅ View ideas
- ✅ Create idea
- ✅ Connect wallet
- ✅ Tip với SOL

---

## 📝 Template để copy

Dùng template này để organize:

```
=== ENV VARS FOR VERCEL ===

Bản cũ có: ___ biến
Bản mới cần add: ___ biến

--- Required (6 vars) ---
□ NEXT_PUBLIC_API_URL = _____
□ NEXT_PUBLIC_SUPABASE_URL = _____
□ NEXT_PUBLIC_SUPABASE_ANON_KEY = _____
□ NEXT_PUBLIC_SOLANA_RPC_URL = _____
□ NEXT_PUBLIC_SOLANA_NETWORK = _____
□ NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL = _____

--- Optional (if any) ---
□ NEXT_PUBLIC_IMGBB_API_KEY = _____
□ _____ = _____
□ _____ = _____
□ _____ = _____
□ _____ = _____

--- Added to Vercel ---
[Date: Jan 28] 
Status: □ Pending / ✓ Done
```

---

## 🎯 Action Items

1. [ ] Copy 6 env vars từ bản cũ (hoặc từ Supabase/Backend)
2. [ ] Paste vào Vercel bản mới
3. [ ] Verify số lượng và giá trị
4. [ ] Wait for auto-redeploy (đã có Node 22.x)
5. [ ] Test website

**Estimated time: 5-10 phút**

Sau đó app sẽ chạy ngon như bản cũ! 🎉