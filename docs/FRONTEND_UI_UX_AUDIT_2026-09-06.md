# Gimme Idea — Audit frontend và phương án sửa UI/UX

Ngày kiểm tra: **06/09/2026**. Đánh giá checkout hiện tại, bao gồm thay đổi chưa commit.

> **Cập nhật 07/09/2026:** xem [bảng tiến độ sửa và bằng chứng kiểm tra](FRONTEND_UI_UX_REMEDIATION_2026-09-07.md). Các phát hiện bên dưới là snapshot audit gốc, không phải kết luận rằng lỗi vẫn còn sau sửa.

**Kết luận:** giao diện có nhận diện màu rõ, nhưng chất lượng trải nghiệm chưa đồng đều. Những điểm cần sửa đầu tiên là tính đúng đắn của hành động, khả năng giữ dữ liệu và trạng thái phản hồi. Typography, mật độ nội dung và cấu trúc responsive cần được chuẩn hóa đồng thời; chỉ chỉnh màu hoặc padding sẽ không giải quyết được các luồng đang đứt.

Theo yêu cầu của chủ dự án, **báo cáo này không dùng Zahlook làm tiêu chuẩn**. Phương án dựa trên tư duy thiết kế độc lập, nguyên tắc Google Material Design, hướng dẫn web.dev và WCAG. Các kích thước đề xuất là quyết định thiết kế cho web Gimme Idea, không được hiểu là mọi con số đều do Google bắt buộc.

## 1. Phạm vi, bằng chứng và giới hạn

- Đã đọc cấu trúc route, ba stylesheet toàn cục, shell, landing, discovery, canonical detail, search, composer, social actions, media, profile, saved, notification, wallet, bounty, submission và reviewer surfaces cùng các adapter dữ liệu liên quan.
- Đã kiểm tra **60 URL bằng HTTP**, gồm route EN/VI, danh sách, detail thật từ API, link hardcode và route không tồn tại. Kết quả máy đọc được: [http-audit.json](../artifacts/frontend-audit-2026-09-06/http-audit.json). HTTP không thực thi JavaScript và không chứng minh thao tác tương tác đã thành công.
- HTTP dùng dịch vụ đã chạy sẵn tại `127.0.0.1:3000` và API `127.0.0.1:3001`; không restart/build lại. Vì vậy bằng chứng HTTP được ghi riêng với nhận định source, không giả định mọi thay đổi chưa commit đã được server đang chạy nạp vào.
- Đã xem ảnh có sẵn [landing desktop](../artifacts/frontend-brand/landing-desktop.png), 1440×1000, và [landing mobile](../artifacts/frontend-brand/landing-mobile.png), 375×812. Hai ảnh có mtime ngày 06/09/2026 lúc 13:18:47 +07:00. Đây là ảnh có sẵn, không phải ảnh mới chụp trong audit; chưa xác minh chúng tương ứng chính xác với toàn bộ working tree.
- Browser runtime báo `No browser is available`, danh sách browser trả `[]`. Chưa chạy walkthrough click/keyboard, screen reader, screenshot responsive mới, Lighthouse, đo INP/LCP/CLS hoặc E2E trong lượt này. Không tuyên bố pixel-perfect, accessibility pass hay tất cả flow đã chạy thực tế.
- Không đăng nhập tài khoản, tạo bài, gửi submission, ký ví hoặc thay đổi dữ liệu sản phẩm. Chỉ tạo báo cáo và bằng chứng HTTP.
- Tài liệu hiện trạng ngày 04/09 đã cũ ở một số điểm: code hiện tại **có** API writes cho Problem/Idea, posts/replies và uploads. Không dùng kết luận “mọi thao tác chỉ local” từ tài liệu cũ để đánh giá hiện trạng.

### Cách đọc phát hiện

- **Mã/HTTP:** hành vi hoặc cấu hình đã xác định từ source; có HTTP bổ sung khi ghi rõ. Không đồng nghĩa đã click tái hiện trên browser.
- **Ảnh + thiết kế:** nhận định thị giác trên ảnh có sẵn, kết hợp thông số CSS; cần chụp lại sau sửa.
- **Rủi ro cần render:** có điều kiện gây lỗi trong code nhưng chưa xác nhận mức độ biểu hiện trên màn hình thật.
- **P1:** sửa trước khi coi flow tương ứng đủ tin cậy cho người dùng. **P2:** ảnh hưởng khả dụng, đọc hiểu, responsive hoặc tính nhất quán. **P3:** hoàn thiện chất lượng thị giác/interaction. Không gắn P0 khi chưa có bằng chứng sự cố nghiêm trọng tương ứng.

## 2. Chuẩn tham chiếu và định hướng

