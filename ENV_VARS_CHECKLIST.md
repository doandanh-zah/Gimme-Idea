# 📋 Environment Variables Checklist

## Hướng dẫn copy env vars từ bản cũ sang bản mới

### Bước 1: Lấy env vars từ bản cũ

**Nếu còn access vào Vercel account cũ:**

1. Vào **Vercel Dashboard** (account cũ)
2. Tìm project **Gimme Idea** (bản cũ)
3. Click **Settings** → **Environment Variables**
4. Copy từng variable vào bảng dưới

**Nếu KHÔNG còn access:**
- Có thể lấy từ local `.env` file (nếu có backup)
- Hoặc check git history xem có commit nào có `.env.example`
- Hoặc hỏi teammate/người quản lý account cũ

---

### Bước 2: Checklist các env vars thường dùng

Copy và điền giá trị vào đây, sau đó paste vào Vercel:

#### 🔵 Supabase (Database) - BẮT BUỘC
```
□ NEXT_PUBLIC_SUPABASE_URL=https://_____.supabase.co
□ NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._____
□ SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9._____ (optional)
```

#### 🟢 Backend API - BẮT BUỘC
```
□ NEXT_PUBLIC_BACKEND_URL=https://_____ (hoặc http://localhost:3001 cho dev)
□ NEXT_PUBLIC_API_URL=https://_____ (có thể giống BACKEND_URL)
```

#### 🟡 Solana Blockchain - BẮT BUỘC
```
□ NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta (hoặc devnet)
□ NEXT_PUBLIC_SOLANA_RPC_URL=https://_____ (custom RPC nếu có)
```

#### 🟠 Google Analytics / Tracking (Optional)
```
□ NEXT_PUBLIC_GA_ID=G-_____
□ NEXT_PUBLIC_GTM_ID=GTM-_____ (nếu dùng Google Tag Manager)
```

#### 🔴 Các biến khác (Check trong bản cũ)
```
□ _____=_____
□ _____=_____
□ _____=_____
□ _____=_____
□ _____=_____
```

---

### Bước 3: Add vào Vercel (bản mới)

Cho mỗi variable ở trên:

1. Vào **Vercel Dashboard** (account mới)
2. Project mới → **Settings** → **Environment Variables**
3. Click **Add New**
4. Điền:
   - **Key**: Tên biến (vd: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Giá trị từ bảng trên
   - **Environments**: 
     - ✅ Production (bắt buộc)
     - ✅ Preview (recommended)
     - ⬜ Development (optional)
5. Click **Save**
6. Lặp lại cho tất cả biến

---

### Bước 4: Verify

Sau khi add xong:

1. Count số lượng env vars:
   - Bản cũ: ____ biến
   - Bản mới: ____ biến
   - Phải bằng nhau!

2. Check các biến `NEXT_PUBLIC_*`:
   - Đây là biến public, expose ra client
   - Phải có đủ để app hoạt động

3. Check các biến secret:
   - `SUPABASE_SERVICE_ROLE_KEY` (nếu backend cần)
   - Các API keys khác

---

### 🔍 Cách check env vars từ bản cũ (nếu không có access)

#### Method 1: Check trong Git
```bash
cd "/Users/doandothanhdanh/Desktop/ZAH PROJECT/Gimme-Idea/frontend"
cat .env.example
```

#### Method 2: Check code để suy ra cần biến gì
```bash
cd "/Users/doandothanhdanh/Desktop/ZAH PROJECT/Gimme-Idea/frontend"
grep -r "process.env.NEXT_PUBLIC_" . --include="*.tsx" --include="*.ts" | grep -o "process.env.[A-Z_]*" | sort -u
```

#### Method 3: Check constants file
```bash
cat frontend/constants.ts
cat frontend/lib/supabase.ts
```

---

### 📊 Common Env Vars cho Gimme Idea

Dựa trên codebase, các biến quan trọng:

#### Frontend (Next.js)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Backend
NEXT_PUBLIC_BACKEND_URL=

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

#### Backend (NestJS) - nếu có
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
```

---

### ⚠️ Lưu ý quan trọng

1. **Không commit env vars vào Git!**
   - `.env` đã có trong `.gitignore`
   - Chỉ commit `.env.example` với giá trị placeholder

2. **Biến NEXT_PUBLIC_* là public**
   - Sẽ được expose ra client-side
   - Không để secret keys trong biến này!

3. **Phải match với bản cũ**
   - Cùng database → cùng `SUPABASE_URL`
   - Cùng backend → cùng `BACKEND_URL`

4. **Sau khi thêm env vars**
   - PHẢI redeploy để apply changes
   - Env vars chỉ apply cho build mới

---

### ✅ Checklist cuối cùng

Trước khi redeploy:

- [ ] Node version = 22.x (✅ Done)
- [ ] Đã copy đủ env vars
- [ ] Đã verify số lượng env vars bằng nhau
- [ ] Đã set cho environment: Production
- [ ] Đã save tất cả

→ **Sẵn sàng redeploy!**

---

### 🎯 Expected Timeline

1. Lấy env vars từ bản cũ: **1-2 phút**
2. Add vào bản mới: **2-3 phút**
3. Redeploy: **2-3 phút**
4. Test: **1-2 phút**

**Tổng: ~10 phút**

---

## 🚀 Sau khi hoàn thành

Bản mới sẽ:
- ✅ Chạy trên Node 22.x (match bản cũ)
- ✅ Có đủ env vars (match bản cũ)
- ✅ Không còn lỗi `global is not defined`
- ✅ Phantom wallet hoạt động bình thường
- ✅ Kết nối được database và backend

Chúc may mắn! 🎉