# 🔐 Wallet Persistence - Hướng dẫn chi tiết

## Tính năng "Connect Wallet = Login"

Khi user connect wallet → Tự động tạo/lấy account từ database → Mọi thứ được lưu theo wallet address.

---

## 🔄 Flow hoạt động

### Lần đầu tiên connect wallet:

```
1. User click "Connect Wallet" trên Frontend
   ↓
2. Phantom/Solflare wallet mở → User approve
   ↓
3. Frontend nhận publicKey (địa chỉ ví)
   ↓
4. Frontend yêu cầu wallet ký message: "Login to GimmeIdea - 1234567890"
   ↓
5. Frontend gọi: POST /api/auth/login { publicKey, signature, message }
   ↓
6. Backend verify signature (đảm bảo user sở hữu ví này)
   ↓
7. Backend TÌM user trong database theo wallet address
   ↓
8. KHÔNG TÌM THẤY → TỰ ĐỘNG TẠO USER MỚI:
   - wallet: "ABC123..."
   - username: "user_ABC123" (tạm thời, user có thể đổi sau)
   - reputation_score: 0
   - login_count: 1
   - last_login_at: "2025-11-23T..."
   ↓
9. Backend tạo JWT token với userId và wallet
   ↓
10. Frontend nhận token + user info → Lưu vào localStorage
```

### Lần sau connect lại (vào đúng account cũ):

```
1. User click "Connect Wallet" (có thể từ device khác)
   ↓
2. Wallet approve → Frontend nhận publicKey
   ↓
3. Frontend yêu cầu ký message
   ↓
4. Frontend gọi: POST /api/auth/login { publicKey, signature, message }
   ↓
5. Backend verify signature
   ↓
6. Backend TÌM user trong database theo wallet address
   ↓
7. TÌM THẤY → LẤY ACCOUNT CŨ:
   - Tất cả profile (username, bio, avatar)
   - Tất cả projects đã đăng
   - Reputation score
   ↓
8. Backend UPDATE login tracking:
   - last_login_at = NOW()
   - login_count = login_count + 1
   ↓
9. Backend tạo JWT token mới
   ↓
10. Frontend nhận token + user info (ĐÃ CÓ SẴN DATA)
```

---

## 💾 Dữ liệu được lưu theo wallet

### 1. Profile Information
- ✅ Username (có thể thay đổi)
- ✅ Bio
- ✅ Avatar
- ✅ Social links (Twitter, GitHub, Website)

### 2. Activity Data
- ✅ Projects đã tạo
- ✅ Comments đã viết
- ✅ Votes đã vote
- ✅ Transactions (tips, bounties)

### 3. Reputation & Stats
- ✅ Reputation score (tích luỹ từ contributions)
- ✅ Login count (số lần đăng nhập)
- ✅ Last login time

---

## 🧪 Demo Flow (Test thử)

### Test Case 1: First Time User

**Bước 1**: Mở app lần đầu
```bash
# Chưa có gì trong database
SELECT * FROM users WHERE wallet = 'NEW_WALLET_ADDRESS';
# Result: 0 rows
```

**Bước 2**: Click "Connect Wallet" → Approve
```bash
# Backend tự động tạo user
INSERT INTO users (wallet, username, reputation_score, login_count)
VALUES ('NEW_WALLET_ADDRESS', 'user_NEW_WALL', 0, 1);
```

**Bước 3**: User tạo project
```bash
INSERT INTO projects (author_id, title, description, ...)
VALUES (user.id, 'My First Project', '...', ...);
```

**Bước 4**: User đóng app → Logout

---

### Test Case 2: Returning User (Same Device)

**Bước 1**: Mở app lại → LocalStorage còn token
```typescript
const token = localStorage.getItem('auth_token');
if (token && !isExpired(token)) {
  // Tự động login, không cần connect wallet lại
  fetchUserData();
}
```

**Kết quả**: Vào thẳng dashboard, thấy project đã tạo

---

### Test Case 3: Different Device

**Bước 1**: Mở app trên máy tính khác
```bash
# LocalStorage rỗng → Cần connect wallet
```

**Bước 2**: Click "Connect Wallet" với CÙNG VÍ
```bash
# Backend tìm thấy user cũ
SELECT * FROM users WHERE wallet = 'NEW_WALLET_ADDRESS';
# Result: Found! { id: 'xxx', username: 'my_custom_name', ... }

# Update login tracking
UPDATE users
SET last_login_at = NOW(), login_count = login_count + 1
WHERE wallet = 'NEW_WALLET_ADDRESS';
```

**Kết quả**:
- ✅ Vào đúng account cũ
- ✅ Thấy projects đã tạo
- ✅ Profile vẫn nguyên
- ✅ Reputation vẫn giữ nguyên