Material nhấn mạnh bố cục thích ứng với không gian và tác vụ, thay vì chỉ thu nhỏ desktop. Áp dụng ở đây bằng cách quyết định khi nào giữ navigation, nội dung và contextual rail. [Google Material — Adaptive layout](https://m3.material.io/foundations/layout/canonical-examples/overview)

Typography cần có vai trò riêng cho display, headline, title, body và label; màu cần tách vai trò nền/chữ và semantic state. Giữ logo, có thể giữ vàng/tím hiện tại, nhưng không buộc mọi phần tử dùng cùng kiểu chữ hoặc cùng mức nhấn. [Google — Typography](https://developer.android.com/design/style/typography.html), [Google — Material theming](https://developer.android.com/codelabs/m3-design-theming)

Google khuyến nghị vùng chạm Android ít nhất 48dp. Với web này, tôi chọn **48×48 CSS px cho điều khiển touch quan trọng** như một mục tiêu ergonomics; dp không phải CSS px trong mọi ngữ cảnh. WCAG 2.2 AA có yêu cầu minimum target 24×24 CSS px với ngoại lệ, nên nút 40px không tự động là lỗi WCAG. [Google — Touch targets](https://support.google.com/accessibility/android/answer/7101858?hl=en), [W3C — Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

State phải giúp phân biệt enabled, hovered, focused, pressed, selected, disabled và loading. Form cần báo lỗi tại trường, giữ nội dung và dẫn người dùng đến chỗ sửa. [Material — States](https://m3.material.io/foundations/interaction/states/overview), [web.dev — Forms](https://web.dev/learn/html/forms)

Chuyển động phải có thể giảm theo tùy chọn hệ điều hành. Khi đo production, mục tiêu Core Web Vitals ở phân vị 75 là LCP ≤2,5 giây, INP ≤200ms, CLS ≤0,1. Đây là **mục tiêu nghiệm thu**, chưa phải kết quả đo của dự án. [web.dev — Reduced motion](https://web.dev/articles/prefers-reduced-motion), [web.dev — Web Vitals](https://web.dev/articles/vitals)

## 3. Danh sách vấn đề và cách sửa

**Tổng: 63 phát hiện — 26 P1, 37 P2.** Đây là các mức ưu tiên do audit đề xuất, không phải điểm chất lượng tự động hoặc 63 lỗi đều đã được click tái hiện.

| Đọc trước        | Lý do                                                                        |
| ---------------- | ---------------------------------------------------------------------------- |
| F01–F03, F17     | Sửa CTA/link sai và mất context của hành trình chính                         |
| F06–F12          | Ngăn mất nội dung, dữ liệu bị bỏ qua, card trùng và media không đọc lại được |
| F13–F16, F25–F28 | Không trình bày trạng thái hoặc thành tích không đúng với người dùng         |
| F29–F35          | Giữ submission/wallet có phản hồi chính xác và trạng thái phục hồi           |
| F36–F50          | Chuẩn hóa hierarchy, kích thước, spacing, responsive và focus                |
| F51–F63          | Hoàn thiện modal, locale, motion, fallback và bằng chứng kiểm thử            |

### A. Flow, hành động và dữ liệu mà giao diện trình bày

#### F01 — CTA tạo Project dẫn tới Project cố định bị 404

- **P1 · Mã + HTTP.** Trong Idea detail, cả `Start a Project` lẫn `View Project` dùng `kitchen-signal-lab`; HTTP route này trả 404. Tên Project hiển thị có thể lấy từ Idea nhưng link lại không theo Project đó. Nguồn: [Idea detail](../apps/web/src/app/[locale]/ideas/[slug]/page.tsx).
- **Hậu quả:** hành động quan trọng nhất sau khi đọc Idea không tạo được build và có thể mở sai thực thể.
- **Sửa:** `View Project` lấy slug của quan hệ Project thật. `Start a Project` mở form tạo mới với `ideaId` và `primaryProblemId`, trả về Project vừa tạo. Nếu chức năng chưa sẵn sàng, thay CTA bằng trạng thái rõ lý do, không trỏ vào mẫu.
- **Nghiệm thu:** thử ít nhất ba Idea khác nhau; liên kết và dữ liệu prefill đúng từng Idea; CTA tạo mới không mở Project của người khác.

#### F02 — Gợi ý tìm kiếm chứa link mẫu không còn tồn tại

- **P1 · Mã + HTTP.** `ProductFrame.suggestions` hardcode Pantry Pulse và hai bounty mẫu. `pantry-pulse-archive` trả 404; hai bounty mẫu trả HTTP 200 dạng stream nhưng chứa `NEXT_HTTP_ERROR_FALLBACK;404`, không có h1 nội dung. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx).
- **Sửa:** suggestions lấy từ cùng catalog/search service; ánh xạ URL qua một route builder. Không dùng slug mẫu trong navigation thật. Khi gợi ý lỗi, cho phép tìm toàn bộ và giữ nguyên từ khóa.
- **Nghiệm thu:** mọi suggestion đang hiển thị mở được thực thể tương ứng; kiểm tra cả stream not-found thay vì chỉ kiểm status 200.

#### F03 — Đề xuất Idea từ Problem làm mất Problem hiện tại

- **P1 · Mã.** CTA Problem không có bounty dẫn tới `/create/idea` không mang slug/id; create event chỉ có `type`. Form chọn Problem chỉ có hai option cố định dù API hiện trả năm Problem. Nguồn: [Problem detail](../apps/web/src/app/[locale]/problems/[slug]/page.tsx), [create-route-notice.tsx](../apps/web/src/components/create-route-notice.tsx), [post-composer.tsx](../apps/web/src/components/post-composer.tsx).
- **Sửa:** truyền `problemId` vào route và composer; hiển thị Problem đã chọn cùng nút đổi. Thay select hardcode bằng tìm Problem có autocomplete, loading, zero result và quyền xem.
- **Nghiệm thu:** từ từng Problem, mở form đã chọn đúng đối tượng; người dùng tìm được toàn bộ Problem công khai được phép liên kết.

#### F04 — Đăng nhập xong không tiếp tục hành động bị chặn

- **P1 · Mã.** `requireAuth` phát event mang action nhưng listener mở dialog bỏ action; sign-in chỉ đóng dialog. Các hành động create/save/discuss không có cơ chế khôi phục intent. Nguồn: [auth.tsx](../apps/web/src/lib/auth.tsx), [product-frame.tsx](../apps/web/src/components/product-frame.tsx).
- **Sửa:** giữ pending intent gồm loại hành động, entity và return URL. Sau login, tiếp tục mở form/destination; với hành động ghi quan trọng chỉ khôi phục màn hình kiểm tra, không tự gửi bài hay tiền.
- **Nghiệm thu:** guest bấm đề xuất Idea → login → trở lại đúng form/Problem; không phải tìm và bấm lại CTA.

#### F05 — Route tạo nội dung phụ thuộc event một lần, thiếu nút mở lại

- **P2 · Mã; thứ tự effect cần browser.** `CreateRouteNotice` chỉ dispatch trong effect, phần render chỉ có Back. Đóng modal hoặc login chưa mở được composer sẽ để người dùng ở màn giới thiệu không có CTA tiếp tục. Event cũng không phải trạng thái route bền vững. Nguồn: [create-route-notice.tsx](../apps/web/src/components/create-route-notice.tsx).
- **Sửa:** ưu tiên form trên route thực; nếu giữ modal, render nút `Tiếp tục tạo` và dùng state/context thay event dễ mất. Refresh route vẫn khôi phục loại nội dung và context.
- **Nghiệm thu:** truy cập trực tiếp, refresh, đóng rồi mở lại, guest login và browser Back đều có đường tiếp tục rõ ràng.

#### F06 — Đóng composer xóa sạch bản đang viết

- **P1 · Mã.** `dismiss()` luôn `reset()`, kể cả Escape và nút X; không có dirty check hoặc draft. Form có nhiều trường dài và media. Nguồn: [post-composer.tsx](../apps/web/src/components/post-composer.tsx).
- **Sửa:** lưu draft theo user/type/context; autosave văn bản với thời điểm lưu. Khi đóng bản chưa lưu, cho `Tiếp tục viết` / `Lưu bản nháp` / `Bỏ bản nháp`. Không reset trước khi kết quả lưu chắc chắn.
- **Nghiệm thu:** nhập nội dung dài, thêm ảnh, nhấn Escape hoặc reload; văn bản có thể phục hồi và trạng thái tệp được giải thích, không mất im lặng.

#### F07 — Form thu thập dữ liệu nhưng payload không lưu đầy đủ

- **P1 · Mã.** Composer thu `extraDetails`, industry, region, evidence, risks, whyNow… nhưng `createLocalKnowledgePost` không ánh xạ `details.extra` vào API. Problem gửi `evidence: []`, `constraints: []`; Idea gửi `targetUsers: []`, `risks: []`. Bounty amount/hiring chỉ vào bản cache local. Nguồn: [post-composer.tsx](../apps/web/src/components/post-composer.tsx), [social.ts](../apps/web/src/lib/social.ts).
- **Sửa:** lập mapping từng field UI → contract → database → read DTO → detail. Trường chưa hỗ trợ phải ẩn hoặc ghi rõ là draft, không đưa vào flow xuất bản như đã được lưu. Tách thiết lập bounty sang bước sau xuất bản Problem.
- **Nghiệm thu:** nhập giá trị khác nhau vào mọi field; mở bản đã đăng trên session khác, dữ liệu vẫn đúng. Không chỉ assert title/summary.

#### F08 — Thông báo nơi lưu dữ liệu và thông báo lỗi đã lỗi thời

- **P1 · Mã.** Composer ghi “stay on this device” trong khi gọi API và upload server. `mediaErrorMessage` đổi mọi lỗi không phải media validation thành lỗi lưu thiết bị, che lỗi session/API/storage thật. Nguồn: [post-composer.tsx](../apps/web/src/components/post-composer.tsx), [social.ts](../apps/web/src/lib/social.ts).
- **Sửa:** phân biệt bản nháp local, đang đồng bộ, đã xuất bản, xuất bản một phần. Map lỗi nghiệp vụ theo code; giữ request id cho hỗ trợ trong phần mở rộng, không đưa jargon vào thông điệp chính.
- **Nghiệm thu:** lỗi hết phiên, API 403/500, quota upload và offline có thông điệp/next step riêng; copy không còn nói bài công khai chỉ nằm trên thiết bị.

#### F09 — Tạo Problem kèm Idea tự sinh nội dung chung từ một tiêu đề

- **P2 · Mã.** Helper có tạo và publish Problem thật, nhưng tự tạo summary/description bằng câu mẫu “creator-proposed problem context”; affectedGroups/evidence rỗng. Nguồn: [social.ts](../apps/web/src/lib/social.ts).
- **Sửa:** mini-flow tạo Problem thu đủ mô tả, ai gặp và vì sao đáng giải quyết; hiển thị preview trước khi publish. Có thể lưu Problem draft trước, nhưng chỉ publish Idea khi quan hệ Primary Problem hợp lệ.
- **Nghiệm thu:** không tạo Problem công khai có mô tả máy sinh chung mà creator chưa xem/xác nhận; hủy bước tạo Problem không để Idea treo.

#### F10 — Bài mới có thể xuất hiện hai lần trong collection

- **P1 · Mã.** Sau publish, helper vẫn thêm cùng id/slug vào `knowledgePosts` local; KnowledgeFeed render localItems rồi initialItems, không deduplicate. Khi API cache bắt kịp sẽ có hai card và count tăng sai. Nguồn: [social.ts](../apps/web/src/lib/social.ts), [knowledge-feed.tsx](../apps/web/src/components/knowledge-feed.tsx).
- **Sửa:** dùng canonical id làm key hợp nhất; bản optimistic được thay bằng bản API. Không duy trì hai list cùng một entity. Refresh/revalidate collection sau mutation.
- **Nghiệm thu:** đăng một bài → thấy ngay một card; sau refresh, hết TTL 60 giây và đổi tab vẫn đúng một card, count không nhân đôi.

#### F11 — Upload lên server nhưng gallery vẫn đọc media từ IndexedDB

- **P1 · Mã.** `uploadFiles` trả upload id server; cache attachment giữ id đó. `StoredMedia` gọi `getStoredMediaBlob(id)` từ IndexedDB và không lấy URL server. Canonical Problem/Idea detail cũng chưa render gallery media trong source đã đọc. Nguồn: [uploads.ts](../apps/web/src/lib/uploads.ts), [social.ts](../apps/web/src/lib/social.ts), [post-media-gallery.tsx](../apps/web/src/components/post-media-gallery.tsx).
- **Sửa:** read DTO trả asset metadata và URL được cấp quyền; gallery phân biệt pending preview `blob:` với asset đã publish. Canonical detail đọc attachment server. Lỗi phải có lý do + retry, không chỉ tên file.
- **Nghiệm thu:** đăng ảnh/video, mở lại bằng session khác và deep link; media tải được, private asset không thành URL công khai.

#### F12 — Upload/đăng bài không có tiến độ theo giai đoạn và phục hồi lỗi một phần

- **P1 · Mã.** Upload chạy tuần tự, sau đó create → publish → attach → local cache; UI chỉ “Posting…”. Nếu attach/cache lỗi sau publish, người dùng có thể thấy thất bại dù bài đã tồn tại rồi bấm đăng lại. Nguồn: [uploads.ts](../apps/web/src/lib/uploads.ts), [social.ts](../apps/web/src/lib/social.ts), [post-composer.tsx](../apps/web/src/components/post-composer.tsx).
- **Sửa:** lưu operation/entity id; trạng thái “Đang tải tệp 2/4”, “Đang xuất bản”, “Bài đã đăng, 1 tệp cần thử lại”. Retry tiếp phần lỗi, dùng idempotency phù hợp cho create/publish và không tạo lại entity.
- **Nghiệm thu:** ép lỗi ở từng giai đoạn; kết quả không trùng bài, tệp thành công được giữ, người dùng biết có cần gửi lại hay không.

#### F13 — Follow chỉ là toggle tạm thời

- **P1 · Mã.** `EntityActions` dùng `useState(false)` cho Follow, không persist hoặc request. Rời route là mất trạng thái. Nguồn: [v1-actions.tsx](../apps/web/src/components/v1-actions.tsx).
- **Sửa:** kết nối follow API, query trạng thái theo user/entity; optimistic update có rollback + retry. Nếu chưa có backend, không báo “Following” như một thao tác hoàn thành bền vững.
- **Nghiệm thu:** follow ở detail rồi mở lại ở thiết bị khác vẫn đúng; server lỗi thì UI không báo thành công.

#### F14 — Saved/Like dùng kho theo browser, không theo tài khoản

- **P1 · Mã.** `STORAGE_KEY` dùng chung; toggleBookmark/Like chỉ đọc/ghi localStorage, không namespace user. SavedLibrary không có hydration state riêng, ban đầu render “No bookmarks”. Nguồn: [social.ts](../apps/web/src/lib/social.ts), [saved-library.tsx](../apps/web/src/components/saved-library.tsx).
- **Sửa:** nguồn canonical theo user; cache key gồm user id và xóa/invalidate khi logout. Dùng loading trước khi biết dữ liệu; empty state có CTA khám phá.
- **Nghiệm thu:** A lưu bài → logout → B login không thấy thư viện của A; reload không lóe empty trước dữ liệu; đổi thiết bị vẫn có bài đã lưu.

#### F15 — Share bị ép login và có thể báo “Copied” sau khi hủy

- **P2 · Mã.** Share URL công khai gọi requireAuth. EntityActions nuốt lỗi native share rồi vẫn `setShared(true)`; clipboard reject không có thông điệp phục hồi. Nguồn: [v1-actions.tsx](../apps/web/src/components/v1-actions.tsx), [knowledge-post.tsx](../apps/web/src/components/knowledge-post.tsx).
- **Sửa:** cho guest chia sẻ nội dung public; kiểm visibility riêng cho private. Phân biệt share success, AbortError, clipboard success/failure; chỉ báo “Đã sao chép” khi thực sự copy. Thông báo qua live region nhẹ.
- **Nghiệm thu:** Cancel native sheet không hiện success; clipboard bị chặn có cách chọn/copy URL thủ công.

#### F16 — Lượt xem và số Idea dùng giá trị không phản ánh sự thật

- **P1 · Mã.** KnowledgePost lấy số nguồn provenance làm fallbackViews. homeClient gán `ideaCount: 0`, `archiveCount: 0`; ProblemDiscoveryCard trình bày như số liệu thật dù detail có relatedIdeas. Nguồn: [knowledge-post.tsx](../apps/web/src/components/knowledge-post.tsx), [domain/client.ts](../apps/web/src/lib/domain/client.ts).
- **Sửa:** lấy metrics thật và định nghĩa chúng; không có dữ liệu thì bỏ số hoặc ghi “Chưa có dữ liệu”. Không dùng số nguồn làm lượt xem. Đối chiếu count giữa card và detail.
- **Nghiệm thu:** số trên Home khớp quan hệ trong detail và API; không có telemetry thì không trình bày view count giả.

#### F17 — URL search cho Bounty bị ghép sai số nhiều

- **P1 · Mã.** `searchPublicCatalog` tạo `${type}s`, nên type `bounty` thành `/bountys/...` thay vì `/bounties/...`. Đây là lỗi deterministic khi API trả kết quả bounty, không cần dựa vào snapshot cũ. Nguồn: [domain/client.ts](../apps/web/src/lib/domain/client.ts).
- **Sửa:** map tường minh problem→problems, idea→ideas, project→projects, bounty→bounties, organization→org. Dùng chung cho mọi card/search/deep link.
- **Nghiệm thu:** kết quả tìm kiếm của cả năm loại mở đúng route; kiểm cả slug có ký tự cần encode.

#### F18 — Explore Similar không có hành vi tìm tương tự

- **P2 · Mã + HTTP.** `mode=similar` chỉ đổi style link; query vẫn `searchPublicCatalog(locale,q)` không dùng mode. Nguồn: [Search page](../apps/web/src/app/[locale]/search/page.tsx).
- **Sửa:** hoặc triển khai tương tự với entity làm context, tiêu chí và lý do match; hoặc bỏ tab cho đến khi có. Không đổi nhãn một truy vấn keyword thành chức năng mới.
- **Nghiệm thu:** nếu giữ, người dùng thấy vì sao kết quả tương tự và bộ kết quả/ranking có logic riêng được kiểm chứng.

#### F19 — Ví dụ tìm kiếm ngay trên UI dẫn tới zero results

- **P2 · HTTP + mã.** Placeholder gợi ý “restaurant food waste”; API `/v1/search?q=restaurant` hiện trả `[]` dù catalog có title “Restaurants…”. SQL dùng full-text cấu hình `simple`, khác substring search ở feed và suggestions. Nguồn: [Search page](../apps/web/src/app/[locale]/search/page.tsx), [platform-repository.ts](../packages/db/src/platform-repository.ts).
- **Sửa:** thống nhất contract tìm kiếm: exact/prefix/token/diacritics/plural ở các bề mặt; ví dụ phải dựa trên dữ liệu tìm được. Với zero results, cho xóa bộ lọc, thử keyword gần và giải thích phạm vi ngắn gọn.
- **Nghiệm thu:** “restaurant”, “restaurants” và ví dụ UI tìm được record mục tiêu; VI có/không dấu có hành vi đã định nghĩa, không cần tìm giống hệt tiêu đề.

#### F20 — Catalog không có cách xem tiếp ngoài lô mặc định

- **P2 · Mã.** API listCatalog mặc định 30 records; client list không truyền pagination; Projects/Bounties/Search render kết quả hiện có như tổng số, không có load more. Nguồn: [api/app.ts](../apps/api/src/app.ts), [domain/client.ts](../apps/web/src/lib/domain/client.ts), [Projects page](../apps/web/src/app/[locale]/projects/page.tsx).
- **Sửa:** contract trả items + next cursor/hasMore, total nếu rẻ và chính xác. Hiển thị “Đang hiển thị 30 kết quả” khi chưa có total, giữ filters/search trong URL.
- **Nghiệm thu:** dataset >30 có thể tiếp cận record cuối bằng keyboard và touch; quay lại từ detail giữ vị trí/filter.

#### F21 — Project detail bỏ mất quan hệ/ngữ cảnh và đường xem sản phẩm

- **P1 · Mã.** projectFrom đặt team/technologies rỗng, không map source/bountyResult; chỉ tạo hai mode. UI có Winners filter và nhánh historical/source/private nhưng dữ liệu adapter không cung cấp đủ. repositoryUrl/demoUrl đã map nhưng public detail không render CTA tương ứng. Nguồn: [domain/client.ts](../apps/web/src/lib/domain/client.ts), [Project detail](../apps/web/src/app/[locale]/projects/[slug]/page.tsx).
- **Sửa:** map đầy đủ DTO theo khả năng server; chỉ hiện filter/mode được hỗ trợ. Detail đặt `Xem demo`/`Mã nguồn` gần header khi URL tồn tại; team/outcome chưa biết dùng empty có nghĩa, không section trống.
- **Nghiệm thu:** fixture có team/source/winner hiển thị đúng; không bỏ dữ liệu ở adapter; URL demo/repo truy cập được và được ghi rõ là liên kết ngoài.

#### F22 — Idea Landscape gợi ý dự án lịch sử không dựa trên liên quan

- **P2 · Mã; dữ liệu hiện chưa kích hoạt.** Idea page lấy `.find(project.mode === historical_imported)` trên toàn bộ Project, không lọc Problem/Idea/similarity. Khi có historical record, mọi Idea có thể được gợi ý cùng một Project không liên quan. Nguồn: [Idea detail](../apps/web/src/app/[locale]/ideas/[slug]/page.tsx).
- **Sửa:** chỉ render quan hệ đã xác định hoặc candidate có lý do match và mức chắc chắn; dữ liệu thiếu thì nói chưa có nghiên cứu liên quan.
- **Nghiệm thu:** hai Idea khác ngành không nhận cùng gợi ý chỉ do thứ tự list; mỗi gợi ý có quan hệ/lý do truy xuất được.

#### F23 — Bounty thiếu tiêu chí và thời hạn không đủ chính xác để quyết định

- **P1 · Mã.** `criteria: []` bị hardcode; detail vẫn có heading “Judging criteria” rồi trống. Deadline detail chỉ dateStyle medium, card `daysUntil` làm tròn lên và chặn tối thiểu 0 nên quá hạn vẫn là “0 days”. Nguồn: [domain/client.ts](../apps/web/src/lib/domain/client.ts), [Bounty detail](../apps/web/src/app/[locale]/bounties/[slug]/page.tsx), [v1-cards.tsx](../apps/web/src/components/v1-cards.tsx).
- **Sửa:** đọc criteria thật hoặc nêu rõ chưa công bố; với bounty chưa đủ điều kiện không cho submit. Deadline có ngày, giờ, múi giờ và trạng thái “Đã hết hạn”; dưới 24h dùng giờ/phút phù hợp.
- **Nghiệm thu:** trước/sau deadline một phút có state đúng; entry point và detail thống nhất; tiêu chí không bao giờ là một section trống không giải thích.

#### F24 — Tiền hiển thị làm tròn không đồng nhất

- **P2 · Mã.** RewardAmount làm tròn maximumFractionDigits 0; FundingStatus dùng formatter khác; CTA bounty dùng `toLocaleString()` không locale. Amount nhỏ có thể thành 0 trên hero nhưng còn số lẻ ở chỗ khác. Nguồn: [v1-primitives.tsx](../apps/web/src/components/v1-primitives.tsx), [Bounty detail](../apps/web/src/app/[locale]/bounties/[slug]/page.tsx).
- **Sửa:** dùng formatter USDC chung; card compact có tooltip/accessible exact amount, review/detail số chính xác. Giữ raw integer đến lớp định dạng khi cần, không coi USDC test là giá trị fiat thật.
- **Nghiệm thu:** 0,1; 1,25; 1.000,123456 và số lớn có hiển thị nhất quán EN/VI; không làm người dùng hiểu sai số tiền thưởng.

#### F25 — Hồ sơ gán sẵn kỹ năng và thành tích cho mọi người

- **P1 · Mã + HTTP guest.** Profile render “Forecasting systems”, “Kitchen Signal Lab”, “1 public build” không theo session, kể cả guest; link Project mẫu 404. Nguồn: [Profile page](../apps/web/src/app/[locale]/profile/page.tsx).
- **Sửa:** chỉ render dữ liệu gắn user; guest có preview onboarding được ghi rõ, tài khoản mới có empty state và CTA tạo hồ sơ. Proof phải có link tới nguồn công việc thật.
- **Nghiệm thu:** guest/new user không nhận kỹ năng hoặc build không thuộc họ; A/B có profile và metrics độc lập.

#### F26 — Dashboard trộn dữ liệu thật với tiến độ mẫu, có anchor rỗng

- **P1 · Mã; chưa test tài khoản reviewer.** Dashboard hardcode Northstar Foods, 18 private Ideas, “Judging/Configured”; bounties lại lấy API. Menu trỏ `#submissions`, `#funding`, `#results` nhưng không có section tương ứng. Nguồn: [Dashboard page](../apps/web/src/app/[locale]/dashboard/page.tsx).
- **Sửa:** lấy organization và counts/stages theo quyền hiện tại; không có dữ liệu thì hiện empty. Menu chỉ trỏ section có thật; dùng tiến độ suy ra từ trạng thái hệ thống, không dựa màu tĩnh.
- **Nghiệm thu:** đổi organization đổi đúng nội dung; mọi anchor điều hướng được; trạng thái dashboard khớp bounty detail.

#### F27 — Màn yêu cầu reviewer không có CTA đăng nhập tại chỗ

- **P2 · Mã + HTTP guest.** ReviewerGate chỉ nói “Sign in first”, không có nút login; hydrated=false và chưa login dùng cùng thông điệp quyền. Nguồn: [reviewer-gate.tsx](../apps/web/src/components/reviewer-gate.tsx).
- **Sửa:** tách loading identity, signed-out, checking access, forbidden và allowed. Signed-out có login giữ return URL; forbidden có đổi tài khoản hoặc liên hệ organization phù hợp.
- **Nghiệm thu:** guest hoàn thành bước tiếp theo từ chính gate; không lóe thông điệp thiếu quyền khi session đang hydrate.

#### F28 — Thông báo dẫn chung về Dashboard và badge luôn bằng 0

- **P1 · Mã.** NotificationList mọi item href dashboard, không theo payload/type; readAt không dùng để thể hiện đọc/chưa đọc. Sidebar badge hardcode `'0'`; đánh dấu đọc không cập nhật local list và không xử lý lỗi. Nguồn: [notification-list.tsx](../apps/web/src/components/notification-list.tsx), [product-frame.tsx](../apps/web/src/components/product-frame.tsx).
- **Sửa:** map type → destination hợp lệ với entity id; unread count từ cùng query; read state update có rollback. Không hiện badge 0. Đổi tài khoản phải reset items/error để tránh hiển thị danh sách cũ trong lúc tải.
- **Nghiệm thu:** từng loại notification mở đúng bài/bounty/submission; badge đổi khi đọc; A→B không thấy flash thông báo A.

#### F29 — Submission có trường bắt buộc nhưng nhãn trông tùy chọn

- **P1 · Mã.** PrivateIdeaSubmissionForm buộc `how` và `why` nhưng label không có dấu bắt buộc như bốn trường đầu, không aria-invalid cho hai trường này. Lỗi cuối form chỉ nói hoàn thành tất cả. Nguồn: [private-submission-form.tsx](../apps/web/src/components/private-submission-form.tsx).
- **Sửa:** thống nhất required metadata; lỗi cạnh từng trường với aria-describedby, summary liên kết field, focus field đầu sai. Giữ dữ liệu khi server reject và hiển thị giới hạn ngay khi nhập.
- **Nghiệm thu:** để riêng how/why trống vẫn xác định được đúng field cần sửa bằng mắt và screen reader; không phải tự đoán.

#### F30 — Màn gửi bài có thể báo thành công khi API trả null

- **P1 · Mã; tình huống lỗi chưa gọi mutation.** browserRequest trả null với 404. submissionClient.create không validate result; hai form await rồi setSubmitted(true). Nguồn: [api.ts](../apps/web/src/lib/api.ts), [domain/client.ts](../apps/web/src/lib/domain/client.ts), [private-submission-form.tsx](../apps/web/src/components/private-submission-form.tsx), [project-submission-snapshot.tsx](../apps/web/src/components/project-submission-snapshot.tsx).
- **Sửa:** mutation phải reject mọi kết quả không đúng success contract; chỉ render success khi có submission id, version và timestamp từ server. GET not-found không dùng chung quy ước với POST success.
- **Nghiệm thu:** mock 404/204-body-null/500 không hiện “synced/locked”; success thật có receipt có thể đọc lại.

#### F31 — Nộp bài thiếu biên nhận và review snapshot dùng dữ liệu mẫu

- **P1 · Mã.** Success chỉ đưa về bounty/problem, không link bài vừa gửi; snapshot review ghi cố định `v0.8 · 04 Sep 2026`. Payload có `payoutAcknowledged: true` dù màn này không thu xác nhận recipient tương ứng. Nguồn: [private-submission-form.tsx](../apps/web/src/components/private-submission-form.tsx), [project-submission-snapshot.tsx](../apps/web/src/components/project-submission-snapshot.tsx).
- **Sửa:** review hiển thị version/hash/deliverables/recipient thật; xác nhận cần thiết phải là control người dùng thực sự thao tác. Success trả mã submission, giờ nhận, trạng thái và CTA xem bản đã nộp, không chỉ quay lại danh sách.
- **Nghiệm thu:** refresh sau thành công vẫn tìm được đúng submission; UI không ghi đã chấp nhận một điều người dùng chưa thấy.

#### F32 — Submission không tồn tại bị trình bày như đang tải vô hạn

- **P2 · Mã.** PrivateSubmissionReview setSubmission(null) khi GET 404, rồi nhánh `!submission` luôn hiển thị loading; lỗi không có Retry. Nguồn: [private-submission-review.tsx](../apps/web/src/components/private-submission-review.tsx).
- **Sửa:** state machine loading/success/not-found/forbidden/error; reset theo id/user; retry hữu hạn và CTA về danh sách được phép xem. Không dùng null đồng thời cho “chưa tải” và “không có”.
- **Nghiệm thu:** id sai dừng loading và có recovery; đổi id sau lỗi không giữ thông báo cũ.

#### F33 — Build join/private workspace còn nhánh local mô phỏng

- **P2 · Mã; chưa reachable với catalog hiện tại.** BuildAccessPanel đánh dấu joined qua localStorage, cấp owner local cho `foodloop-mvp`; PrivateProjectWorkspace dùng deadline/deliverables mẫu. projectFrom hiện không map private_workspace, nên đây là rủi ro trước khi bật flow, không tuyên bố đã chạy live. Nguồn: [build-access-panel.tsx](../apps/web/src/components/build-access-panel.tsx), [project-experience.tsx](../apps/web/src/components/project-experience.tsx).
- **Sửa:** activation gate theo capability; membership/terms/workspace từ API, states đăng ký/đợi duyệt/đã tham gia/hết hạn rõ ràng. Link project dùng id tạo thật. Không lấy local flag làm bằng chứng quyền.
- **Nghiệm thu:** chỉ mở flow khi API membership hoạt động; refresh/thiết bị khác giữ quyền đúng; không xuất hiện deadline và “3/4 ready” mẫu.

#### F34 — Withdraw cho nhập nhiều bước dù không thể thực hiện

- **P2 · Mã.** Wallet đã có note chưa hỗ trợ ký, nhưng nút Withdraw vẫn mở form amount/address và bước Review rồi kết thúc ở nút disabled; chỉ kiểm tra chuỗi không rỗng. Nguồn: [wallet-dialog.tsx](../apps/web/src/components/wallet-dialog.tsx).
- **Sửa:** khi capability chưa có, dùng action thông tin ngắn “Rút tiền chưa khả dụng”, không bắt người dùng nhập. Khi kết nối thật, validate amount/address/network/balance/fee và hiển thị review đầy đủ trước ký.
- **Nghiệm thu:** người dùng biết khả năng rút ngay từ đầu; không điền địa chỉ chỉ để gặp ngõ cụt. Phân biệt Devnet và tài sản có giá trị thật.

#### F35 — Wallet có thể giữ số dư của địa chỉ trước trong lúc tải địa chỉ mới

- **P1 · Mã; cần test chuyển tài khoản.** Effect theo wallet.address không reset balances/balanceState; state ready cũ có thể còn nguyên. UI dùng `balances?.usdc` trước wallet balance. Nguồn: [wallet-dialog.tsx](../apps/web/src/components/wallet-dialog.tsx).
- **Sửa:** cache theo address+network; khi key đổi chuyển loading và không render balance của key trước. Với cùng ví, giữ số cũ có nhãn “cập nhật lúc…” nếu refresh lỗi.
- **Nghiệm thu:** A→B không có frame gán số A cho địa chỉ B; RPC lỗi không biến số dư chưa biết thành 0 hay báo verified mới.

### B. Typography, kích thước, khoảng trắng, căn lề và responsive

#### F36 — Một font condensed làm mọi vai trò, giảm khả năng đọc dài

- **P2 · Ảnh + mã; nhận định thiết kế.** `--font-ui`, `--font-title`, `--font-mono` đều trỏ Alumni Sans. Body 22px, long-copy 25px nhưng dáng chữ vẫn hẹp; ảnh landing cho thấy subtitle và metadata mảnh, dày nét khác nhiều với hero. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** giữ Alumni Sans cho display nếu muốn giữ nhận diện; thử Roboto hoặc sans hỗ trợ VI cho body/control. Mono chỉ dùng dữ liệu kỹ thuật cần thiết; số dùng tabular numerals. Nếu giữ một font, phải thử thực tế nội dung dài và tăng phân biệt bằng weight/leading/measure.
- **Nghiệm thu:** đọc bài VI 500–800 từ ở 360/768/1440px; body, label, heading phân biệt rõ; không coi tăng font-size đơn thuần là sửa readability.

#### F37 — Hero VI có line-height quá chặt và break dòng cứng

- **P2 · Ảnh + mã.** Hero desktop line-height `0.88`, mobile `0.97`, nhiều `<br/>`; ảnh có dấu tiếng Việt gần sát line phía trên và khối tiêu đề chiếm bốn dòng lớn. Nguồn: [Landing page](../apps/web/src/app/[locale]/page.tsx), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** thử leading 1.05–1.12 với font display thực; dùng max-inline-size và wrap tự nhiên, chỉ giữ break có chủ đích theo locale/viewport. Giảm display khi cần để giữ CTA dễ tiếp cận, không hy sinh dấu.
- **Nghiệm thu:** chuỗi có Ắ/Ễ/Ộ/Ự ở đầu/cuối dòng không đụng hoặc cắt dấu; test 320px và text zoom 200%.

#### F38 — Metadata và logo chữ mobile bị thu nhỏ về thị giác

- **P2 · Ảnh + mã.** Label brain 13px với condensed/uppercase/tracking, cue 15px; ảnh mobile cho thấy wordmark rất nhỏ cạnh nút “Mở ứng dụng” lớn. Đây là vấn đề hierarchy/readability, không phải kết luận thiếu contrast toàn bộ. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css), hai ảnh landing.
- **Sửa:** metadata đọc được ở 13–14px sans thường, weight 500, tracking ngắn; thông tin trang trí không đọc được thì bỏ. Mobile header dùng logo mark hoặc wordmark đủ rõ, CTA 40–48px với label gọn.
- **Nghiệm thu:** không cần zoom để đọc thông tin có ý nghĩa; header tại 320px không bóp wordmark hoặc tràn nút chuyển ngôn ngữ.

#### F39 — Home đưa nhiều nội dung giới thiệu trước feed thật

- **P2 · Mã; cần đo viewport.** Home luôn render page header, feature banner, ba discovery paths, section heading, filters và search trước record đầu. Mobile paths xếp thành ba hàng, tăng quãng cuộn. Nguồn: [v1-home-feed.tsx](../apps/web/src/components/v1-home-feed.tsx), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** returning user thấy tiêu đề nhỏ + filters/search + records; onboarding banner gọn có dismiss và không lặp mỗi lần. Giữ discovery paths ở lần đầu hoặc đưa vào rail/menu. Mục tiêu không ràng buộc first-time hero giống returning feed.
- **Nghiệm thu:** ở 390×844, returning user thấy ít nhất một record có title, summary và CTA mà chưa cuộn qua một màn giới thiệu.

#### F40 — Ba lớp CSS cùng điều khiển một giao diện

- **P2 · Mã.** Root import globals.css → v1.css → brand-system.css, tổng **9.118 dòng**; không phải 9.118 dòng đều thừa. Nhiều selector bị định nghĩa lại, kể cả mobile brain `display:none` rồi `display:block` cuối file. Tokens spacing đã có ở v1 nhưng brand override dùng nhiều literal. Nguồn: [layout.tsx](../apps/web/src/app/layout.tsx), [globals.css](../apps/web/src/app/globals.css), [v1.css](../apps/web/src/app/v1.css), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** lập owner cho tokens/base/layout/components/utilities; migrate từng page family sang CSS module/layer có phạm vi. Xóa rule cũ sau khi chứng minh không dùng; không thêm file override thứ tư để vá.
- **Nghiệm thu:** một component có một nguồn quy định kích thước/state chính; thay spacing token không cần dò ba file và không làm route khác đổi ngoài ý muốn.

#### F41 — Responsive 1180px làm cột nội dung thay đổi quá đột ngột

- **P2 · Mã; mức độ thị giác cần render.** Tại 1181px shell dùng 210px + center + 260px nên center khoảng 711px; tại 1180px thành 88px + center, center khoảng 1092px. Giảm viewport 1px lại tăng vùng giữa khoảng 381px trước padding. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** chọn breakpoint theo minimum content width; rail chỉ xuất hiện khi center vẫn đủ rộng. Giới hạn max-width nội dung scan, căn trung tâm phần dư; tránh card/line-length phình ra ở tablet ngang.
- **Nghiệm thu:** resize qua 1179/1180/1181/1280 không đổi số dòng/title quá mạnh hoặc làm CTA nhảy xa. Hai pane đều có kích thước tối thiểu có chủ đích.

#### F42 — Navigation đổi nội dung theo chiều cao và desktop/mobile khác trọng tâm

- **P2 · Mã.** compactNav kích hoạt cả max-height 780px và max-width 1180px, chuyển Projects/Bounties/Saved vào More. Mobile dock có Home/Problem/Create/Bounty/Profile, không có Idea; nội dung cốt lõi phải tìm trong menu. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx).
- **Sửa:** xác định 3–5 destination ưu tiên theo tác vụ, giữ thứ tự/nhãn nhất quán. Sidebar ngắn ưu tiên scroll vùng nav hoặc rail ổn định thay vì ẩn mục do chiều cao; Create nên là action được phân biệt với destination.
- **Nghiệm thu:** người dùng tìm được Ideas từ mọi kích thước trong một thao tác rõ ràng; resize chiều cao không làm mục vừa dùng biến mất bất ngờ.

#### F43 — Có tới ba ô tìm kiếm với phạm vi khó phân biệt

- **P2 · Mã.** Home có workspace search, rail search và feed search; hai ô global còn dùng state/behavior khác nhau. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx), [v1-home-feed.tsx](../apps/web/src/components/v1-home-feed.tsx).
- **Sửa:** một global search ở app bar. Collection filter search là tùy chọn thứ cấp có label “Tìm trong bảng tin”; bỏ global search trùng ở rail. Giữ keyword global trong URL và app bar khi sang Search.
- **Nghiệm thu:** người dùng phân biệt được đang tìm toàn mạng hay lọc danh sách; không có hai ô cùng label “Search” nhưng trả gợi ý khác nhau.

#### F44 — Căn lề và padding của collection chưa dùng cùng container

- **P2 · Mã; cần overlay screenshot.** V1 feed có padding page-gutter và card 26px; KnowledgeFeed dùng feed-stream/knowledge-post với avatar column và padding riêng; breadcrumb/detail và banner có container khác. Đây là nhiều trục đọc cạnh tranh giữa page families. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css), [knowledge-feed.tsx](../apps/web/src/components/knowledge-feed.tsx), [v1-cards.tsx](../apps/web/src/components/v1-cards.tsx).
- **Sửa:** chuẩn hóa page inset 16/24/32 và card inset 16/24; header, tabs, search và mép card cùng trục. Nội dung sau avatar là trục phụ có chủ đích, không buộc mọi chữ thẳng mép nếu ngữ nghĩa khác.
- **Nghiệm thu:** chụp Problems/Ideas/Home cạnh nhau; overlay grid xác nhận các mép container chung lệch tối đa 1 CSS px do rounding.

