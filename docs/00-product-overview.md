# Gimme Idea — Product Overview

## 1. Product Definition

**Gimme Idea is a problem network for people who want to discover, discuss, research, and solve real-world problems.**

Gimme Idea không chỉ là một Idea Bank.

Idea Bank là một phần của hệ thống, nhưng object trung tâm của product là **Problem**.

Một Problem có thể:
- được phát hiện bởi community;
- được đăng bởi cá nhân;
- được đăng bởi organization/company;
- tồn tại mà chưa có solution;
- có nhiều Idea khác nhau cùng cố gắng giải quyết;
- được attach một Bounty nếu có người sẵn sàng trả tiền để nó được giải quyết.

Core lifecycle:

`Problem → Idea → Project → Submission → Result`

Project sau đó có lifecycle và outcome riêng ngoài đời thực.

---

# 2. Why Gimme Idea Exists

Hiện nay information về problem, idea và những lần build trước đây thường bị phân mảnh giữa:

- social media;
- Discord;
- hackathons;
- GitHub;
- bounty platforms;
- founder communities;
- startup databases;
- pitch decks;
- research reports;
- private community knowledge.

Một builder muốn biết:

> “Có problem nào thực sự đáng giải?”

thường phải tự research từ rất nhiều nguồn.

Ngay cả khi tìm được một idea, họ vẫn khó trả lời:

- Problem này có thật không?
- Ai đang gặp nó?
- Opportunity nằm ở đâu?
- Có ai từng thử chưa?
- Tại sao những project trước đó thành công hoặc thất bại?
- Có phải idea fail, hay chỉ fail vì timing?
- Điều gì đã thay đổi từ lần thử trước?
- Có người nào sẵn sàng trả tiền để problem này được giải quyết không?
- Có builder nào đang build solution tương tự không?

Gimme Idea tập trung toàn bộ những information này thành một hệ thống có cấu trúc.

---

# 3. Core Product Philosophy

## 3.1 Problem First

Gimme Idea không bắt đầu từ:

> “Tôi muốn build app gì?”

Mà bắt đầu từ:

> “Problem nào đang tồn tại?”

Một Problem phải có thể tồn tại mà chưa cần biết solution là gì.

Ví dụ:

**Problem**

Restaurants regularly throw away unsold food because daily demand is difficult to predict.

Problem này không assume rằng solution phải là:

- AI;
- blockchain;
- marketplace;
- mobile app;
- IoT.

Solution được đề xuất sau dưới dạng **Idea**.

---

# 4. Core Objects

## 4.1 Problem

Problem là object gốc của Gimme Idea.

Problem mô tả một vấn đề đang tồn tại trong thực tế.

Problem có thể được đăng miễn phí.

Problem không bắt buộc phải có bounty.

Problem có thể được tạo bởi:

- individual;
- creator;
- builder;
- researcher;
- company;
- organization;
- community.

Thông tin về người tạo và nguồn của Problem là provenance, không phải một trạng thái riêng của Problem.

Một Problem có thể có:

- nhiều Ideas;
- nhiều Discussions;
- optional Bounty;
- research data;
- supporting evidence;
- followers/saves.

---

## 4.2 Idea

Idea là một proposed approach để giải một Problem.

Một Idea bắt buộc phải có một **Primary Problem**.

Một Problem có thể có nhiều Idea cạnh tranh hoặc bổ sung cho nhau.

Ví dụ:

`Problem`

Restaurants waste unsold food.

Có thể có:

`Idea A`

AI demand forecasting.

`Idea B`

Marketplace bán food surplus cuối ngày.

`Idea C`

Dynamic discount pricing.

Idea không phải bản copy của Problem.

Problem và Idea là hai object độc lập và được link với nhau.

---

## 4.3 Previous Attempt

Previous Attempt là một sub-object nằm bên trong Idea.

Nó dùng để lưu những project hoặc approach tương tự đã từng được thử trước đây.

Mục tiêu không phải để kết luận:

> “Idea này đã fail.”

Mà để trả lời:

- Ai từng thử approach tương tự?
- Họ đã làm gì?
- Outcome là gì?
- Failure/success factors là gì?
- Timing lúc đó như thế nào?
- Điều gì đã thay đổi từ đó?
- Previous attempt giống current idea tới mức nào?

Failure phải được xem là multi-factor.

Một project có thể thất bại vì:

