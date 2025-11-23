
# Gimme Idea - Solana Feedback Platform

## 1. Giới thiệu
**Gimme Idea** là nền tảng phi tập trung giúp các lập trình viên Solana nhận phản hồi (feedback) chất lượng từ cộng đồng, audit code và nhận thưởng (bounty) bằng USDC.

---

## 2. Cấu trúc Frontend & Tech Stack

Dự án này (`/frontend`) được xây dựng bằng các công nghệ mới nhất:

*   **Framework:** Next.js 14 (App Router).
*   **Language:** TypeScript.
*   **Styling:** Tailwind CSS + Custom Animations.
*   **Hiệu ứng:** Framer Motion.
*   **State Management:** Zustand (Quản lý ví, user, data tạm).
*   **Web3 Integration:** `@solana/web3.js`, `@solana/wallet-adapter-react`.

### Cấu trúc thư mục Frontend
*   `app/`: Chứa các trang (Pages) theo cơ chế Routing của Next.js.
*   `components/`: Các thành phần giao diện tái sử dụng (Navbar, ProjectCard, Modal...).
*   `lib/`: Chứa logic xử lý dữ liệu (`store.ts`) và định nghĩa kiểu dữ liệu (`types.ts`).
*   `constants.ts`: **QUAN TRỌNG** - Chứa toàn bộ Mock Data.

---

## 3. Quản lý Mock Data (Dữ liệu giả)

Hiện tại ứng dụng chưa có Backend, toàn bộ dữ liệu được fix cứng (hardcoded).

### Vị trí Mock Data
File: `frontend/constants.ts`
*   `PROJECTS`: Danh sách các dự án hiển thị trên Dashboard.
*   `JOURNEY_STEPS`: Các bước hiển thị ở trang chủ.
*   `CHART_DATA`: Dữ liệu biểu đồ thống kê.

### Cách thay thế bằng dữ liệu thật
Khi tích hợp Backend, bạn cần làm như sau:
1.  Xóa nội dung trong `constants.ts`.
2.  Trong `lib/store.ts`, thay vì gán `projects: PROJECTS`, hãy viết `Async Thunk` hoặc `useEffect` để fetch API từ Backend và cập nhật vào Store.

### Các vị trí đang dùng Random/Fake Logic (Cần sửa)
1.  **Kết nối ví (`lib/store.ts` - hàm `connectWallet`):**
    *   *Hiện tại:* Dùng `setTimeout` giả lập delay và set một user ảo.
    *   *Cần sửa:* Tích hợp `WalletMultiButton` của Solana Adapter để lấy Public Key thật.
2.  **Thanh toán/Tipping (`components/PaymentModal.tsx`):**
    *   *Hiện tại:* Tạo Transaction Hash giả bằng `Math.random()`.
    *   *Cần sửa:* Gọi hàm `connection.sendTransaction()` để thực hiện chuyển SPL Token (USDC) on-chain.
3.  **Upload Project (`components/UploadProject.tsx`):**
    *   *Hiện tại:* Chỉ hiển thị animation thành công và thêm vào State cục bộ.
    *   *Cần sửa:* Gửi POST request lên Backend API.
4.  **Biểu đồ (`components/StatsDashboard.tsx`):**
    *   *Lưu ý:* Biểu đồ ở Landing Page hiện đang fix cứng. Khi số liệu thật thay đổi, bạn cần truyền data mới vào component `Recharts` thì biểu đồ mới chạy theo.

---

## 4. Đặc tả kỹ thuật cho Backend (Backend Specs)

Để ứng dụng chạy được (Production), đội Backend cần xây dựng các API sau:

### A. Authentication (Xác thực)
*   **Method:** SIWS (Sign In With Solana).
*   **API `POST /auth/login`:** Nhận `signature` và `publicKey`. Trả về JWT Token.
*   **API `GET /user/profile`:** Lấy thông tin User (Avatar, Bio, Balance) từ Database.

### B. Core Features (Dự án & Tương tác)
*   **API `GET /projects`:**
    *   Params: `category` (DeFi, NFT...), `stage` (Idea, Mainnet...), `search` (keyword).
    *   Response: JSON danh sách dự án.
*   **API `POST /projects`:**
    *   Body: `title`, `description`, `image_url` (Link IPFS/S3), `bounty_amount`.
*   **API `POST /projects/:id/vote`:** Tăng vote.
*   **API `POST /projects/:id/comments`:** Gửi bình luận.

### C. Database Schema (Gợi ý)
*   **Users Table:** `wallet_address` (PK), `username`, `reputation_score`, `avatar_url`.
*   **Projects Table:** `id`, `author_wallet`, `title`, `description`, `category`, `status`, `bounty_vault_address`.
*   **Comments Table:** `id`, `project_id`, `user_wallet`, `content`, `tip_amount`.

---

## 5. Đặc tả Smart Contract (Solana Program)

Để đảm bảo tính "Web3", cần các Smart Contract sau (Viết bằng Rust/Anchor):

1.  **Simple Tipping (Cơ bản):**
    *   Không cần Contract phức tạp. Dùng Client-side SDK (`@solana/spl-token`) để tạo lệnh chuyển USDC từ ví A sang ví B.
2.  **Bounty Escrow (Nâng cao):**
    *   Chủ dự án gửi tiền vào Contract (Lock).
    *   Khi Feedback được chấp nhận -> Contract tự động mở khóa (Unlock) gửi tiền cho người review.
    *   Điều này giúp tránh việc chủ dự án "bùng" tiền thưởng.

---

## 6. Hướng dẫn Deploy lên Vercel

Dự án Frontend này đã tối ưu cho Vercel.

1.  **Đẩy code lên GitHub:**
    *   Tạo Repo mới.
    *   `git init` -> `git add .` -> `git commit` -> `git push`.
2.  **Kết nối Vercel:**
    *   Vào [vercel.com](https://vercel.com), chọn "Add New Project".
    *   Chọn Repo GitHub của bạn.
    *   **Root Directory:** Chọn `frontend` (Nếu bạn theo cấu trúc thư mục tôi gợi ý).
    *   **Framework Preset:** Next.js.
    *   Nhấn **Deploy**.
3.  **Lưu ý:**
    *   Nếu dùng hình ảnh từ domain ngoài (như Unsplash), nhớ config `images.domains` trong `next.config.js`.

---

## 7. Next Steps (Các bước tiếp theo)

1.  **Frontend:** Thay thế Mock Data bằng API Client (Axios/Fetch).
2.  **Backend:** Dựng Server (NodeJS/NestJS) và Database (PostgreSQL/MongoDB).
3.  **Blockchain:** Viết Anchor Program cho tính năng Escrow Bounty.
