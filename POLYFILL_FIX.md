# Fix for "global is not defined" Error on Vercel

## Vấn đề
Khi deploy trên Vercel với account mới, ứng dụng bị lỗi:
```
ReferenceError: global is not defined
Unable to set window.solana, try uninstalling Phantom
```

Lỗi này xảy ra vì các thư viện Solana wallet (như `@solana/web3.js`, wallet adapters) cần các biến global của Node.js (`global`, `Buffer`, `process`) nhưng chúng không tồn tại trong môi trường browser.

## Giải pháp đã áp dụng

### 1. Cập nhật `next.config.js`
Thêm webpack polyfills để tự động inject các Node.js modules vào browser environment:
- Thêm fallbacks cho: `buffer`, `crypto`, `stream`, `process`, `zlib`, `util`, `assert`
- Sử dụng `webpack.ProvidePlugin` để tự động inject `Buffer` và `process` vào mọi module

### 2. Cài đặt các polyfill packages
Đã thêm vào `package.json`:
```json
"buffer": "^6.0.3",
"process": "^0.11.10",
"crypto-browserify": "^3.12.0",
"stream-browserify": "^3.0.0",
"browserify-zlib": "^0.2.0",
"util": "^0.12.5",
"assert": "^2.1.0"
```

### 3. Cải thiện inline polyfill trong `layout.tsx`
Đảm bảo `window.global` và `window.process` được set đồng bộ TRƯỚC KHI các bundle scripts được load.

### 4. Làm sạch `ClientLayout.tsx` và `globals-polyfills.ts`
Loại bỏ các async polyfills không cần thiết vì đã được xử lý ở webpack level.

## Các file đã thay đổi
1. `frontend/next.config.js` - Thêm webpack config cho polyfills
2. `frontend/package.json` - Thêm polyfill dependencies
3. `frontend/app/layout.tsx` - Cải thiện inline script polyfills
4. `frontend/app/ClientLayout.tsx` - Loại bỏ async polyfills
5. `frontend/app/globals-polyfills.ts` - Update comments

## Cách deploy
1. Commit và push các thay đổi lên GitHub
2. Vercel sẽ tự động rebuild
3. Kiểm tra xem app có chạy được không

## Testing locally (optional)
Nếu muốn test local trước khi deploy:
```bash
cd frontend
rm -rf .next
npm run build
npm start
```

Sau đó mở browser và kiểm tra console không còn lỗi "global is not defined".