- timing;
- distribution;
- capital;
- regulation;
- technical limitations;
- unit economics;
- market readiness;
- team;
- execution.

Failure của một previous attempt không đồng nghĩa current idea sẽ thất bại.

---

## 4.4 Project

Project là thứ thực sự được builder/team bắt đầu build từ một Idea.

Ví dụ:

`Problem`

International freelancers have difficulty receiving cross-border payments.

↓

`Idea`

Stablecoin payroll solution.

↓

`Project`

PayFlow.

Project có thể chứa:

- team;
- GitHub;
- demo;
- website;
- technical information;
- build status;
- progress;
- milestones;
- real-world outcome.

---

## 4.5 Submission

Submission là một lần Idea hoặc Project được gửi vào một opportunity cụ thể.

Ví dụ cùng một Project có thể:

- submit vào Gimme Idea bounty;
- submit vào hackathon;
- submit vào grant;
- submit vào external bounty platform.

Submission không phải Project mới.

Một Project có thể có nhiều Submissions.

Submission Result và Project Outcome phải được tách biệt.

Ví dụ:

Project có thể:

> không thắng hackathon

nhưng sau đó:

> trở thành successful company.

Hoặc:

> thắng hackathon

nhưng sau đó project shutdown.

---

## 4.6 Bounty

Bounty là optional economic layer được attach vào Problem.

Problem không cần có bounty để tồn tại.

Khi một company, organization hoặc sponsor muốn incentivize people giải một Problem, họ có thể tạo Bounty.

Bounty có thể yêu cầu:

- Idea;
- Prototype;
- Full Build.

Nếu Bounty có monetary reward, tiền phải được lock trước khi Bounty được hiển thị là funded.

Funding và payout được xử lý bằng blockchain escrow.

Blockchain chỉ đóng vai trò source of truth cho money-related state.

Problem, Idea, Discussion, Project và research data không cần được lưu on-chain.

---

## 4.7 Discussion

Discussion là social conversation object độc lập.

Problem và Idea pages không nên chứa một traditional comment section dài.

Thay vào đó user có thể chọn:

**Discuss**

Hành động này tạo một Discussion Post reference tới Problem hoặc Idea.

Ví dụ:

> I think this solution will struggle in Vietnam because distribution cost is underestimated.

Post đó reference:

`Idea: X`

Conversation và replies diễn ra trong social layer.

Idea/Problem page sau đó index ngược các discussions liên quan.

Mục tiêu:

**Problem/Idea page = source of truth**

**Discussion = nơi tranh luận**

Điều này giúp giữ canonical pages sạch, đồng thời vẫn tạo social graph và community conversation.

---

# 5. User Roles

Gimme Idea không giới hạn user vào một role cố định.

Một user có thể đồng thời là nhiều role.

## Creator / Problem Scout

Phát hiện và đăng:

- Problems;
- Ideas;
- research;
- opportunities.

## Builder

Tìm Problem/Idea để:

- build;
- prototype;
- submit bounty;
- collaborate.

## Founder

Dùng Gimme Idea để:

- research problem;
- validate idea;
- tìm builder;
- tìm opportunity;
- theo dõi competitor/previous attempts.

## Company / Organization

Có thể:

- đăng Problem;
- attach Bounty;
- review Ideas;
- review Submissions;
- recruit top builders;
- sponsor community activity.

## Viewer / Researcher

Có thể:

- browse;
- save;
- follow;
- discuss;
- research.

---

# 6. Problem and Bounty Relationship

Gimme Idea không phải một bounty board.

Free Problems là một phần cốt lõi của product.

Một Problem có thể tồn tại trong nhiều năm mà chưa có ai trả tiền để giải quyết.

Ví dụ:

`Problem`

SMEs struggle to accurately forecast inventory demand.

Problem này vẫn có thể:

- được research;
- có Ideas;
- có Discussions;
- có builders interested;
- có saves/follows.

Sau đó một company có thể attach:

`$20,000 Bounty`

vào chính Problem đó.

Vì vậy:

`Problem`

là knowledge/demand object.

`Bounty`

là economic activation của Problem.

---

# 7. AI Role

AI không phải owner của Idea.

AI không được biến input của user thành một idea khác.

User chịu trách nhiệm cho core thesis của Idea.

User tự nhập tối thiểu:

- Title;
- One-line description;
- Problem;
- Opportunity;
- Solution.

User cũng có thể tự nhập bất kỳ detail nào họ biết.

