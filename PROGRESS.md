# Gimme Idea V2 — Progress Checklist

> Cập nhật lần cuối: 2026-09-01
> Branch: `rebuild-gimme-idea-v2`  
> Milestone hiện tại: Foundation hoàn thành

## Foundation Milestone

### Specification và brand

- [x] Track `README.md` và `AI_READ_FIRST.md`.
- [x] Chuẩn hóa tài liệu sản phẩm thành `docs/00–08`.
- [x] Loại bỏ bản Frontend Design Brief bị trùng.
- [x] Thêm ERD V1.
- [x] Thêm ADR lựa chọn Drizzle.
- [x] Giữ logo gốc và xác nhận checksum bản web giống tuyệt đối.
- [x] Khóa màu vàng `#FFD700`, tím `#9945FF`, success `#14F195`.
- [x] Dùng Inter và JetBrains Mono.

### Monorepo và toolchain

- [x] Dựng `apps/web`, `apps/api`, `apps/worker`.
- [x] Dựng packages `db`, `contracts`, `ui`, `auth`, `solana`, `config`, `utils`.
- [x] Tạo placeholder `programs/bounty-escrow`.
- [x] Pin Node `22.23.2` và pnpm `10.18.3`.
- [x] Cấu hình Turborepo, strict TypeScript, ESLint và Prettier.
- [x] Thêm environment validation và `.env.example`.
- [x] Thêm Dockerfile cho Web, API và Worker.
- [x] Thêm health/readiness lifecycle và graceful shutdown.

### Database

- [x] Typed Drizzle schema gồm 46 bảng V1.
- [x] Tách migrations theo identity, knowledge, project, bounty, social và research/import/audit.
- [x] Enforce published Idea có đúng một Primary Problem.
- [x] Enforce Bounty thuộc Problem và Project thuộc Idea.
- [x] Lưu money dưới dạng raw numeric units.
- [x] Tách escrow, payout intent và blockchain confirmation khỏi browser state.
- [x] Bounty có `open_to_hiring` typed field và migration tái tạo được.
- [x] Seed 5 Problems và 10 Ideas.
- [x] Seed Previous Attempts, 3 Projects và 10 Discussions.
- [x] Seed 2 Organizations, bounty unfunded, bounty mock-funded và Submissions.
- [x] `supabase db reset` replay thành công từ database trống.
- [x] Seed assertions và domain invariants pass.
- [x] `pnpm db:generate` không còn tạo migration trùng.

### API và Worker

- [x] `GET /health`.
- [x] `GET /ready`.
- [x] `GET /v1/problems/:slug`.
- [x] `GET /v1/ideas/:slug`.
- [x] Stable `ApiError` envelope có `requestId`.
- [x] Problem/Idea detail DTO trả creator identity thật cho feed card.
- [x] Worker có typed job registry và health lifecycle.
- [x] Ghi rõ AI provider, Redis và Solana chưa được cấu hình.
- [x] Không tạo endpoint create/auth/wallet/funding giả.

### Frontend

- [x] `/` redirect sang `/en`.
- [x] Landing song ngữ `/en` và `/vi`.
- [x] Public Problem page đọc dữ liệu thật từ API.
- [x] Public Idea page đọc dữ liệu thật từ API.
- [x] Creator content giữ nguyên ngôn ngữ gốc.
- [x] Landing có procedural R3F scene trên desktop.
- [x] Mobile, reduced-motion và WebGL failure có SVG fallback.
- [x] Anime.js chỉ điều khiển DOM narrative.
- [x] R3F sở hữu toàn bộ scene transforms.
- [x] Canonical HTML và CTA hoạt động khi tắt JavaScript.
- [x] Problem/Idea bundles không tải Three.js.
- [x] Loading, error và not-found experiences.
- [x] Canonical, hreflang và noindex cho not-found state.

### Product frame

