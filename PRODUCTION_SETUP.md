# 🚀 Production Setup Guide

## Frontend đã deploy: https://gimmeidea.com
## Backend đã deploy: https://gimme-idea.onrender.com

---

## ⚠️ VẤN ĐỀ HIỆN TẠI: "Failed to fetch"

Frontend không kết nối được backend vì **2 lỗi**:

### 1. ❌ Vercel chưa có Environment Variable
Frontend production đang dùng `NEXT_PUBLIC_API_URL` mặc định (localhost)

### 2. ❌ Backend CORS chưa cho phép gimmeidea.com
Backend chỉ accept requests từ localhost

---

## 🔧 CÁCH SỬA (THEO THỨ TỰ)

### **Bước 1: Set Environment Variable trên Vercel**

1. Truy cập: https://vercel.com/dashboard
2. Chọn project **gimme-idea** (hoặc tên project của bạn)
3. Vào tab **Settings** → **Environment Variables**
4. Click **Add New**
5. Thêm biến:
   ```
   Key:   NEXT_PUBLIC_API_URL
   Value: https://gimme-idea.onrender.com/api
   ```
6. Chọn **All Environments** (Production, Preview, Development)
7. Click **Save**

### **Bước 2: Redeploy Frontend**

**Cách 1: Tự động (khuyên dùng)**
1. Vào tab **Deployments**
2. Click vào deployment mới nhất
3. Click **"Redeploy"** (3 chấm menu)
4. Chọn **"Redeploy with existing Build Cache"**

**Cách 2: Push code mới**
```bash
git commit --allow-empty -m "Trigger redeploy with env variables"
git push origin test-be
```

---

### **Bước 3: Update Backend CORS**

1. Vào Render Dashboard: https://dashboard.render.com
2. Chọn service **gimme-idea-api**
3. Vào tab **Environment**
4. Tìm biến `CLIENT_URL` (hoặc add nếu chưa có)
5. Update value:
   ```
   CLIENT_URL=https://gimmeidea.com
   ```
6. Click **Save Changes**
7. Render sẽ tự động redeploy (~2-3 phút)

---

### **Bước 4: Đợi Deploy Xong**

**Frontend (Vercel):**
- Deploy time: ~1-2 phút
- Check tại: https://vercel.com/dashboard → Deployments
- Đợi status = "Ready"

**Backend (Render):**
- Deploy time: ~3-5 phút
- Check tại: https://dashboard.render.com
- Đợi status = "Live"

---

## ✅ Kiểm tra sau khi Deploy

### 1. Test Backend API
```bash
curl https://gimme-idea.onrender.com/api/health
```

**Expected response:**
```json
{"success": true, "message": "API is running"}
```

### 2. Test Frontend
1. Mở: https://gimmeidea.com
2. Mở DevTools (F12) → Console tab
3. **Không** còn thấy "Failed to fetch"
4. Click vào tab **Network**
5. API calls phải gọi đến `gimme-idea.onrender.com`

### 3. Test Login Flow
1. Vào https://gimmeidea.com/login
2. Thử đăng ký/đăng nhập
3. Phải thành công và redirect về /dashboard

---

## 🐛 Troubleshooting

### Lỗi: "CORS policy blocked"
**Nguyên nhân:** Backend `CLIENT_URL` chưa đúng

**Fix:**
```bash
# Vào Render → Environment → CLIENT_URL phải là:
CLIENT_URL=https://gimmeidea.com
```

**Lưu ý:** Không có dấu `/` ở cuối!

---

### Lỗi: Frontend vẫn gọi localhost
**Nguyên nhân:** Vercel chưa có env variable hoặc chưa redeploy

**Fix:**
1. Check Vercel → Settings → Environment Variables
2. Phải có: `NEXT_PUBLIC_API_URL=https://gimme-idea.onrender.com/api`
3. Redeploy lại frontend

---

### Lỗi: "Failed to fetch" / Network error
**Nguyên nhân:** Backend sleep (Render free tier)

**Giải pháp:**
- Render free tier sleep sau 15 phút không dùng
- Request đầu tiên sẽ mất ~30 giây để wake up
- Refresh lại trang sau 30 giây

**Fix lâu dài (optional):**
- Dùng cron job ping backend mỗi 10 phút
- Hoặc upgrade lên Render paid plan ($7/month)

---

### Lỗi: Backend trả về 500 Internal Server Error
**Check logs:**
```bash
# Vào Render Dashboard → gimme-idea-api → Logs tab
# Xem lỗi gì
```

**Common issues:**
- Database connection failed → Check `DATABASE_URL`
- JWT secret missing → Check `JWT_SECRET`
- Missing env variables

---

## 📝 Checklist Hoàn Thành

- [ ] Vercel có env variable `NEXT_PUBLIC_API_URL`
- [ ] Frontend đã redeploy
- [ ] Backend có env variable `CLIENT_URL=https://gimmeidea.com`
- [ ] Backend đã redeploy
- [ ] Test API: `curl https://gimme-idea.onrender.com/api/health`
- [ ] Mở https://gimmeidea.com → Không còn "Failed to fetch"
- [ ] Test login/register flow thành công
- [ ] Test browse projects load được data
- [ ] Test create project thành công

---

## 🎉 Nếu tất cả OK:

Congratulations! 🎊 App của bạn đã LIVE:

- **Frontend:** https://gimmeidea.com
- **Backend:** https://gimme-idea.onrender.com/api

Share với bạn bè và nhận feedback thôi! 🚀
