
# Gimme Idea - Solana Feedback Platform

## 1. Giới thiệu dự án
**Gimme Idea** là nền tảng phi tập trung giúp các lập trình viên Solana nhận phản hồi (feedback) chất lượng từ cộng đồng, audit code và nhận thưởng (bounty) bằng USDC.
- Đã mua domain gimmeidea.com bằng godaddy

---

## 2. Kiến trúc Backend & Database (Tech Stack Recommended)

Để Backend khớp hoàn toàn với Frontend hiện tại, đề xuất stack sau:

*   **Runtime:** Node.js (TypeScript).
*   **Framework:** **NestJS** (Cấu trúc chặt chẽ, dễ scale) hoặc **Express** (Nhanh gọn).
*   **Database:** **PostgreSQL** (Dùng **Prisma ORM** để map type với Frontend).
*   **Realtime:** **Socket.io** (cho Comments/Notifications) hoặc dùng **Supabase Realtime**.

---

## 3. 🗺️ API Specification (Map UI to Backend)

Đây là danh sách chính xác các nút bấm trên Frontend và API Backend cần thiết để phục vụ nó.

### A. Authentication (Xác thực Ví)
| UI Element | Hành động Frontend | Backend Endpoint | Method | Nhiệm vụ Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Nút "Connect Wallet"** | 1. Wallet Adapter connect<br>2. User ký message "Login to GimmeIdea" | `/auth/login` | `POST` | Verify chữ ký Solana. Nếu đúng -> Tạo/Lấy User từ DB -> Trả về JWT Token. |
| **App Init (F5 trang)** | Kiểm tra user còn phiên đăng nhập không | `/auth/me` | `GET` | Trả về thông tin User hiện tại dựa trên JWT gửi lên. |

### B. Projects (Dự án)
| UI Element | Hành động Frontend | Backend Endpoint | Method | Nhiệm vụ Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Trang Dashboard** | Load danh sách dự án (có Filter/Search) | `/projects` | `GET` | Query DB. Hỗ trợ params: `?category=DeFi&search=keyword&limit=10`. |
| **Trang Detail** | Xem chi tiết 1 dự án | `/projects/:id` | `GET` | Trả về info dự án + danh sách Comments (nested). |
| **Nút "Launch Project"** | Submit form upload dự án mới | `/projects` | `POST` | Validate input (Zod). Lưu vào DB. |
| **Nút Edit (Pencil)** | Sửa thông tin dự án | `/projects/:id` | `PATCH` | Cập nhật DB. Chỉ cho phép nếu `user.id == project.authorId`. |
| **Nút Delete (Trash)** | Xóa dự án | `/projects/:id` | `DELETE` | Soft delete hoặc Hard delete. Chỉ chủ dự án mới được xóa. |
| **Nút Vote (ThumbsUp)** | Vote cho dự án | `/projects/:id/vote` | `POST` | Tăng count vote. Lưu vào bảng `ProjectVotes` để chặn spam vote. |

### C. Interactions (Tương tác xã hội) - **Cần Realtime**
| UI Element | Hành động Frontend | Backend Endpoint | Method | Nhiệm vụ Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Nút "Send" (Comment)** | Post bình luận | `/comments` | `POST` | Lưu comment. **Emit Socket event** để update UI người khác ngay lập tức. |
| **Nút "Reply"** | Trả lời bình luận | `/comments/:id/reply` | `POST` | Lưu reply (parentCommentId). |
| **Like Comment** | Like bình luận | `/comments/:id/like` | `POST` | Tăng like count. |

### D. User Profile
| UI Element | Hành động Frontend | Backend Endpoint | Method | Nhiệm vụ Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Trang Profile User** | Xem profile người khác | `/users/:username` | `GET` | Lấy info public + list projects của họ. |
| **Nút "Save Changes"** | Cập nhật Profile (Bio, Socials) | `/users/profile` | `PATCH` | Update thông tin user hiện tại. |

---

## 4. 💸 Quy trình Transaction Thật & Solscan Link (Thay thế Random)

Hiện tại `PaymentModal.tsx` đang fake hash. Để làm thật, bạn cần sửa luồng như sau:

### Logic Frontend (React + @solana/web3.js)
Không bao giờ gửi Private Key lên Backend. Frontend tự xử lý việc chuyển tiền.

**Bước 1: Trigger Wallet trên Frontend**
```typescript
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

// Trong PaymentModal.tsx
const handlePayment = async () => {
    if (!publicKey || !signTransaction) return;

    try {
        // 1. Tạo Transaction chuyển SOL (hoặc tạo Instruction chuyển SPL Token USDC)
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(recipientWalletAddress), // Lấy từ DB backend trả về
                lamports: amount * LAMPORTS_PER_SOL, // Ví dụ chuyển SOL
            })
        );

        // 2. Gửi lệnh lên mạng Solana qua Ví user
        const signature = await sendTransaction(transaction, connection);
        
        // 3. Confirm Transaction (Chờ mạng xác nhận)
        await connection.confirmTransaction(signature, 'processed');

        // 4. CÓ LINK THẬT Ở ĐÂY
        const realSolscanLink = `https://solscan.io/tx/${signature}?cluster=devnet`;
        console.log("Link thật:", realSolscanLink);

        // 5. GỌI BACKEND ĐỂ RECORD (Quan trọng)
        await saveTransactionToBackend(signature, amount);
        
    } catch (error) {
        console.error("User từ chối hoặc lỗi mạng:", error);
    }
};
```

**Bước 2: Gọi Backend để Verify**
Sau khi Frontend có `signature` thật, gọi API:
*   **Endpoint:** `POST /payments/verify`
*   **Body:** `{ txHash: "signature_vừa_tạo...", projectId: "...", amount: 10 }`

**Bước 3: Backend Verification**
Backend không được tin client ngay. Backend phải:
1.  Dùng `connection.getTransaction(txHash)` kiểm tra trên Blockchain.
2.  Check xem `receiver` có đúng là ví dự án không? Số tiền `amount` có đúng không?
3.  Nếu đúng -> Lưu vào DB -> Cộng điểm Reputation cho User.

---

## 5. Làm sao để Build Backend "Match" 100% với Frontend?

Để tránh việc Frontend gọi API mà Backend trả về thiếu trường, hoặc sai kiểu dữ liệu (ví dụ Frontend cần `projects` là mảng, Backend trả về object), hãy dùng kỹ thuật **Shared Types**.

### Cách làm (Monorepo hoặc Copy file):
1.  Tạo file `types.ts` (giống file `lib/types.ts` ở Frontend hiện tại).
2.  Backend import file này vào Controller.

**Ví dụ code Backend (NestJS/Express):**

```typescript
// backend/src/types.ts (Copy từ frontend)
export interface Project {
  id: string;
  title: string;
  // ...
}

// backend/src/projects.controller.ts
import { Project } from './types';

// Hàm trả về bắt buộc phải đúng kiểu Project
const getProject = (id: string): Project => {
  const dbData = db.find(...);
  
  // Trình biên dịch TS sẽ báo lỗi ngay nếu bạn quên map trường 'bounty' hay 'tags'
  return {
      id: dbData.id,
      title: dbData.name, // Map từ DB name -> title
      stage: dbData.status,
      tags: dbData.tags || [], // Đảm bảo không bị null
      // ...
  };
}
```

## 6. Checklist Deploy
1.  **Frontend:** Vercel (Next.js).
2.  **Backend:** Render / Railway / AWS.
3.  **Database:** Neon (Postgres Serverless) hoặc Supabase.
4.  **Blockchain:** Devnet (để test) -> Mainnet (khi chạy thật).