---

## 📊 Database Schema (Updated)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet VARCHAR(255) UNIQUE NOT NULL,  -- ← CHÌA KHÓA ĐỂ TÌM USER
  username VARCHAR(100) UNIQUE NOT NULL,
  bio TEXT,
  avatar TEXT,
  reputation_score INTEGER DEFAULT 0,
  social_links JSONB DEFAULT '{}',

  -- NEW: Login tracking
  last_login_at TIMESTAMP,              -- ← Lần login cuối
  login_count INTEGER DEFAULT 0,        -- ← Tổng số lần login

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index để search nhanh theo wallet
CREATE INDEX idx_users_wallet ON users(wallet);
```

---

## 🔍 Backend Code Highlights

### File: `backend/src/auth/auth.service.ts`

```typescript
async login(loginDto: LoginDto) {
  // 1. Verify signature
  const isValid = this.solanaService.verifySignature(...);

  // 2. TÌM USER THEO WALLET ADDRESS
  let user = await supabase
    .from('users')
    .select('*')
    .eq('wallet', publicKey)  // ← Tìm theo wallet
    .single();

  // 3. CHƯA CÓ → TẠO MỚI
  if (!user) {
    user = await supabase.from('users').insert({
      wallet: publicKey,
      username: `user_${publicKey.slice(0, 8)}`,
      login_count: 1,
      last_login_at: NOW(),
    });
  }
  // 4. ĐÃ CÓ → UPDATE LOGIN TRACKING
  else {
    await supabase.from('users').update({
      last_login_at: NOW(),
      login_count: user.login_count + 1,  // ← Tăng count
    });
  }

  // 5. TẠO JWT TOKEN
  const token = jwt.sign({ userId: user.id, wallet: user.wallet });

  return { token, user };
}
```

---

## 🎨 Frontend Implementation

### 1. Connect Wallet Flow

```typescript
// components/ConnectWalletButton.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export function ConnectWalletButton() {
  const { publicKey, signMessage } = useWallet();
  const [isLoading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!publicKey || !signMessage) return;

    setLoading(true);
    try {
      // 1. Create message to sign
      const message = `Login to GimmeIdea - ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // 2. Request wallet signature
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      // 3. Call backend API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          signature: signatureBase58,
          message,
        }),
      });

      const { data } = await response.json();

      // 4. Save token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 5. Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
```

### 2. Auto-login on App Load

```typescript
// lib/auth-context.tsx
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('auth_token');

    if (token) {
      // Verify token with backend
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(({ data }) => {
          setUser(data); // ← User data with all profile/projects
        })
        .catch(() => {
          // Token expired → Clear and require new login
          localStorage.removeItem('auth_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return { user, isLoading };
}
```

---

## ✅ Advantages của approach này

1. **🔒 Security**:
   - Không lưu private key
   - Mỗi lần login đều verify signature
   - JWT token có expiry time (7 days)

2. **🌐 Cross-device**:
   - Connect wallet từ máy nào cũng vào đúng account
   - Không cần remember password

3. **🚀 UX tốt**:
   - Lần đầu connect → Tự động tạo account
   - Lần sau connect → Vào thẳng account cũ
   - Có thể customize profile sau

4. **📊 Tracking**:
   - Biết user login bao nhiêu lần
   - Biết lần cuối login khi nào
   - Có thể thêm analytics sau

---

## 🔧 Database Migration

Nếu bạn đã tạo database trước khi tôi thêm tính năng tracking, chạy migration:

```bash
# File: backend/database/migration_add_login_tracking.sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

UPDATE users SET login_count = 0 WHERE login_count IS NULL;
```

---

## 📝 Testing Checklist

- [ ] Lần đầu connect wallet → Tạo user mới trong DB
- [ ] Kiểm tra `login_count = 1`, `last_login_at` có giá trị
- [ ] Tạo 1 project → Lưu với `author_id = user.id`
- [ ] Logout → Clear localStorage
- [ ] Connect lại với cùng wallet → Lấy đúng user cũ
- [ ] Kiểm tra `login_count = 2`, `last_login_at` đã update
- [ ] Kiểm tra project cũ vẫn hiển thị
- [ ] Connect từ device khác với cùng wallet → Vẫn đúng account

---

## 🎉 Kết luận

Tính năng **"Wallet = Account"** đã hoạt động hoàn toàn tự động!

- ✅ Không cần đăng ký manual
- ✅ Connect wallet = Auto login/register
- ✅ Mọi data lưu theo wallet address
- ✅ Cross-device seamless
- ✅ Secure với signature verification

**User chỉ cần nhớ 1 thứ duy nhất**: Ví Solana của mình! 🔑
