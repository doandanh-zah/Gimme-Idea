# Backend Setup Guide

Hướng dẫn chi tiết để setup Backend cho Gimme Idea.

---

## 📋 Yêu cầu

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- Tài khoản **Supabase** (miễn phí)

---

## 🚀 Bước 1: Setup Supabase

### 1.1 Tạo Project mới trên Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng nhập / Đăng ký tài khoản
3. Click **"New Project"**
4. Điền thông tin:
   - **Name**: `gimme-idea`
   - **Database Password**: Tạo password mạnh (lưu lại)
   - **Region**: Chọn gần bạn nhất (Singapore cho VN)
5. Click **"Create new project"** (chờ 2-3 phút)

### 1.2 Chạy Database Schema

1. Sau khi project được tạo, vào **SQL Editor** (menu bên trái)
2. Click **"New query"**
3. Copy toàn bộ nội dung file `backend/database/schema.sql`
4. Paste vào SQL Editor
5. Click **"Run"** (chờ vài giây)
6. Kiểm tra xem có thông báo lỗi không. Nếu thành công, bạn sẽ thấy message "Success"

### 1.3 Tạo Storage Buckets cho Images

1. Vào **Storage** (menu bên trái)
2. Click **"Create a new bucket"**
3. Tạo bucket thứ nhất:
   - **Name**: `project-images`
   - **Public bucket**: ✅ Bật (ON)
   - Click **"Create bucket"**
4. Tạo bucket thứ hai:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Bật (ON)
   - Click **"Create bucket"**

### 1.4 Lấy API Keys

1. Vào **Settings** → **API** (menu bên trái)
2. Copy các thông tin sau:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ BẢO MẬT - chỉ dùng backend)

---

## 🔧 Bước 2: Setup Backend

### 2.1 Install Dependencies

```bash
cd backend
npm install
```

Quá trình install sẽ mất khoảng 1-2 phút. Bạn sẽ thấy khoảng 500+ packages được cài.

### 2.2 Tạo file `.env`

```bash
cp .env.example .env
```

### 2.3 Điền Environment Variables vào `.env`

Mở file `.env` và điền thông tin từ Supabase:

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration (LẤY TỪ SUPABASE SETTINGS → API)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration (TẠO MỘT CHUỖI RANDOM MẠNH)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_abc123xyz

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# CORS Configuration (URL frontend)
FRONTEND_URL=http://localhost:3000
```

**Lưu ý quan trọng:**
- ⚠️ **JWT_SECRET**: Phải thay bằng chuỗi random mạnh (ít nhất 32 ký tự)
- ⚠️ **SUPABASE_SERVICE_KEY**: KHÔNG BAO GIỜ commit lên GitHub
- ✅ **FRONTEND_URL**: Để `http://localhost:3000` khi dev, đổi sang domain thật khi deploy

---

## ▶️ Bước 3: Chạy Backend

### Development Mode (với hot-reload)

```bash
npm run start:dev
```

Bạn sẽ thấy output:
```
🚀 Backend server is running on: http://localhost:3001
📡 API available at: http://localhost:3001/api
🌐 CORS enabled for: http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start:prod
```

---

## 🧪 Bước 4: Test API

### Test Health Check

```bash
curl http://localhost:3001/api/auth/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Auth service is running",
  "timestamp": "2024-11-23T..."
}
```

### Test với Postman / Thunder Client

Import các endpoint sau để test:

**1. Health Check**
```
GET http://localhost:3001/api/auth/health
```

**2. Get All Projects**
```
GET http://localhost:3001/api/projects?limit=10
```

**3. Login (cần Solana signature thật từ Frontend)**
```
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "publicKey": "YOUR_WALLET_PUBLIC_KEY",
  "signature": "SIGNED_MESSAGE_BASE58",
  "message": "Login to GimmeIdea - 1234567890"
}
```

---

## 🔐 Bước 5: Tích hợp với Frontend

### 5.1 Cập nhật Frontend `.env.local`

Trong `frontend/.env.local`, thêm:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2 Test Login Flow

