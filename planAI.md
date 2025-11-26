# 🤖 AI Features Implementation Plan

## 📋 Tổng quan
Triển khai 2 tính năng AI chính cho Gimme-Idea platform:
1. **AI Feedback System** - AI comment và reply trên mỗi idea
2. **AI Market Assessment** - Đánh giá tiềm năng thị trường

---

## 🎯 Mục tiêu

### Feature 1: AI Feedback & Comments
- AI tự động phân tích và comment feedback trên mỗi idea mới
- User có thể reply AI, AI reply lại user
- **Giới hạn**: 1 comment + 2 replies miễn phí/idea, sau đó phải trả tiền

### Feature 2: Market Assessment
- AI đánh giá tiềm năng thị trường của idea
- Hiển thị score, market size, competition level, strengths/weaknesses
- Public data - mọi người đều xem được

---

## 📦 PHASE 1: BACKEND (API & Database)

### ✅ 1.1 Setup & Dependencies
- [x] Install OpenAI SDK (v6.9.1)
- [x] Add OPENAI_API_KEY to .env
- [x] Create AI module structure (service, controller, module)

### ✅ 1.2 Database Schema
- [x] Create `ai_interactions` table (track usage)
- [x] Create `user_ai_credits` table (manage credits/quota)
- [x] Create `ai_market_assessments` table (cache assessments)
- [x] Add columns to `comments` table (is_ai_generated, ai_model, ai_tokens_used)
- [x] Create SQL functions:
  - [x] `can_user_use_ai()` - Check quota
  - [x] `track_ai_interaction()` - Track usage & deduct credits
  - [x] `initialize_user_ai_credits()` - Auto-init for new users
- [x] Create trigger for auto-init credits
- [x] Run migration in Supabase
- [x] Enable RLS policies for security

### ✅ 1.3 AI Service (`backend/src/ai/ai.service.ts`)
- [x] `generateIdeaFeedback()` - Generate AI feedback (GPT-4o-mini)
- [x] `generateReplyToUser()` - AI reply to user questions
- [x] `generateMarketAssessment()` - Market analysis
- [x] `checkUserAIQuota()` - Check remaining credits
- [x] `trackAIInteraction()` - Log usage

### ✅ 1.4 API Endpoints (`backend/src/ai/ai.controller.ts`)
- [x] `POST /api/ai/feedback` - Generate AI feedback
- [x] `POST /api/ai/reply` - Generate AI reply to user
- [x] `POST /api/ai/market-assessment` - Generate market assessment
- [x] `GET /api/ai/quota/:projectId` - Check user's remaining credits
- [x] Add AuthGuard to all endpoints

### ⏳ 1.5 Integration với Comments System
- [ ] Update `CommentsService` to support AI-generated comments
- [ ] Add method `createAIComment()` để tạo AI comment
- [ ] Add flag `is_ai_generated` khi insert comment
- [ ] Trigger AI feedback tự động khi idea mới được tạo (optional - có thể làm manual)

---

## 🎨 PHASE 2: FRONTEND (UI/UX)

### 2.1 AI Comment Component
- [ ] **File**: `frontend/components/AICommentBadge.tsx`
  - [ ] Tạo badge/icon hiển thị "AI Generated"
  - [ ] Styling khác với comment thường (border color, icon robot)

- [ ] **File**: `frontend/components/CommentItem.tsx`
  - [ ] Hiển thị badge nếu `comment.is_ai_generated === true`
  - [ ] Style khác biệt cho AI comments (gradient border, icon)

- [ ] **File**: `frontend/components/AIReplyButton.tsx`
  - [ ] Button "Ask AI" hoặc "Reply to AI"
  - [ ] Show remaining credits (e.g., "2 free replies left")
  - [ ] Disable khi hết credits + show message "Purchase more credits"

### 2.2 AI Feedback Generation
- [ ] **File**: `frontend/components/GenerateAIFeedbackButton.tsx`
  - [ ] Button trên idea detail page: "Get AI Feedback"
  - [ ] Loading state khi đang generate
  - [ ] Error handling (no credits, API error)

- [ ] **File**: `frontend/lib/api/ai.ts`
  - [ ] `generateFeedback(projectId, ideaData)` - Call API
  - [ ] `generateReply(projectId, message, conversationHistory)` - Call API
  - [ ] `checkQuota(projectId)` - Check remaining credits
  - [ ] Error handling

- [ ] **Logic**:
  - [ ] Khi user bấm "Get AI Feedback", call API
  - [ ] Sau khi có response, tạo comment mới với `is_ai_generated: true`
  - [ ] Insert vào comments list
  - [ ] Update credits display

### 2.3 Market Assessment UI
- [ ] **File**: `frontend/components/MarketAssessment.tsx`
  - [ ] Card/section hiển thị market assessment
  - [ ] Show score (0-100) với progress bar/circular gauge
  - [ ] Show market size badge (Small/Medium/Large)
  - [ ] Show competition level badge (Low/Medium/High)
  - [ ] Expandable sections:
    - [ ] Strengths (list)
    - [ ] Weaknesses (list)
    - [ ] Recommendations (list)

