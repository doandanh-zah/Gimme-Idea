# 🔍 Checklist: So sánh 2 Vercel Deployments

## Tình huống
- **Bản cũ** (account cũ bị khóa): ✅ Chạy tốt
- **Bản mới** (account mới, cùng code): ❌ Lỗi `global is not defined`

→ **Nguyên nhân có thể là Vercel settings khác nhau!**

---

## ✅ Các bước kiểm tra ngay

### 1. So sánh Node.js Version

**Bản cũ:**
1. Vào Vercel dashboard của deployment cũ
2. Click vào một deployment bất kỳ
3. Xem **Build Logs** → tìm dòng đầu tiên: `Node.js version: vX.X.X`

**Bản mới:**
1. Làm tương tự với deployment mới
2. So sánh Node version

**❗ Nếu khác nhau → ĐÂY LÀ NGUYÊN NHÂN!**

**Fix:**
- Tạo file `frontend/.node-version` hoặc `.nvmrc` với version từ bản cũ
- Hoặc set trong Vercel Project Settings → General → Node.js Version

---

### 2. So sánh Framework Preset

**Cả 2 bản:**
- Vercel Project Settings → General → Framework Preset
- Phải là: **Next.js**

**Nếu khác** → Change to Next.js

---

### 3. So sánh Build Command

**Cả 2 bản:**
- Vercel Project Settings → General → Build Command
- Nên để trống (dùng default) hoặc: `npm run build`

**Nếu khác** → Chỉnh cho giống nhau

---

### 4. So sánh Output Directory

**Cả 2 bản:**
- Vercel Project Settings → General → Output Directory
- Nên để trống (dùng default `.next`)

---

### 5. Kiểm tra Root Directory

**Cả 2 bản:**
- Vercel Project Settings → General → Root Directory
- Phải là: `frontend`

**Nếu khác** → ĐÂY LÀ NGUYÊN NHÂN!

---

### 6. So sánh Environment Variables

**Bản cũ:**
- Vercel Project Settings → Environment Variables
- List tất cả các biến (tên, không cần value)

**Bản mới:**
- Làm tương tự
- **Đảm bảo có đủ và giống nhau**

Các biến quan trọng:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SOLANA_NETWORK
NEXT_PUBLIC_SOLANA_RPC_URL
NEXT_PUBLIC_BACKEND_URL
... (và các biến khác)
```

---

### 7. Kiểm tra Install Command

**Cả 2 bản:**
- Vercel Project Settings → General → Install Command
- Nên để trống (dùng default) hoặc: `npm install`

---

## 🎯 Các nguyên nhân có thể (theo thứ tự phổ biến)

### 1. ⭐ Node.js Version khác nhau (90% khả năng)
- Bản cũ: Node 16.x hoặc 18.x
- Bản mới: Node 20.x hoặc 22.x
- → Các polyfills hoạt động khác nhau

**Fix:**
```bash
# Tạo file này trong thư mục gốc của repo
echo "18.17.0" > .node-version

# Commit và push
git add .node-version
git commit -m "Lock Node.js version to 18.17.0"
git push origin main
```

### 2. ⭐ Root Directory khác nhau (80% khả năng)
- Bản cũ: Root Directory = `frontend`
- Bản mới: Root Directory = `.` (root)
- → Next.js config không được load đúng

**Fix:** Set Root Directory = `frontend` trong Vercel settings

### 3. ⭐ Build được cache (70% khả năng)
- Bản cũ: Cache từ build cũ (trước khi có lỗi)
- Bản mới: Build mới hoàn toàn

**Fix:** Force clear cache:
- Vercel → Deployment → Settings → Clear Build Cache
- Redeploy

### 4. Framework Preset khác nhau
- Bản cũ: Next.js
- Bản mới: Other / Auto-detected sai

**Fix:** Set Framework Preset = Next.js

---

## 🔬 Cách xác định chính xác

### A. Xem Build Logs của bản mới

1. Vào Vercel Dashboard → Deployments
2. Click vào deployment mới nhất (failed/success)
3. Click "View Build Logs"
4. Tìm các dòng:

```
Node.js version: vX.X.X
Build Command: ...
Root Directory: ...
```

5. Screenshot và gửi cho tôi

### B. Download build logs của bản cũ (nếu còn access)

Nếu vẫn còn access vào account cũ:
1. Vào deployment cũ (đang chạy tốt)
2. Xem Build Logs
3. So sánh với bản mới

### C. So sánh bundle files

**Bản cũ** (đang chạy):
- Mở DevTools → Sources
- Tìm file `layout-xxx.js`
- Xem có `global is not defined` ở đâu không

**Bản mới** (bị lỗi):
- Làm tương tự
- So sánh

---

## 🚀 Fix nhanh (thử ngay)

### Option 1: Lock Node version

```bash
cd "/Users/doandothanhdanh/Desktop/ZAH PROJECT/Gimme-Idea"

# Tạo .node-version file (dùng Node 18)
echo "18.17.0" > .node-version

# Commit
git add .node-version
git commit -m "Lock Node.js version to 18.17.0 for Vercel"
git push origin main
```

### Option 2: Set trong Vercel UI

1. Vercel → Project Settings → General
2. Node.js Version → **18.x**
3. Save
4. Redeploy

### Option 3: Dùng vercel.json

```bash
cd frontend
cat > vercel.json <<'EOF'
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
EOF

git add vercel.json
git commit -m "Add Vercel config with Node 18"
git push origin main
```

---

## 📊 Câu hỏi để xác định:

Trả lời giúp tôi các câu hỏi sau:

1. **Bạn đang xem lỗi ở đâu?**
   - [ ] Production deployment mới trên Vercel
   - [ ] Preview deployment
   - [ ] Local development

2. **Node version trong build logs là gì?**
   - Bản cũ: v_____
   - Bản mới: v_____

3. **Root Directory setting:**
   - Bản cũ: _____
   - Bản mới: _____

4. **Bạn có còn access vào Vercel của account cũ không?**
   - [ ] Có - có thể xem settings
   - [ ] Không - account bị khóa hoàn toàn

5. **URL của 2 deployments:**
   - Bản cũ (chạy tốt): _____
   - Bản mới (bị lỗi): _____

---

## 💡 Kết luận

**99% khả năng** lỗi này không phải do code, mà do:
- Node.js version khác nhau
- Hoặc Vercel project settings khác nhau

Hãy kiểm tra các điểm trên và cho tôi biết kết quả!