- [x] Khung desktop tối đa `1440px`, chia cột trái/giữa/phải theo tỷ lệ `20/55/25`.
- [x] Sidebar trái có logo, Home, Ideas, Problems, Notifications, Following, Saved, Profile và More.
- [x] More mở Landing page, Community và Settings ngay trong khung.
- [x] Nút luôn ghi Post; Ideas/Problems mở đúng composer, Home mở menu chọn loại bài.
- [x] Saved là trang riêng với hai tab URL-driven Bookmarks và Likes; cả hai tab phản ánh tương tác local thật.
- [x] Account manager nằm cuối sidebar với trạng thái guest, account và wallet trung thực.
- [x] Right rail có tìm kiếm và gợi ý từ seeded Problem/Idea thật.
- [x] Home, Ideas và Problems render dữ liệu thật từ API ở cột giữa.
- [x] Post card dùng layout kiểu feed: avatar, tên/@/ngày và Idea/Problem mark ở góc trên bên phải.
- [x] Card giữ title/description, cho gắn ảnh/video local, có hàng action và bounty/job signals có điều kiện ở góc dưới bên phải.
- [x] Home quote post dùng cấu trúc card lồng card: click post ngoài mở thread, click Idea/Problem bên trong mở canonical detail.
- [x] Home thread hỗ trợ comment, reply nhiều tầng, like, bookmark, share, quote post và quote comment ở mức local foundation.
- [x] Quote, comment, media và interaction state được lưu rõ ràng trên thiết bị; chưa giả lập backend/auth persistence.
- [x] Notifications, Following, Community, Profile và Settings có trạng thái foundation rõ ràng.
- [x] Landing page nằm ngoài product frame và dẫn vào app qua Open app.
- [x] Tablet chuyển thành icon rail và ẩn right rail.
- [x] Mobile có top bar, search/menu sheet và bottom dock gồm Home, Ideas, Post, Problems, Profile.
- [x] Menu, popover và dialog hỗ trợ Escape, focus visible và touch target tối thiểu 44px.
- [x] Language switch giữ nguyên route hiện tại khi đổi ngôn ngữ.
- [x] Problem/Idea canonical pages tiếp tục giữ breadcrumb, mục lục và reading width rõ ràng.
- [x] Production build, SSR/no-JavaScript và responsive rendering đã được kiểm tra.

### Quality gates

- [x] `pnpm format:check`.
- [x] `pnpm lint`.
- [x] `pnpm typecheck`.
- [x] Unit và integration tests.
- [x] Production build.
- [x] Playwright: 48/48 tests tại 360px, 768px và 1280px.
- [x] Keyboard, focus, WCAG checks và reduced motion.
- [x] Lighthouse Performance 100 và Accessibility 100.
- [x] LCP 1.16s, CLS 0.033, TBT 54ms trên production build.

## Milestone tiếp theo — Chưa triển khai

- [ ] Authentication và user onboarding.
- [ ] Organization management.
- [ ] Problem/Idea CRUD và draft workflow.
- [ ] Discussion và reply flows có persistence/API/auth (UI local foundation đã có).
- [ ] Funded Bounty prototype.
- [ ] Redis-backed worker queue.
- [ ] AI Researcher provider integration.
- [ ] AI Verifier provider integration.
- [ ] Import/reconciliation execution.
- [ ] Solana wallet verification.
- [ ] Bounty escrow program.
- [ ] Funding, judging, winner selection và payout.
- [ ] Remote Supabase project và deployment pipeline.

## Local runtime

Khi toàn bộ services đang chạy:

- Web đang chạy: `http://localhost:10000`
- Port yêu cầu ban đầu `1000` cần quyền administrator trên macOS vì nhỏ hơn `1024`.
- API health: `http://localhost:3001/health`
- API readiness: `http://localhost:3001/ready`
- Worker health: `http://localhost:3002/health`
- Supabase Studio: `http://localhost:54323`

Kiểm tra nhanh:

```bash
curl http://localhost:3001/ready
curl http://localhost:3002/ready
open http://localhost:10000/en
```

Để bind đúng port `1000`, dừng web hiện tại rồi chạy lệnh sau trong Terminal và xác nhận quyền administrator:

```bash
cd apps/web
sudo env PORT=1000 HOSTNAME=127.0.0.1 \
  API_INTERNAL_URL=http://127.0.0.1:3001 \
  NEXT_PUBLIC_SITE_URL=http://127.0.0.1:1000 \
  "$(command -v node)" .next/standalone/apps/web/server.js
```