AI chỉ đóng vai trò:

**Researcher**

và:

**Verifier**

---

## 7.1 AI Researcher

AI Researcher tìm thêm information mà user chưa điền.

Ví dụ:

- competitors;
- existing solutions;
- previous attempts;
- market evidence;
- regulatory constraints;
- technical risks;
- business risks;
- timing signals;
- relevant reports;
- relevant projects.

AI không được tự bịa information để fill đủ schema.

Nếu không có đủ evidence:

`Unknown`

hoặc:

`Insufficient evidence`

phải là valid output.

---

## 7.2 AI Verifier

AI Verifier không phải AI Researcher thứ hai.

Nhiệm vụ của verifier là audit research result.

Nó kiểm tra:

- source tồn tại hay không;
- source có thực sự support claim hay không;
- factual consistency;
- contradictory information;
- source freshness;
- unsupported assumptions.

AI Verifier không được quyết định:

> Idea này tốt hay xấu.

Nó chỉ đánh giá information quality.

---

## 7.3 Data Provenance

Research data phải phân biệt rõ:

- `user_provided`
- `ai_researched`
- `ai_verified`

User phải biết phần nào là thesis của creator và phần nào là research bổ sung của Gimme Idea.

---

# 8. Reading Experience

Gimme Idea phải phục vụ cả:

- low-tech users;
- technical builders;
- founders;
- professional researchers.

Không tạo hai bộ dữ liệu khác nhau.

Mỗi object có một canonical dataset.

UI có thể cung cấp hai mức đọc:

**Overview**

Thông tin cốt lõi, dễ scan và chủ yếu đến từ creator/user.

**Details / Research**

Research sâu, evidence, previous attempts, technical/business/regulatory data và sources.

AI không được tự rewrite một Idea thành “phiên bản cho người ngu” và “phiên bản cho chuyên gia”.

Hai reading modes chỉ là hai cách expose cùng một canonical dataset.

---

# 9. Social Model

Gimme Idea có social layer nhưng không phải social network generic.

Social interactions phải xoay quanh:

- Problems;
- Ideas;
- Projects;
- Builds;
- research;
- viewpoints.

Core interactions:

- Like
- Save
- Follow
- Discuss
- Share
- Quote/reference
- Build

User có thể save Problem/Idea vào collection/folder riêng.

Discussion Post có thể reference tới một canonical object.

Canonical object cũng hiển thị các discussions liên quan để người research có thể xem nhiều viewpoints.

---

# 10. Economic Model

Gimme Idea có hai loop khác nhau.

## Community / Growth Loop

`Problem`

↓

`Idea`

↓

`Discussion`

↓

`Research`

↓

`Build`

↓

`Reputation`

↓

thêm creators/builders.

---

## Economic Loop

Money phải đến từ một external payer.

Potential sources:

### Problem Owner

Trả tiền để Problem của họ được giải quyết.

### Sponsor

Không nhất thiết sở hữu Problem.

Sponsor có thể trả tiền để:

- tiếp cận builders;
- thúc đẩy ecosystem/tool adoption;
- sponsor category/challenge;
- tuyển talent.

### Hiring

Top builders có thể nhận hiring opportunities từ:

- sponsoring company;
- other companies;
- Gimme Idea projects.

Winning bounty không tự động biến builder thành employee.

Nó chỉ tạo proof-of-skill và mở hiring opportunity.

### Power Users

Trong tương lai có thể trả subscription cho:

- deeper research;
- alerts;
- advanced filters;
- monitoring;
- exports;
- market/problem intelligence.

### Users

Có thể trực tiếp tip creator/builder.

---

# 11. Creator Monetization Principle

Gimme Idea không nên mặc định trả creator chỉ vì họ tạo page views.

Nếu platform tự trả tiền theo views bằng treasury/fund:

`Fund → Creator → Views`

thì đây chỉ là subsidy, không phải sustainable revenue loop.

Creator monetization nên gắn với economic value được tạo ra.

Ví dụ:

Một creator phát hiện một valuable Problem.

Sau đó một company fund Problem đó.

Creator có thể nhận một phần reward/referral/scouting incentive.

Tương tự, Idea creator hoặc builder có thể nhận reward khi contribution của họ tạo value thực tế.

Core principle:

**Users should earn when something they discovered, proposed, or built becomes valuable — not merely because it generated clicks.**

---

# 12. Long-Term Network Effect