#### F45 — Detail có heading/body lớn nhưng provenance cố định chiếm nhiều chiều ngang

- **P2 · Mã; nhận định layout.** Detail h1 lên 72px, long-copy 25px, grid có rail 250px + gap36px; tablet 901–1180 rail 210px. Nội dung dài dễ xuống dòng nhiều, tăng độ dài trang. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** reading column 60–75ch với body 17–18px/1.55–1.65 là baseline thử nghiệm; rail 240–280px chỉ khi main đủ rộng. Ở màn vừa, đưa provenance sau tóm tắt hoặc thành disclosure có label, không bóp main.
- **Nghiệm thu:** paragraph không quá dài để mắt khó quay dòng, cũng không quá hẹp thành 5–7 từ/dòng; nội dung VI dài không làm rail chi phối màn hình.

#### F46 — Mục lục không phản ánh đầy đủ chương và vị trí đang đọc

- **P2 · Mã.** Idea thêm Landscape nhưng PageIndex không có mục đó, số Sources trùng số chương Landscape. PageIndex chỉ là anchor list, không active section. Global scroll-padding-top 150px và content scroll-margin-top 154px còn dựa header cũ trong khi desktop index top0. Nguồn: [Idea detail](../apps/web/src/app/[locale]/ideas/[slug]/page.tsx), [page-index.tsx](../apps/web/src/components/page-index.tsx), [globals.css](../apps/web/src/app/globals.css).
- **Sửa:** tạo một section registry sinh cả heading/index; active section với aria-current location. Tính sticky offset từ header/index thật, tránh cộng đệm quá mức. Mobile dùng menu “Trong trang” hoặc strip có cue cuộn.
- **Nghiệm thu:** click mục lục đưa heading ngay dưới sticky UI với khoảng đệm nhỏ; mọi chương có đúng một mục, số không trùng; cần browser xác nhận khoảng trống hiện tại.

