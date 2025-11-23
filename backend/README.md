# Gimme Idea Backend

Backend API cho Gimme Idea - Solana Feedback Platform.

## Tech Stack

- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT + Solana Wallet Signature
- **Blockchain:** Solana (Devnet/Mainnet)

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── auth/                   # Authentication module
│   ├── projects/               # Projects CRUD
│   ├── comments/               # Comments & Realtime
│   ├── users/                  # User profiles
│   ├── payments/               # Payment verification
│   ├── shared/                 # Shared utilities
│   └── common/                 # Guards, decorators, filters
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── package.json
└── tsconfig.json
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Then edit .env with your credentials
```

## Configuration

### 1. Supabase Setup

1. Tạo project mới trên [supabase.com](https://supabase.com)
2. Copy URL và Keys vào file `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

### 2. Database Schema

Chạy SQL scripts trong folder `database/` để tạo tables.

### 3. JWT Secret

Đổi `JWT_SECRET` trong `.env` thành một chuỗi random mạnh.

## Running the API

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

API sẽ chạy tại `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập với Solana wallet
- `GET /auth/me` - Lấy thông tin user hiện tại

### Projects
- `GET /projects` - Danh sách dự án (có filter/search)
- `POST /projects` - Tạo dự án mới
- `GET /projects/:id` - Chi tiết dự án
- `PATCH /projects/:id` - Cập nhật dự án
- `DELETE /projects/:id` - Xóa dự án
- `POST /projects/:id/vote` - Vote cho dự án

### Comments
- `POST /comments` - Tạo comment
- `POST /comments/:id/reply` - Reply comment
- `POST /comments/:id/like` - Like comment

### Users
- `GET /users/:username` - Xem profile user
- `PATCH /users/profile` - Cập nhật profile

### Payments
- `POST /payments/verify` - Verify Solana transaction

## Testing

```bash
# Run tests
npm test

# Test API với curl
curl http://localhost:3001/health
```

## Deployment

Recommend deploy trên:
- **Render** (Free tier, auto-deploy from GitHub)
- **Railway** (Easy setup, supports PostgreSQL)
- **Vercel Serverless Functions** (Nếu muốn serverless)

## Notes

- Sử dụng **Shared Types** từ `frontend/types.ts` để đảm bảo type-safety
- Tất cả API đều trả về format: `{ success: boolean, data?: any, error?: string }`
- Authentication dùng JWT token trong header: `Authorization: Bearer <token>`