Gimme Idea hướng tới network effect giữa:

### Problem Supply

Nhiều Problem tốt hơn.

↓

### Creator / Research Supply

Nhiều people research và propose solutions.

↓

### Builder Supply

Nhiều builders tìm nơi đáng build.

↓

### Solution Quality

Nhiều Ideas và Projects tốt hơn.

↓

### Company Demand

Company có nhiều lý do đăng/fund Problems.

↓

### Economic Opportunities

Nhiều bounty, hiring và commercial opportunities hơn.

↓

### More Builders and Creators

Loop tiếp tục.

---

# 13. Initial Bootstrap Strategy

Gimme Idea không thể chờ community tự hình thành.

Giai đoạn đầu cần seed supply.

Initial sources có thể gồm:

- manually curated Problems;
- manually curated Ideas;
- hackathon projects;
- public Colosseum data;
- public ecosystem data;
- carefully reviewed internal research datasets;
- sponsored bounty opportunities;
- external bounty/grant opportunities.

Internal/private datasets không được copy trực tiếp sang public product nếu chưa được review về:

- confidentiality;
- competitive intelligence;
- legal information;
- source licensing;
- personal information.

---

# 14. Product Boundaries

Gimme Idea V1 không cố trở thành:

- full project management tool;
- GitHub replacement;
- Discord replacement;
- generalized social network;
- generic freelance marketplace;
- generic AI idea generator;
- crypto-only platform;
- fully on-chain application.

Blockchain được sử dụng khi blockchain đem lại value rõ ràng, đặc biệt:

- escrow;
- bounty funding;
- payout;
- payment proof.

Low-tech users không cần hiểu blockchain hoặc có crypto wallet chỉ để:

- browse;
- research;
- create Problem;
- create Idea;
- discuss.

---

# 15. Initial Technical Scale Target

V1 architecture phải được thiết kế để chịu khoảng:

**5,000 concurrent users**

với workload chủ yếu là read-heavy.

Architecture phải ưu tiên:

- stateless API;
- CDN/cache;
- PostgreSQL connection pooling;
- asynchronous workers;
- queue-based AI processing;
- asynchronous blockchain confirmation;
- idempotent webhook handling.

Không over-engineer cho 100k concurrent ngay từ đầu.

System architecture chi tiết được định nghĩa trong:

`03-system-architecture.md`

---

# 16. Frontend Direction

Frontend phải được triển khai với **Zahlook skill** để đảm bảo design quality, interaction states, responsiveness và consistency.

Product không được có cảm giác generic SaaS dashboard.

Visual direction:

- experimental;
- technical;
- intelligent;
- builder-focused;
- research-oriented;
- premium;
- playful ở mức vừa phải.

Landing page phải có strong visual storytelling.

Hero concept:

**3D Brain / Idea Network**

Dùng Three.js.

Khi user scroll:

- brain rotate trong không gian;
- cấu trúc brain dần tách ra;
- các concept/idea fragments bung ra xung quanh;
- fragments có thể mang hình tượng:
  - puzzle pieces;
  - light bulbs;
  - nodes;
  - code symbols;
  - sticky notes;
  - sparks;
  - abstract idea objects.

Animation phải thể hiện metaphor:

**A problem enters the network → ideas emerge → ideas connect → builders turn them into reality.**

Three.js experience phải có:

- smooth scroll synchronization;
- strong desktop experience;
- lightweight mobile fallback;
- reduced-motion support;
- performance fallback cho low-end devices.

3D visual không được làm ảnh hưởng nghiêm trọng tới:

- LCP;
- INP;
- CLS;
- navigation;
- readability.

Detailed UI requirements được định nghĩa trong:

`07-frontend-design-brief.md`

---

# 17. Core Product Statement

Gimme Idea không chỉ trả lời:

> “Bạn nên build cái gì?”

Nó hướng tới trả lời:

> “Problem nào đang tồn tại?”

> “Ai đang gặp problem đó?”

> “Những solution nào đã được đề xuất?”

> “Ai từng thử trước đây?”

> “Điều gì đã xảy ra?”

> “Tại sao nó thành công hoặc thất bại?”

> “Điều gì đã thay đổi?”

> “Ai đang build nó bây giờ?”

> “Có ai sẵn sàng trả tiền để nó được giải quyết không?”

The goal is to turn fragmented knowledge about problems and ideas into a living network where people can research, discuss, build, fund, and eventually solve them.