#### F47 — Nút thao tác 40px nhỏ hơn mục tiêu touch đề xuất

- **P2 · Mã; không tự kết luận vi phạm AA.** knowledge-post-action, feed-search clear, workspace-locale/search button là 40px; icon-control mobile mới là 44px. Nguồn: [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** touch hit area 48×48px, icon 20–24px; icon nhỏ vẫn có padding đủ. Với desktop dày dữ liệu có thể dùng visual 36–40px nếu target/spacing đã được kiểm tra và coarse-pointer có biến thể lớn hơn.
- **Nghiệm thu:** đo bounding box target ở 360px; cạnh sát nhau không chồng hit area; bấm một tay không dễ nhầm Share/Save.

#### F48 — Focus ring toàn cục bị selector cụ thể vô hiệu hóa

- **P1 · Mã.** `:where(...):focus-visible` trong brand có specificity thấp. `.quote-form textarea:focus-visible { outline:none }` và `.v1-search-form input { outline:0 }` có specificity cao hơn; source chưa có focus-within thay thế tương ứng. Nguồn: [globals.css](../apps/web/src/app/globals.css), [v1.css](../apps/web/src/app/v1.css), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** bỏ outline-reset khi không có replacement; field container dùng focus-within ring rõ, input/textarea có focus-visible thống nhất. Kiểm toàn cascade thay vì chỉ thêm global rule cuối file.
- **Nghiệm thu:** dùng Tab tới quote textarea/search/input/clear; luôn thấy vị trí focus, không chỉ khi dùng chuột. Chạy axe bổ sung nhưng phải kiểm bằng mắt.

#### F49 — Border field thiếu tương phản nếu đó là dấu hiệu nhận biết duy nhất

- **P2 · Tính toán token; cần kiểm rendered control.** `--line` #302938 trên #100e15 khoảng **1,37:1**; `--line-strong` #63576e trên #19161f khoảng **2,65:1**. Một số field dựa vào border mỏng để phân định. Ngược lại muted text trên panel khoảng **8,24:1**, không có cơ sở nói toàn bộ text thiếu contrast.
- **Sửa:** tạo token outline-control khác separator trang trí; bảo đảm ranh giới/control state cần thiết có tương phản đủ, kết hợp fill và label. Không tăng mọi divider lên 3:1 vì decorative separators không cùng yêu cầu.
- **Nghiệm thu:** đo màu composite trong browser ở enabled/focus/error; field nhận biết được khi placeholder rỗng; kiểm riêng text, icon và border theo vai trò. Nguồn token: [brand-system.css](../apps/web/src/app/brand-system.css); [web.dev — Accessibility](https://web.dev/learn/design/accessibility).

#### F50 — Icon trạng thái truyền mức tin cậy mạnh hơn dữ liệu

- **P2 · Mã + đánh giá semantics.** FundingStatus dùng ShieldCheck cả cho funding chưa kết nối; VisibilityBadge dùng ShieldCheck cho “Public”. Public/unfunded không có nghĩa đã được xác minh an toàn. Nguồn: [v1-primitives.tsx](../apps/web/src/components/v1-primitives.tsx).
- **Sửa:** Public dùng globe/eye, restricted dùng lock, unknown dùng info/clock, verified mới dùng check. State text luôn đi kèm màu/icon; màu category không được thay nghĩa success/warning.
- **Nghiệm thu:** người xem ảnh grayscale vẫn phân biệt public, pending và verified; cùng icon không mang hai lời hứa trái nhau.

### C. Accessibility, localization, overlay và trạng thái tương tác

#### F51 — Hai bộ dialog tạo duplicate ID trên trang Profile

- **P1 · Mã.** ProductFrame và ProfileSession đều mount AuthDialog/WalletDialog. Các component dùng id cố định `auth-dialog-title`, `wallet-dialog-title`, `wallet-balance-heading`… kể cả dialog đang đóng. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx), [profile-session.tsx](../apps/web/src/components/profile-session.tsx).
- **Sửa:** một dialog host dùng chung hoặc useId cho tất cả id/aria references. Trigger mang return-focus reference đúng phần tử mở.
- **Nghiệm thu:** DOM Profile không duplicate ID; accessible name của mỗi dialog đúng tiêu đề đang thấy, focus quay đúng trigger.

#### F52 — Media viewer khai báo modal nhưng chưa có hành vi modal đầy đủ

- **P1 · Mã.** Viewer là div role=dialog aria-modal=true, chỉ có Escape/click dismiss; không focus ban đầu, trap focus, inert nền hoặc restore focus. Nguồn: [post-media-gallery.tsx](../apps/web/src/components/post-media-gallery.tsx).
- **Sửa:** dùng native dialog hoặc primitive đã kiểm chứng; focus Close lúc mở, khóa tương tác nền, trả focus thumbnail lúc đóng. Ảnh có alt mô tả được nhập; filename chỉ là fallback.
- **Nghiệm thu:** Tab/Shift+Tab không thoát modal, Escape đóng, screen reader không đọc nền; video controls thao tác được bằng keyboard.

#### F53 — Đóng composer mobile cố trả focus về nút desktop đang ẩn

- **P2 · Mã; cần browser.** ProductFrame onClose luôn `postTriggerRef.current?.focus()`; ref nằm ở sidebar desktop, không ở dock hoặc CTA mở từ route. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx).
- **Sửa:** lưu actual opener khi mở; nếu opener bị unmount, focus heading/destination phù hợp. Mobile menu/popover cũng phải có return-focus và dismiss nhất quán.
- **Nghiệm thu:** mở từ dock, menu, CTA detail và route rồi đóng; focus về phần tử visible, không nhảy lên đầu hoặc biến mất.