1. Chạy Frontend: `cd frontend && npm run dev`
2. Click "Connect Wallet" trên UI
3. Wallet sẽ yêu cầu ký message
4. Frontend gửi signature lên Backend `/api/auth/login`
5. Backend trả về JWT token
6. Frontend lưu token vào localStorage

---

## 📦 Deployment

### Option 1: Railway (Recommended)

1. Tạo tài khoản [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Chọn repo của bạn
4. **Root Directory**: Chọn `backend`
5. Thêm Environment Variables (copy từ `.env`)
6. Click **"Deploy"**

Railway sẽ tự động:
- Cài dependencies
- Build project
- Deploy và cho bạn URL: `https://your-app.up.railway.app`

### Option 2: Render

1. Tạo tài khoản [render.com](https://render.com)
2. Click **"New"** → **"Web Service"**
3. Connect GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
5. Thêm Environment Variables
6. Click **"Create Web Service"**

### Option 3: Vercel Serverless (Advanced)

Nếu muốn deploy serverless, cần convert sang Vercel Functions format.

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to database"

- Kiểm tra `SUPABASE_URL` và `SUPABASE_ANON_KEY` có đúng không
- Vào Supabase Dashboard → Settings → API để xác nhận keys

### Lỗi: "Invalid signature"

- Đảm bảo Frontend đang gửi đúng format signature (Base58)
- Message phải match chính xác giữa Frontend và Backend

### Lỗi: "CORS error"

- Kiểm tra `FRONTEND_URL` trong `.env`
- Nếu deploy production, cập nhật CORS origins trong `main.ts`

### Lỗi: "Port 3001 already in use"

```bash
# macOS / Linux
lsof -ti:3001 | xargs kill

# Hoặc đổi port trong .env
PORT=3002
```

---

## 📝 API Documentation

Xem file `README.md` trong thư mục `backend/` để biết chi tiết về tất cả endpoints.

### Tóm tắt Endpoints:

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/login` | ❌ | Đăng nhập với Solana wallet |
| GET | `/api/auth/me` | ✅ | Lấy thông tin user hiện tại |
| GET | `/api/projects` | ❌ | Danh sách dự án (có filter) |
| POST | `/api/projects` | ✅ | Tạo dự án mới |
| GET | `/api/projects/:id` | ❌ | Chi tiết dự án |
| PATCH | `/api/projects/:id` | ✅ | Cập nhật dự án |
| DELETE | `/api/projects/:id` | ✅ | Xóa dự án |
| POST | `/api/projects/:id/vote` | ✅ | Vote cho dự án |
| GET | `/api/comments/project/:id` | ❌ | Lấy comments của dự án |
| POST | `/api/comments` | ✅ | Tạo comment |
| POST | `/api/comments/:id/like` | ✅ | Like comment |
| GET | `/api/users/:username` | ❌ | Xem profile user |
| PATCH | `/api/users/profile` | ✅ | Cập nhật profile |
| POST | `/api/payments/verify` | ✅ | Verify transaction |

**Auth**: ✅ = Cần JWT token trong header `Authorization: Bearer <token>`

---

## ✅ Checklist

- [ ] Supabase project đã tạo
- [ ] Database schema đã chạy thành công
- [ ] Storage buckets đã tạo (`project-images`, `avatars`)
- [ ] File `.env` đã tạo và điền đầy đủ
- [ ] `npm install` thành công
- [ ] Backend chạy được: `npm run start:dev`
- [ ] Test health check API thành công
- [ ] Frontend đã cập nhật `NEXT_PUBLIC_API_URL`
- [ ] Test login flow từ Frontend → Backend thành công

---

## 🎉 Hoàn thành!

Backend đã sẵn sàng! Bây giờ bạn có thể:
1. Chạy Frontend và test tích hợp
2. Tạo dự án mới từ UI
3. Test voting, comments, payments
4. Deploy lên production khi đã ổn

Nếu gặp vấn đề, kiểm tra logs trong terminal hoặc Supabase Dashboard → Logs.