- [ ] **File**: `frontend/app/ideas/[id]/page.tsx`
  - [ ] Add `<MarketAssessment />` component
  - [ ] Fetch assessment data from API
  - [ ] Loading state
  - [ ] Cache assessment (don't regenerate mỗi lần)

- [ ] **File**: `frontend/lib/api/ai.ts`
  - [ ] `getMarketAssessment(projectId)` - Fetch từ cache
  - [ ] `generateMarketAssessment(projectId, ideaData)` - Generate mới

### 2.4 Credits/Quota Display
- [ ] **File**: `frontend/components/AICreditsDisplay.tsx`
  - [ ] Show user's remaining free interactions
  - [ ] Show paid credits
  - [ ] "Buy more credits" CTA button

- [ ] **Integration**:
  - [ ] Add to user profile/settings page
  - [ ] Show trong AI feedback button tooltip
  - [ ] Update real-time sau mỗi AI interaction

---

## 💳 PHASE 3: PAYMENT SYSTEM (Credits Purchase)

### 3.1 Credits Packages
- [ ] Define packages (ví dụ: 10 credits = 0.01 SOL, 50 credits = 0.04 SOL)
- [ ] Create UI cho credits purchase page

### 3.2 Backend Integration
- [ ] **File**: `backend/src/payments/payments.service.ts`
  - [ ] Add method `purchaseAICredits(userId, packageId, solAmount)`
  - [ ] Verify Solana transaction
  - [ ] Update `user_ai_credits.paid_credits` after successful payment

- [ ] **File**: `backend/src/payments/payments.controller.ts`
  - [ ] `POST /api/payments/ai-credits` - Purchase credits endpoint

### 3.3 Frontend Purchase Flow
- [ ] **File**: `frontend/components/PurchaseCreditsModal.tsx`
  - [ ] Show available packages
  - [ ] Solana payment integration
  - [ ] Success/error handling

- [ ] **File**: `frontend/lib/api/payments.ts`
  - [ ] `purchaseAICredits(packageId)` - Initiate purchase
  - [ ] `verifyAICreditsPayment(transactionId)` - Verify payment

---

## 🧪 PHASE 4: TESTING

### 4.1 Backend Testing
- [ ] Test `/api/ai/feedback` endpoint
  - [ ] With valid idea data
  - [ ] With missing fields
  - [ ] When user has no credits
- [ ] Test `/api/ai/reply` endpoint
  - [ ] Normal reply flow
  - [ ] With conversation history
  - [ ] Credits deduction
- [ ] Test `/api/ai/market-assessment` endpoint
- [ ] Test `/api/ai/quota/:projectId` endpoint
- [ ] Test SQL functions directly in Supabase

### 4.2 Frontend Testing
- [ ] Test AI feedback generation flow
- [ ] Test AI reply flow
- [ ] Test credits display updates
- [ ] Test market assessment rendering
- [ ] Test error states (no credits, API errors)
- [ ] Test loading states

### 4.3 Integration Testing
- [ ] Create new idea → Generate AI feedback → Reply to AI → AI replies back
- [ ] Check credits deduction after each interaction
- [ ] Verify "out of credits" blocking works
- [ ] Purchase credits → Verify balance updates
- [ ] Test RLS policies (users can't access other's data)

---

## 🚀 PHASE 5: DEPLOYMENT

### 5.1 Environment Setup
- [ ] Add `OPENAI_API_KEY` to Render environment variables
- [ ] Verify database migrations ran on production Supabase
- [ ] Test RLS policies on production

### 5.2 Deploy Backend
- [ ] Push `feature/ai-feedback` branch to remote
- [ ] Deploy to Render (test environment first)
- [ ] Run smoke tests on deployed API

### 5.3 Deploy Frontend
- [ ] Build frontend with AI components
- [ ] Deploy to Vercel/Railway (test environment)
- [ ] Test end-to-end flow on staging

### 5.4 Production Release
- [ ] Merge `feature/ai-feedback` → `main`
- [ ] Deploy to production
- [ ] Monitor logs for errors
- [ ] Monitor OpenAI API usage & costs

---

## 📊 PHASE 6: MONITORING & OPTIMIZATION

### 6.1 Monitoring
- [ ] Track OpenAI API costs (tokens used per request)
- [ ] Monitor error rates
- [ ] Track user engagement (how many use AI features)
- [ ] Track credits purchase conversion rate

### 6.2 Optimization
- [ ] Optimize prompts để giảm token usage
- [ ] Implement caching cho market assessments (already have table)
- [ ] Rate limiting để prevent abuse
- [ ] Consider switching models nếu cần (gpt-4o-mini vs gpt-4)

---

## 🔄 FUTURE ENHANCEMENTS

### Nice-to-have Features
- [ ] AI-powered idea suggestions based on user interests
- [ ] AI-generated questions to help users improve their ideas
- [ ] Sentiment analysis on comments
- [ ] AI-powered trending ideas detection
- [ ] Multi-language support cho AI responses
- [ ] Voice-to-text for AI interactions
- [ ] AI brainstorming assistant

---

## 📝 NOTES

### Quota System Details
- **Free tier**: 3 interactions per idea
  - 1 AI feedback comment
  - 2 AI replies
- **After free tier**: User must purchase credits
- **Paid credits**: Never expire, can be used across all ideas

### OpenAI Model Choice
- Using `gpt-4o-mini` for cost efficiency
- Average cost: ~$0.0001-0.0002 per feedback
- Can switch to `gpt-4` if need higher quality (but 10x more expensive)

### Security Considerations
- ✅ RLS policies enabled on all AI tables
- ✅ API endpoints protected with AuthGuard
- ✅ Backend uses service role key (not exposed to frontend)
- ✅ Rate limiting on AI endpoints (prevent spam)
- ⏳ Input validation on idea data (prevent prompt injection)

---

## 🎯 Success Metrics

### KPIs to Track
1. **Adoption rate**: % of ideas that get AI feedback
2. **Engagement**: Avg replies per AI comment
3. **Conversion**: % of users who purchase credits after free tier
4. **Satisfaction**: User feedback on AI quality
5. **Cost efficiency**: Average cost per AI interaction