#### F54 — Ngôn ngữ document và bản dịch không thống nhất

- **P2 · Mã + HTTP.** `/vi` trả html lang=en; ProductFrame có wrapper lang=locale nên có giảm tác động cho phần nội dung bên trong, nhưng document/metadata/global 404 vẫn sai locale. Provenance hardcode English và date locale en; composer VI còn nhiều label tiếng Anh. Nguồn: [layout.tsx](../apps/web/src/app/layout.tsx), [provenance.tsx](../apps/web/src/components/provenance.tsx), [post-composer.tsx](../apps/web/src/components/post-composer.tsx).
- **Sửa:** render document lang theo locale; đưa UI copy/status/date vào dictionary. Giữ nguyên creator-authored text, đánh dấu lang riêng khi có thông tin, không tự dịch thesis.
- **Nghiệm thu:** UI VI không còn “Who has this problem?” hoặc lỗi session tiếng Anh; screen reader chọn ngôn ngữ đúng; EN/VI đều test dấu và text expansion.

#### F55 — Đổi ngôn ngữ làm mất query/filter và 404 đưa về EN

- **P2 · Mã + HTTP.** Locale links chỉ dùng pathname, mất `?q`, stage/filter/mode. Root NotFound luôn tiếng Anh và href `/en`; unknown route VI tái hiện điều này bằng HTTP. Nguồn: [product-frame.tsx](../apps/web/src/components/product-frame.tsx), [not-found.tsx](../apps/web/src/app/not-found.tsx).
- **Sửa:** locale switch bảo toàn search params và hash hợp lệ; localized not-found có “Quay lại”, “Tìm kiếm”, “Trang chủ” giữ locale. Copy lỗi nói đối tượng không còn hoặc URL sai bằng ngôn ngữ bình thường.
- **Nghiệm thu:** `/vi/search?q=repair&mode=similar` đổi EN giữ query/mode; 404 VI không tự đưa người dùng sang landing EN.

#### F56 — Consent đăng nhập không có link tài liệu, logo social là ký tự thay thế

- **P2 · Mã.** Auth terms là đoạn text không anchor; social marks dùng G/𝕏/f thay asset chính thức. Provider disabled theo socialReady không có giải thích riêng khi kéo dài. Nguồn: [auth-dialog.tsx](../apps/web/src/components/auth-dialog.tsx).
- **Sửa:** thêm link Terms/Privacy thật có thể mở mà không mất flow; asset provider phù hợp hướng dẫn thương hiệu; trạng thái đang khởi tạo và lỗi provider có recovery. Nội dung nói rõ phương thức đăng nhập khả dụng.
- **Nghiệm thu:** keyboard mở được tài liệu; provider lỗi không để ba nút disabled vô thời hạn không lời giải thích. Không cần thiết kế lại nhận diện ứng dụng để sửa điểm này.

#### F57 — Copy lộ cấu trúc triển khai và tên nội bộ ở quá nhiều chỗ

- **P2 · Mã.** “API / canonical”, “server snapshot”, “development funding state”, “authorized public results”, “frontend phase”, “index” xuất hiện trong hành trình phổ thông. Nguồn: [v1-primitives.tsx](../apps/web/src/components/v1-primitives.tsx), Search, Wallet, Dashboard và Submission components.
- **Sửa:** dùng “Đã xuất bản”, “Bản nộp đã lưu”, “Chưa xác minh tiền thưởng”, “Kết quả công khai”. Giữ thông tin Devnet/quyền riêng tư quan trọng, đưa request id/hash/API provenance vào phần chi tiết kỹ thuật mở được.
- **Nghiệm thu:** người mới trả lời được “đây là gì, có ai xem được, tôi làm gì tiếp” mà không cần biết canonical/index/snapshot là gì.

### D. Motion, loading và độ bền giao diện

#### F58 — Lazy entrance có thể làm nội dung đã thấy di chuyển muộn

- **P2 · Mã; cần slow-network render.** LandingEntrance đợi dynamic import animejs rồi chạy y `[14,0]` trên nội dung SSR đã visible; V1HomeFeed cũng animate khi đổi filter sau import. Mạng/chunk chậm có thể khiến người dùng bắt đầu đọc rồi chữ mới chuyển động. Nguồn: [landing-entrance.tsx](../apps/web/src/components/landing-entrance.tsx), [v1-home-feed.tsx](../apps/web/src/components/v1-home-feed.tsx).
- **Sửa:** nếu animation module đến sau thời điểm phù hợp, bỏ entrance; ưu tiên nội dung ổn định. Filter transition chỉ áp dụng vùng kết quả và dừng khi nhập nhanh; không animate toàn màn khi typing.
- **Nghiệm thu:** throttle mạng/CPU, focus CTA khi trang vừa mở; không có đợt chuyển động muộn gây mất vị trí đọc. Reduced motion giữ nội dung trực tiếp.

#### F59 — Brain narrative không đồng bộ đầy đủ với bảy bước

- **P2 · Mã.** Brain stage khởi tạo 0 sau lazy import, chỉ nhận event tương lai; bước đã phát trước mount có thể bị mất. Stage 5/6 không có biểu diễn riêng rõ trong Network/Hemisphere; caption luôn “01 / SIGNAL → CONNECTION”. Nguồn: [brain-loader.tsx](../apps/web/src/components/brain-loader.tsx), [brain-scene.tsx](../apps/web/src/components/brain-scene.tsx), [narrative.tsx](../apps/web/src/components/narrative.tsx), Landing page.
- **Sửa:** source-of-truth stage dùng state/store/DOM-derived snapshot khi scene mount; xác định motion map cho từng bước hoặc giảm số bước graphic. Caption theo active stage; SVG fallback cũng có context tương ứng nếu cần.
- **Nghiệm thu:** load khi đã scroll giữa trang, scroll nhanh, Back/Forward và Pause/Resume đều giữ đúng stage; không tuyên bố đủ bảy biến đổi chỉ vì có bảy dòng text.

#### F60 — WebGL fallback mới che import failure/context loss, chưa bảo vệ lỗi khởi tạo

- **P2 · Mã; rủi ro cần mô phỏng.** Loader catch import lỗi; scene xử lý contextlost sau onCreated nhưng không có local error boundary cho Canvas khởi tạo lỗi. CSS ẩn fallback khi có canvas, không dựa vào frame render thành công. Nguồn: [brain-loader.tsx](../apps/web/src/components/brain-loader.tsx), [brain-scene.tsx](../apps/web/src/components/brain-scene.tsx), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** boundary cục bộ giữ nguyên landing và SVG; flag ready sau render thành công; khi GPU/context lỗi, bỏ canvas và khôi phục fallback. Đồng bộ ngưỡng 760px CSS và 769px loader nếu không có lý do riêng.
- **Nghiệm thu:** WebGL unavailable, context lost và chunk error không làm mất hero/CTA; không còn Pause button vô nghĩa khi scene không hoạt động.

#### F61 — Font từ stylesheet bên ngoài chưa có bằng chứng ổn định layout

- **P2 · Mã; chưa đo performance.** Root phụ thuộc stylesheet Adobe Typekit; font fallback Arial Narrow/Arial có metrics khác. Chưa có đo FOIT/FOUT/CLS trong audit. Không thể kết luận trang chậm chỉ vì có external font. Nguồn: [layout.tsx](../apps/web/src/app/layout.tsx), [brand-system.css](../apps/web/src/app/brand-system.css).
- **Sửa:** kiểm font delivery và font-display thực; chỉ tải weight dùng, fallback metrics hợp lý. Self-host nếu license cho phép hoặc chọn font có khả năng phân phối phù hợp. Performance budget áp dụng cho cả font, auth và animation chunks.
- **Nghiệm thu:** chặn font domain và mô phỏng mạng chậm; chữ vẫn đọc được, layout/CTA không nhảy đáng kể; đo CLS production thay vì suy đoán.

#### F62 — Loading/empty/error chưa đồng nhất giữa các route và form

- **P2 · Mã.** Có skeleton Bounties/Notifications và error boundary khá rõ, nhưng nhiều page family không có loading boundary riêng; Saved dùng empty trước hydrate, reviewer dùng gate trước hydrate, form validation không đưa focus đến lỗi. Nguồn: [page-skeleton.tsx](../apps/web/src/components/page-skeleton.tsx), [saved-library.tsx](../apps/web/src/components/saved-library.tsx), [reviewer-gate.tsx](../apps/web/src/components/reviewer-gate.tsx), [post-composer.tsx](../apps/web/src/components/post-composer.tsx).
- **Sửa:** lập state inventory theo từng surface, skeleton giữ đúng geometry nội dung, state loading/empty/error có semantic riêng. Error có Retry + đường thay thế; empty có hành động có ích; validation focus/summary dùng primitive chung.
- **Nghiệm thu:** test first visit, cold cache, offline, no results, denied và retry; không có màn im lặng, loading vô hạn hoặc empty giả. Không thêm spinner ở mọi chỗ nếu response đã tức thời.

#### F63 — Chưa có bằng chứng regression đủ cho bản giao diện hiện tại

- **P2 · Kiểm tra test source.** Repository có E2E, axe, responsive 360/768/1280 và reduced-motion; vì browser không khả dụng nên chưa chạy lại. Chưa thấy coverage đầy đủ cho các điểm biên 760/769/1180, text zoom, fallback font, virtual keyboard và những lỗi mới nêu. Nguồn: [playwright.config.ts](../playwright.config.ts), [tests/e2e](../tests/e2e).
- **Sửa:** bổ sung case theo failure mode thực của audit, không viết test chỉ assert class/style implementation. Tách correctness của flow khỏi visual regression; có screenshot desktop/mobile của các state quan trọng.
- **Nghiệm thu:** run suite trong môi trường browser khả dụng, lưu report commit/build id; review trực quan vẫn bắt buộc vì axe và no-overflow không đánh giá hierarchy/spacing.

## 4. Những gì nên giữ

- Logo và cặp vàng/tím đã có tính nhận diện; không có lý do bắt buộc thay palette để áp dụng Material.
- Nền/tương phản chữ chính tương đối tốt ở mức token: text #F5F1EC trên panel #19161F khoảng 15,88:1, muted khoảng 8,24:1. Các tỷ lệ này chỉ áp dụng đúng cặp màu đặc đã tính.
- Canonical Problem/Idea có cấu trúc chương, Primary Problem và provenance; nên làm rõ hơn thay vì biến mọi detail thành card feed giống nhau.
- Phần lớn dialog dùng native dialog; nhiều button có aria-label/pressed/current; có skip link, error recovery và safe-area bottom. Không báo thiếu những thứ đã tồn tại.
- Brain được lazy-load, kiểm reduced motion/saveData, giới hạn DPR, có Pause và ngưng frame ngoài vùng nhìn. Cần hoàn thiện failure/state synchronization, không cần xóa toàn bộ animation.
- Bounty đang không mở submit khi status chưa open; thông tin funding không xác minh đã có nhãn. Giữ sự trung thực này khi cải thiện visual hierarchy.

## 5. Thiết kế đích: thông số đủ để triển khai

Các thông số dưới đây là baseline thiết kế đề xuất, cần kiểm bằng nội dung thật. Không áp đặt toàn bộ hình thức Material lên thương hiệu, không bắt buộc dùng component library mới.

### 5.1. Layout và hệ thống căn lề

| Bề mặt                | Đề xuất                                                                                                | Mục đích                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Mobile 320–599 CSS px | Một cột; page inset 16px; header khoảng 56–64px; điều khiển touch 48px; bottom navigation có safe area | Ưu tiên nội dung và tác vụ chính              |
| Medium 600–839        | Một cột nội dung; inset 24px; rail navigation 72–80px nếu không làm main hẹp                           | Không giả định tablet phải có contextual rail |
| Expanded 840–1199     | Navigation rail 80px, main có max-width; contextual content inline/disclosure khi cần                  | Tránh bước nhảy center quá lớn                |
| Large ≥1200           | Sidebar 216–240px; feed đọc/scan khoảng 680–800px; contextual rail 256–280px chỉ khi đủ chỗ            | Ba cột có vai trò, không nhồi đủ bằng mọi giá |
| Public detail         | Article max-width khoảng 68ch; rail nguồn 240–280px khi đủ không gian                                  | Đọc dài dễ theo dõi                           |
| Content shell         | Max-width thử nghiệm 1440–1520px; phần dư căn giữa                                                     | Không kéo paragraph vô hạn ở ultrawide        |
| Dialog ngắn           | Width min(100% − 32px, 480px); max-height theo 100dvh; body scroll khi cần                             | Login/wallet summary gọn                      |
| Composer dài          | Desktop 640–760px hoặc route editor; mobile route/full-height sheet                                    | Nhiều field không bị ép vào dialog hẹp        |

Không lấy breakpoints như luật cố định: nếu content width không đủ, chuyển mode sớm hơn. Chỉ một nơi quản lý inset. Header, filters, search, list và empty state chia sẻ mép ngoài; bên trong card dùng padding riêng.

### 5.2. Spacing và component sizing

| Token             |                                                            Giá trị đề xuất | Dùng cho                                               |
| ----------------- | -------------------------------------------------------------------------: | ------------------------------------------------------ |
| space-1 / 2 / 3   |                                                               4 / 8 / 12px | Icon–label, metadata, controls gần nhau                |
| space-4 / 6       |                                                                  16 / 24px | Card padding, field spacing, nhóm liên quan            |
| space-8 / 12 / 16 |                                                             32 / 48 / 64px | Section, major group, landing chapter                  |
| Icon              |                               20px mặc định, 24px touch, 16px metadata phụ | Không thay tùy hứng giữa 17/19/21 nếu không có vai trò |
| Avatar            |                                   32px compact, 40px list, 64–80px profile | Avatar không lấn title                                 |
| Input             |                      48–56px chiều cao, font ≥16px, padding-inline 12–16px | Dễ bấm/nhập và tránh text nhỏ                          |
| Primary button    |                 Touch 48px, desktop visual 40–48px; padding-inline 16–24px | Một primary action theo khu vực quyết định             |
| Card              |                             Padding 16px mobile, 24px desktop; gap 12–16px | Mật độ nội dung đều                                    |
| Corner radius     | Field/button 8px, container 12px là baseline thử; chip/avatar theo vai trò | Nhất quán, không bo mọi thứ thành pill                 |

Giữ khoảng cách gần cho thông tin liên quan: title–summary 8px; summary–metadata 12px; nội dung–actions 16px; các card 12–16px; các section lớn 32–48px. Khi kích thước font thay đổi, re-evaluate khoảng trắng bằng mắt, không áp số một cách cơ học.

### 5.3. Typography

| Vai trò         | Desktop             | Mobile            | Quy tắc                                                          |
| --------------- | ------------------- | ----------------- | ---------------------------------------------------------------- |
| Landing display | 56–72px / 1.08–1.15 | 40–48px / 1.1–1.2 | Alumni Sans có thể giữ; không cắt dấu                            |
| Page title      | 32–40px / 1.2       | 28–32px / 1.25    | Không cạnh tranh với hero marketing                              |
| Section title   | 24–28px / 1.3       | 22–24px / 1.3     | Nhận biết chương, không quá nhiều uppercase                      |
| Card title      | 20–24px / 1.3       | 20–22px / 1.35    | Tối đa 2–3 dòng trong list; detail hiển thị đầy đủ               |
| Reading body    | 17–18px / 1.6       | 16–18px / 1.6     | Sans thường hỗ trợ VI, measure 60–75ch khi đủ rộng               |
| Control/label   | 14–16px / 1.4–1.5   | 16px / 1.4–1.5    | Weight 500–600 khi cần phân cấp                                  |
| Metadata        | 13–14px / 1.45      | 13–14px / 1.45    | Không condensed uppercase dài; thông tin quan trọng không hạ nhỏ |

Phương án ưu tiên: Alumni Sans ở display/brand, Roboto hoặc sans VI dễ đọc ở body/control. Đây là **đề xuất đổi phân vai font**, chưa tự áp dụng vào source. Trước khi chọn phải so sánh hai specimen EN/VI với nội dung thật và font fallback.

### 5.4. Color và state

- Đổi tên token theo vai trò: canvas, surface, surface-container, on-surface, on-surface-variant, outline-control, divider, primary/on-primary, secondary/on-secondary, success, warning, error.
- Vàng ưu tiên CTA quan trọng; tím cho secondary/category khi có nghĩa. Active navigation có indicator + weight/shape, không chỉ đổi màu.
- Không dùng màu warning cho mọi research status hoặc check icon cho public. Chưa biết, đang xử lý, đã xác minh là ba state khác nhau.
- Form border và focus ring được kiểm contrast riêng. Token separator có thể nhẹ hơn control outline.
- Không thêm light mode trong đợt sửa nếu chưa có nhu cầu; dark mode tốt là đủ, miễn không có nút Appearance giả tạo kỳ vọng chuyển theme.

### 5.5. Motion

| Interaction         | Baseline đề xuất                                                             | Khi reduced motion                            |
| ------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- |
| Hover/pressed/state | 100–160ms cho opacity/color                                                  | Đổi state trực tiếp vẫn rõ                    |
| Menu/popover        | 160–220ms; translate tối đa 4–8px                                            | Không translate, mở tức thì hoặc fade rất nhẹ |
| Dialog/sheet        | 200–280ms; entry/exit có lifecycle và focus rõ                               | Mở/đóng ngay, giữ focus semantics             |
| Filter results      | 120–180ms vùng kết quả; không animate mỗi ký tự                              | Đổi kết quả trực tiếp và thông báo count      |
| Landing entrance    | Một lần; 250–400ms nếu đã ready, bỏ nếu đến muộn                             | Nội dung SSR visible                          |
| Brain               | Theo stage thật; pause, outside viewport, document visibility và GPU failure | SVG/static narrative đầy đủ                   |

Không đổi kích thước bố cục trên hover; không gán cùng animation cho mọi section. Pause motion không làm mất thông tin, đổi filter nhanh phải hủy animation cũ an toàn.

## 6. Phương án flow theo từng màn

### Landing → khám phá

Header gọn gồm brand, đường khám phá, locale, một CTA mở app. Hero nói rõ giá trị + một primary `Khám phá vấn đề`, secondary `Đăng vấn đề`. Bằng chứng là 2–3 Problem thật, không số cộng đồng chưa có dữ liệu. Brain nằm cạnh phần giải thích trên desktop; mobile dùng hình/static ngắn có vai trò, không bắt người dùng cuộn qua một section trang trí lớn trước nội dung cần đọc.

### Home / collections

Một app bar global search → page title gọn → filters → records. Banner hướng dẫn chỉ dành cho first visit hoặc có dismiss. Feed dùng một record identity/route contract; cards không cần đồng hình hoàn toàn nhưng title, metadata và CTA có nhịp chung. Filter/query có URL và reset rõ; “For you” nên đổi thành “Khám phá” nếu chưa có cá nhân hóa.

### Problem → Idea → Project

Problem header có title, mô tả ngắn, người gặp và tình trạng evidence. Primary action là đề xuất Idea theo đúng Problem; bounty riêng tư có entry point phân biệt với public idea. Idea có thesis của creator, solution, evidence và Project liên quan thật. Start Project là flow tạo build mới có context, có draft và success destination đúng, không mở mẫu.

### Tạo Problem/Idea

1. Identity/context: loại nội dung, Problem nếu tạo Idea, title, summary.
2. Nội dung thiết yếu: mô tả–ai gặp–tại sao quan trọng, hoặc opportunity–solution.
3. Chi tiết tùy chọn chia nhóm có tên, không mở 8–12 field không phân đoạn cùng lúc.
4. Media: preview + alt/description + progress + retry/cancel khi khả dụng.
5. Review: visibility, chính xác nội dung sẽ publish, thông tin nào chỉ là draft.
6. Submit: trạng thái cụ thể; success mở canonical record đã lưu và cho tiếp tục chỉnh sửa nếu sản phẩm hỗ trợ.

Các bước là nhóm thông tin, không bắt buộc biến thành wizard sáu màn; có thể là một editor với progressive disclosure. Thao tác đơn giản không nên chịu thêm bước xác nhận không cần thiết.

### Bounty → private submission

Header nêu loại competition, reward kèm funding/network state, giờ deadline, tổ chức, eligibility và deliverables. Tiêu chí/terms phải đọc được trước submit. Người dùng kiểm tra nội dung và recipient nếu liên quan rồi chủ động gửi. Success có receipt, link bản nộp và trạng thái tiếp theo. Nếu chưa open, hiển thị lý do/timeline có dữ liệu, không mời nhập form rồi mới từ chối.

### Profile / Saved / Notifications

Dữ liệu chỉ theo tài khoản hiện tại. Guest có CTA login, new user có empty state hữu ích, returning user có dữ liệu thật. Notification đưa đúng object; Saved giữ filter/tab và không flash empty. Không dùng fixture thành tích để lấp khoảng trắng.

### Wallet

Ưu tiên network + address + balance freshness. Loading là chưa biết, 0 là số dư đã xác nhận bằng 0. Disabled capability nói rõ trước khi nhập. Không dùng icon shield/verified làm bằng chứng vượt quá dữ liệu chain/service đã xác nhận.

## 7. Thứ tự triển khai đề xuất

| Đợt                               | Phạm vi                                                   | Điều kiện hoàn thành                                                               |
| --------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1 — Độ tin cậy của flow           | F01–F17, F21, F25–F35 theo độ ưu tiên và khả năng backend | Link đúng; không mất field; không success giả; identity/cache riêng từng user      |
| 2 — Navigation/search/content     | F18–F24, F39, F42–F46, F54–F57                            | Search thống nhất; đúng context; labels/locale rõ; không dead end                  |
| 3 — Visual system + accessibility | F36–F38, F40–F41, F47–F53                                 | Token/component ownership; focus và targets; desktop/mobile được review bằng ảnh   |
| 4 — Motion/loading/regression     | F58–F63                                                   | Fallback hoạt động, states hoàn chỉnh, kiểm chứng trên browser và build production |

Các lỗi accessibility P1 như F48/F51/F52 phải được kéo lên sửa sớm cùng flow, không chờ “polish”. Các phần liên quan persistence, membership, upload read model cần phối hợp API; không thể sửa hoàn toàn bằng CSS. Không bật flow Build private hoặc withdrawal chỉ để có màn đẹp khi contract thực chưa đáp ứng.

Không gán ước lượng ngày chắc chắn khi chưa chốt phạm vi backend và môi trường test. Sau khi chọn đợt sửa, tách task theo một outcome người dùng có thể kiểm tra được, tránh task “refactor toàn bộ frontend” quá rộng.

## 8. Ma trận nghiệm thu cần chạy khi có browser

| Trục        | Trường hợp bắt buộc                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Viewport    | 320, 360/375, 390, 600, 760, 768/769, 840, 1024, 1179/1180/1181, 1280, 1440, 1920; portrait và landscape đại diện                      |
| Text        | EN/VI, title 120 ký tự, summary dài, không có avatar, URL/token dài, dấu tiếng Việt, text zoom 200%, reflow tương đương viewport 320px |
| Input       | Mouse, touch/coarse pointer, Tab/Shift+Tab, Enter/Space/Escape, screen reader, virtual keyboard mở                                     |
| Identity    | Guest, session đang hydrate, member A/B, session hết hạn, reviewer authorized/forbidden                                                |
| Data        | Empty, một record, >30 records, deleted entity, missing fields, long criteria, local optimistic + server canonical cùng id             |
| Network     | Cold cache, slow network, offline, API 404/403/500, upload fail giữa chừng, clipboard denied                                           |
| Motion/GPU  | Normal/reduced motion, Pause/Resume, lazy module đến muộn, WebGL unavailable/context loss, font domain bị chặn                         |
| Persistence | Refresh sau create/save/follow/submit, đổi thiết bị, đổi tài khoản, retry không tạo bản sao                                            |

### Flow acceptance trọng yếu

- Problem bất kỳ → đề xuất Idea → login nếu cần → đúng Primary Problem → lưu đủ field → canonical detail đọc lại được.
- Idea bất kỳ → Start Project → tạo Project thuộc Idea đó; View Project mở quan hệ thật.
- Search từng entity type → đúng route; ví dụ placeholder có kết quả; locale switch không mất query.
- Create có media → lỗi một file → retry → không trùng bài; ảnh/video đọc được trên session khác.
- Submit API 404/500 → không success; submit đúng → receipt server và link bản đã nộp.
- Save/follow/login/logout A→B → không lẫn trạng thái, không mất dữ liệu đã xác nhận.
- Tab xuyên shell/form/modal → focus luôn visible, không bị fixed bar che; đóng modal trả focus đúng.

### Visual acceptance

- Title, tabs, search, feed và empty state cùng container inset; spacing theo token và hierarchy có chủ đích.
- Mobile không có page-level horizontal overflow; vùng cuộn ngang cần thiết có cue và keyboard access.
- Main CTA không bị keyboard/dock che; content có bottom inset theo safe area thật.
- VI không cắt dấu hoặc đụng dòng; fallback font vẫn đọc được.
- Một khu vực quyết định có một CTA nổi bật; semantic status không bị lẫn với category color.
- Có ảnh mới của landing, Home, collection, Problem, Idea, Project, Bounty, composer, auth, wallet, empty/error ở desktop/mobile, ghi build id và viewport.

## 9. Phạm vi chưa thể kết luận

Chưa kết luận lỗi pixel cụ thể trên mọi trang, số lần click end-to-end, clipping do bàn phím iOS, thứ tự focus thực tế, chất lượng screen reader, FPS/GPU, Core Web Vitals hoặc độ tương phản sau mọi lớp opacity. Các mục ghi “rủi ro cần render” phải được xác nhận bằng browser trước khi chốt mức ảnh hưởng.

Báo cáo là inventory **63 phát hiện cụ thể trong phạm vi source/HTTP/ảnh đã kiểm tra**, không phải cam kết đã phát hiện mọi lỗi có thể xảy ra trên mọi thiết bị. Không có mã giao diện hoặc nghiệp vụ nào được sửa trong lượt audit này.
