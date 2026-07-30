'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Lightbulb, 
  Rocket, 
  Users, 
  Wallet, 
  FileText, 
  HelpCircle, 
  Map, 
  Shield, 
  Sparkles,
  Target,
  Zap,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Code,
  Languages,
} from 'lucide-react';

// Language content
const content = {
  en: {
    // Hero
    badge: 'Documentation',
    heroTitle: 'Welcome to',
    heroSubtitle: 'A Solana-native builder platform to publish ideas/projects, get AI + community feedback, run idea pools, and automate workflows with Agent Mode.',
    exploreBtn: 'Explore Ideas',
    privacyBtn: 'Privacy & Terms',
    
    // Sections
    sections: {
      overview: 'Overview',
      value: 'Value Proposition',
      guide: 'User Guide',
      faq: 'FAQ',
      roadmap: 'Roadmap',
    },

    // Overview
    whatIs: 'What is Gimme Idea?',
    whatIsDesc: 'Gimme Idea is a decentralized innovation platform built on Solana where creators, developers, and visionaries share their ideas with the world. Whether you have a groundbreaking DeFi protocol, an innovative NFT concept, or a solution to everyday problems, Gimme Idea provides the stage for your vision.',
    shareIdeas: 'Share Ideas',
    shareIdeasDesc: 'Post your innovative concepts and get visibility from the Solana community',
    getFeedback: 'Get Feedback',
    getFeedbackDesc: 'Receive valuable insights, comments, and AI-powered analysis on your ideas',
    earnRewards: 'Earn Rewards',
    earnRewardsDesc: 'Get tipped in SOL for great ideas and climb the reputation leaderboard',
    howItWorks: 'How It Works',
    steps: [
      { step: '1', title: 'Create Account', desc: 'Sign in with wallet, Google, or Agent secret key (for automation)' },
      { step: '2', title: 'Set Up Identity', desc: 'Complete profile; connect wallet if you want to receive on-chain tips' },
      { step: '3', title: 'Publish', desc: 'Post ideas/projects with clear Problem → Solution → Opportunity' },
      { step: '4', title: 'Improve & Execute', desc: 'Use AI feedback, comments, votes, and idea-pool signals to iterate' },
    ],

    // Value Proposition
    whyGimme: 'Why Gimme Idea?',
    forCreators: 'For Creators',
    creatorBenefits: [
      'Showcase your ideas to thousands of Solana enthusiasts',
      'Receive instant feedback and AI-powered market analysis',
      'Earn SOL tips for innovative concepts',
      'Build your reputation and follower base',
      'Connect with potential collaborators and investors',
    ],
    forCommunity: 'For the Community',
    communityBenefits: [
      'Discover groundbreaking ideas before they go mainstream',
      'Support creators you believe in with SOL tips',
      'Participate in shaping the future of Solana',
      'Join hackathons and win prizes',
      'Be part of a thriving innovation ecosystem',
    ],
    keyFeatures: 'Key Features',
    features: [
      { title: 'AI Analysis', desc: 'Get idea scoring, critique, and market assessment from Gimme Sensei' },
      { title: 'Idea Pools', desc: 'Track pass/fail sentiment and proposal signals for high-conviction ideas' },
      { title: 'Tip System', desc: 'Support creators directly with Solana payments' },
      { title: 'Reputation', desc: 'Build credibility through useful ideas and constructive feedback' },
      { title: 'Agent Mode + API', desc: 'Automate actions safely with secret-key agent auth and PAT/API tokens' },
      { title: 'Hackathons & Feeds', desc: 'Join challenge tracks and curate discovery with personalized feeds' },
    ],

    // User Guide
    userGuide: 'User Guide',
    gettingStarted: 'Getting Started',
    step1Title: 'Step 1: Create Your Account',
    step1Desc: 'Click "Sign In" in the top right corner and authenticate with your Google account. This creates your Gimme Idea profile automatically.',
    step2Title: 'Step 2: Connect Your Wallet (Optional)',
    step2Desc: 'To receive tips from the community, connect your Solana wallet:',
    step2Items: [
      'Click "Connect Wallet" in your profile',
      'Select Phantom, Solflare, or use Mobile Wallet on phones',
      'Sign the verification message',
      'Your wallet is now linked to receive SOL tips!',
    ],
    step3Title: 'Step 3: Complete Your Profile',
    step3Desc: 'Add a username, bio, avatar, and social links to build your credibility in the community.',
    howToSubmit: 'How to Submit an Idea',
    submitSteps: [
      { title: 'Click "Submit Idea"', desc: 'Find the submit button in the navigation bar or homepage' },
      { title: 'Fill in the Details', desc: 'Provide a compelling title, detailed description, select a category (DeFi, NFT, Gaming, etc.), and add relevant tags' },
      { title: 'Add Context (Optional)', desc: 'Include the problem you\'re solving, your proposed solution, and any supporting links or images' },
      { title: 'Submit & Share', desc: 'Click submit and share your idea with the community. Get feedback, tips, and AI analysis!' },
    ],
    tipsForSuccess: 'Tips for a Great Submission',
    successTips: [
      { tip: 'Be Specific', desc: 'Clearly explain what makes your idea unique' },
      { tip: 'Show the Problem', desc: 'Explain the pain point you\'re solving' },
      { tip: 'Use Visuals', desc: 'Add mockups or diagrams when possible' },
      { tip: 'Engage with Comments', desc: 'Respond to feedback and iterate' },
      { tip: 'Choose Right Category', desc: 'Help users discover your idea easily' },
      { tip: 'Add Social Proof', desc: 'Link to relevant work or credentials' },
    ],

    // FAQ
    faqTitle: 'Frequently Asked Questions',
    faqs: [
      { q: 'Do I need a wallet to use Gimme Idea?', a: 'No. You can use Google or Agent Mode to create and run an account. Wallet connection is optional and mainly needed for direct on-chain tip flows and certain Solana actions.' },
      { q: 'What is Agent Mode?', a: 'Agent Mode lets automation tools operate a persistent Gimme Idea account using a secret key. The key is shown once at creation, must be stored safely, and can be rotated/revoked anytime.' },
      { q: 'What are API Tokens / PAT?', a: 'PAT tokens allow trusted scripts and integrations to call user APIs with scoped permissions. Token plaintext is shown once only; the backend stores a hash + metadata.' },
      { q: 'How does AI scoring work?', a: 'Gimme Sensei evaluates your idea and returns a score with strengths, weaknesses, and suggested next actions. Use it as guidance, not as final truth, then iterate with real user feedback.' },
      { q: 'Can I post ideas anonymously?', a: 'No, top-level idea/project posting is not anonymous. This improves accountability and reduces impersonation. Anonymous comments may still be available in supported flows.' },
      { q: 'How do idea pools work?', a: 'For supported ideas, community sentiment can be tracked through pass/fail pool and proposal-related endpoints. This helps surface conviction and execution signals over time.' },
      { q: 'Can I edit or delete my content?', a: 'Yes, owners can edit or delete their own ideas/comments. Ownership checks are enforced server-side, and non-owner delete requests will be rejected.' },
      { q: 'How do tips work?', a: 'Tips are peer-to-peer blockchain transactions. Transfers are final on-chain, and users are responsible for destination wallet correctness.' },
      { q: 'Is my data secure?', a: 'We store account/profile/content data required to run the product. Sensitive tokens/keys are never stored in plaintext after issuance. See Privacy Policy for full details.' },
      { q: 'How can I report abuse or security issues?', a: 'Use in-app reporting for content abuse and contact the team email for urgent trust/safety or security incidents.' },
    ],

    // Roadmap
    roadmapTitle: 'Product Roadmap',
    weAreHere: 'Current',
    phases: [
      {
        phase: 'Phase 1', title: 'Foundation', status: 'completed', date: 'Q4 2025',
        items: ['Platform launch with core features', 'Google authentication', 'Idea submission & browsing', 'SOL tipping system', 'Basic user profiles']
      },
      {
        phase: 'Phase 2', title: 'Growth', status: 'current', date: 'Q1 2026',
        items: [
          { text: 'AI-powered idea analysis', status: 'completed' },
          { text: 'Follow system & notifications', status: 'completed' },
          { text: 'Hackathon feature', status: 'in-progress' },
          { text: 'Monthly Idea Challenge', status: 'pending' }
        ]
      },
      {
        phase: 'Phase 3', title: 'Idea Pool System', status: 'upcoming', date: 'Q2 2026',
        items: ['Idea Pool with unique token per idea', 'Community staking mechanism', 'Builder proposal system', 'Revenue sharing for stakers & creators', 'Collaboration tools']
      },
      {
        phase: 'Phase 4', title: 'Ecosystem', status: 'planned', date: 'Q3-Q4 2026',
        items: ['Advanced analytics dashboard', 'Investor matching', 'Grant program for builders', 'API for integrations', 'Multi-chain support']
      },
    ],

    // Footer
    footerTitle: 'Ready to Share Your Ideas?',
    footerDesc: 'Join thousands of innovators building the future of Solana. Your next big idea is waiting to be discovered.',
    getStarted: 'Get Started',
  },
  vi: {
    // Hero
    badge: 'Tài liệu',
    heroTitle: 'Chào mừng đến với',
    heroSubtitle: 'Nền tảng builder trên Solana để đăng idea/project, nhận phản hồi AI + cộng đồng, theo dõi idea pool và tự động hoá bằng Agent Mode.',
    exploreBtn: 'Khám phá Ý tưởng',
    privacyBtn: 'Quyền riêng tư',
    
    // Sections
    sections: {
      overview: 'Tổng quan',
      value: 'Giá trị',
      guide: 'Hướng dẫn',
      faq: 'Câu hỏi thường gặp',
      roadmap: 'Lộ trình',
    },

    // Overview
    whatIs: 'Gimme Idea là gì?',
    whatIsDesc: 'Gimme Idea là một nền tảng đổi mới sáng tạo phi tập trung được xây dựng trên Solana, nơi các nhà sáng tạo, nhà phát triển và những người có tầm nhìn chia sẻ ý tưởng của họ với thế giới. Dù bạn có một giao thức DeFi đột phá, một khái niệm NFT sáng tạo, hay một giải pháp cho các vấn đề hàng ngày, Gimme Idea cung cấp sân khấu cho tầm nhìn của bạn.',
    shareIdeas: 'Chia sẻ Ý tưởng',
    shareIdeasDesc: 'Đăng các ý tưởng sáng tạo và được cộng đồng Solana chú ý',
    getFeedback: 'Nhận Phản hồi',
    getFeedbackDesc: 'Nhận những góp ý quý giá, bình luận và phân tích được hỗ trợ bởi AI',
    earnRewards: 'Kiếm Phần thưởng',
    earnRewardsDesc: 'Nhận tip SOL cho những ý tưởng hay và leo lên bảng xếp hạng',
    howItWorks: 'Cách hoạt động',
    steps: [
      { step: '1', title: 'Tạo tài khoản', desc: 'Đăng nhập bằng wallet, Google hoặc Agent secret key' },
      { step: '2', title: 'Thiết lập danh tính', desc: 'Hoàn thiện hồ sơ; kết nối ví nếu muốn nhận tip on-chain' },
      { step: '3', title: 'Đăng nội dung', desc: 'Đăng idea/project với Problem → Solution → Opportunity rõ ràng' },
      { step: '4', title: 'Lặp và phát triển', desc: 'Dùng AI feedback, comment, vote và pool signal để cải tiến' },
    ],

    // Value Proposition
    whyGimme: 'Tại sao chọn Gimme Idea?',
    forCreators: 'Dành cho Nhà sáng tạo',
    creatorBenefits: [
      'Giới thiệu ý tưởng đến hàng ngàn người yêu thích Solana',
      'Nhận phản hồi tức thì và phân tích thị trường bằng AI',
      'Kiếm tip SOL cho những ý tưởng sáng tạo',
      'Xây dựng uy tín và lượng người theo dõi',
      'Kết nối với cộng tác viên và nhà đầu tư tiềm năng',
    ],
    forCommunity: 'Dành cho Cộng đồng',
    communityBenefits: [
      'Khám phá những ý tưởng đột phá trước khi trở nên phổ biến',
      'Hỗ trợ các nhà sáng tạo bạn tin tưởng bằng tip SOL',
      'Tham gia định hình tương lai của Solana',
      'Tham gia hackathon và giành giải thưởng',
      'Trở thành một phần của hệ sinh thái đổi mới sôi động',
    ],
    keyFeatures: 'Tính năng chính',
    features: [
      { title: 'Phân tích AI', desc: 'Nhận điểm chấm, phân tích thị trường và feedback từ Gimme Sensei' },
      { title: 'Idea Pool', desc: 'Theo dõi pass/fail sentiment và tín hiệu proposal cho idea' },
      { title: 'Hệ thống Tip', desc: 'Hỗ trợ creator trực tiếp bằng thanh toán trên Solana' },
      { title: 'Uy tín', desc: 'Tăng credibility qua đóng góp chất lượng và tương tác tốt' },
      { title: 'Agent Mode + API', desc: 'Tự động hoá an toàn bằng agent secret key và PAT/API token' },
      { title: 'Hackathons & Feeds', desc: 'Tham gia challenge và khám phá nội dung qua feed cá nhân hoá' },
    ],

    // User Guide
    userGuide: 'Hướng dẫn Sử dụng',
    gettingStarted: 'Bắt đầu',
    step1Title: 'Bước 1: Tạo Tài khoản',
    step1Desc: 'Nhấp "Đăng nhập" ở góc trên bên phải và xác thực bằng tài khoản Google. Profile Gimme Idea sẽ được tạo tự động.',
    step2Title: 'Bước 2: Kết nối Ví (Tùy chọn)',
    step2Desc: 'Để nhận tip từ cộng đồng, hãy kết nối ví Solana:',
    step2Items: [
      'Nhấp "Kết nối Ví" trong hồ sơ của bạn',
      'Chọn Phantom, Solflare, hoặc Mobile Wallet trên điện thoại',
      'Ký tin nhắn xác minh',
      'Ví của bạn đã được liên kết để nhận tip SOL!',
    ],
    step3Title: 'Bước 3: Hoàn thiện Hồ sơ',
    step3Desc: 'Thêm username, bio, avatar và liên kết mạng xã hội để xây dựng uy tín trong cộng đồng.',
    howToSubmit: 'Cách Đăng Ý tưởng',
    submitSteps: [
      { title: 'Nhấp "Đăng Ý tưởng"', desc: 'Tìm nút đăng trên thanh điều hướng hoặc trang chủ' },
      { title: 'Điền thông tin', desc: 'Cung cấp tiêu đề hấp dẫn, mô tả chi tiết, chọn danh mục (DeFi, NFT, Gaming, v.v.) và thêm tags' },
      { title: 'Thêm Ngữ cảnh (Tùy chọn)', desc: 'Bao gồm vấn đề bạn đang giải quyết, giải pháp đề xuất và các link hoặc hình ảnh hỗ trợ' },
      { title: 'Gửi & Chia sẻ', desc: 'Nhấp gửi và chia sẻ ý tưởng với cộng đồng. Nhận phản hồi, tip và phân tích AI!' },
    ],
    tipsForSuccess: 'Mẹo để Thành công',
    successTips: [
      { tip: 'Cụ thể', desc: 'Giải thích rõ điều gì làm ý tưởng của bạn độc đáo' },
      { tip: 'Nêu Vấn đề', desc: 'Giải thích pain point bạn đang giải quyết' },
      { tip: 'Dùng Hình ảnh', desc: 'Thêm mockup hoặc sơ đồ khi có thể' },
      { tip: 'Tương tác', desc: 'Phản hồi feedback và cải thiện' },
      { tip: 'Chọn đúng Danh mục', desc: 'Giúp người dùng dễ dàng tìm thấy ý tưởng' },
      { tip: 'Thêm Bằng chứng', desc: 'Link đến các công việc liên quan hoặc credentials' },
    ],

    // FAQ
    faqTitle: 'Câu hỏi Thường gặp',
    faqs: [
      { q: 'Có cần ví để sử dụng Gimme Idea không?', a: 'Không! Bạn có thể đăng nhập bằng Google, duyệt, đăng ý tưởng và bình luận mà không cần ví. Tuy nhiên, bạn cần kết nối ví Solana để nhận tip từ cộng đồng.' },
      { q: 'Tip hoạt động như thế nào?', a: 'Khi ai đó thích ý tưởng của bạn, họ có thể gửi SOL trực tiếp vào ví đã kết nối của bạn. Tip là giao dịch on-chain tức thì, không có phí nền tảng.' },
      { q: 'Tính năng Phân tích AI là gì?', a: 'AI của chúng tôi phân tích ý tưởng và cung cấp đánh giá thị trường, điểm khả thi và gợi ý cải thiện. Nó giúp bạn hoàn thiện concept và hiểu tiềm năng.' },
      { q: 'Có thể đăng ý tưởng ẩn danh không?', a: 'Có! Khi đăng ý tưởng, bạn có thể bật "Đăng Ẩn danh" để ẩn danh tính. Username sẽ không hiển thị, nhưng bạn vẫn nhận được tip nếu đã kết nối ví.' },
      { q: 'Hệ thống uy tín hoạt động thế nào?', a: 'Bạn kiếm điểm uy tín bằng cách đăng ý tưởng chất lượng, nhận upvote, tip và tương tác tích cực với cộng đồng. Uy tín cao hơn mở khóa tính năng và tăng visibility.' },
      { q: 'Hackathons là gì?', a: 'Hackathons là các thử thách theo chủ đề nơi bạn có thể đăng ý tưởng cho các topic cụ thể. Thường có prize pool và deadline. Xem trang Hackathons để biết các sự kiện đang diễn ra.' },
      { q: 'Làm sao để kết nối ví trên mobile?', a: 'Trên trình duyệt mobile, nhấp "Kết nối Ví" và chọn "Mobile Wallet". Điều này mở ứng dụng ví (Phantom/Solflare) qua deep link, ký tin nhắn và bạn sẽ được chuyển hướng trở lại.' },
      { q: 'Dữ liệu của tôi có an toàn không?', a: 'Có! Chúng tôi chỉ lưu địa chỉ ví công khai (không có private key), email để xác thực và nội dung bạn chọn chia sẻ. Xem Chính sách Bảo mật để biết chi tiết.' },
      { q: 'Tôi có thể sửa hoặc xóa ý tưởng không?', a: 'Có, bạn có thể sửa ý tưởng bất cứ lúc nào từ profile. Xóa cũng được, nhưng tip đã nhận không thể hoàn lại.' },
      { q: 'Làm sao để báo cáo nội dung không phù hợp?', a: 'Nhấp vào menu ba chấm trên bất kỳ ý tưởng hoặc bình luận nào và chọn "Báo cáo". Đội ngũ kiểm duyệt xem xét tất cả báo cáo trong vòng 24 giờ.' },
    ],

    // Roadmap
    roadmapTitle: 'Lộ trình Sản phẩm',
    weAreHere: 'Đang thực hiện',
    phases: [
      {
        phase: 'Giai đoạn 1', title: 'Nền tảng', status: 'completed', date: 'Q4 2025',
        items: ['Ra mắt platform với tính năng cốt lõi', 'Xác thực Google', 'Đăng & duyệt ý tưởng', 'Hệ thống tip SOL', 'Hồ sơ người dùng cơ bản']
      },
      {
        phase: 'Giai đoạn 2', title: 'Tăng trưởng', status: 'current', date: 'Q1 2026',
        items: [
          { text: 'Phân tích ý tưởng bằng AI', status: 'completed' },
          { text: 'Hệ thống theo dõi & thông báo', status: 'completed' },
          { text: 'Tính năng Hackathon', status: 'in-progress' },
          { text: 'Monthly Idea Challenge', status: 'pending' }
        ]
      },
      {
        phase: 'Giai đoạn 3', title: 'Idea Pool System', status: 'upcoming', date: 'Q2 2026',
        items: ['Idea Pool với token riêng cho mỗi ý tưởng', 'Cơ chế staking từ cộng đồng', 'Hệ thống proposal cho builders', 'Chia sẻ lợi nhuận cho stakers & creators', 'Công cụ cộng tác']
      },
      {
        phase: 'Giai đoạn 4', title: 'Hệ sinh thái', status: 'planned', date: 'Q3-Q4 2026',
        items: ['Dashboard phân tích nâng cao', 'Kết nối nhà đầu tư', 'Chương trình grant cho builders', 'API tích hợp', 'Hỗ trợ đa chuỗi']
      },
    ],

    // Footer
    footerTitle: 'Sẵn sàng Chia sẻ Ý tưởng?',
    footerDesc: 'Tham gia cùng hàng ngàn nhà đổi mới xây dựng tương lai của Solana. Ý tưởng lớn tiếp theo của bạn đang chờ được khám phá.',
    getStarted: 'Bắt đầu ngay',
  },
};

type Language = 'en' | 'vi';

const DocsPage = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [lang, setLang] = useState<Language>('en');
  
  const t = content[lang];

  const sections = [
    { id: 'overview', title: t.sections.overview, icon: Lightbulb },
    { id: 'value', title: t.sections.value, icon: Target },
    { id: 'guide', title: t.sections.guide, icon: FileText },
    { id: 'faq', title: t.sections.faq, icon: HelpCircle },
    { id: 'roadmap', title: t.sections.roadmap, icon: Map },
  ];

  const featureIcons = [Sparkles, Heart, Star, Users, Code, Shield];
  const valueColumns = [
    { title: t.forCreators, icon: Zap, items: t.creatorBenefits, tone: 'text-cyan-200' },
    { title: t.forCommunity, icon: Globe, items: t.communityBenefits, tone: 'text-[#FFD700]' },
  ];

  return (
    <main className="min-h-screen text-gray-300">
      <section className="border-b border-white/10 pb-10 pt-28">
        <div className="page-shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="ui-eyebrow">{t.badge}</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {t.heroTitle}{' '}
                <span className="text-[#FFD700]">Gimme Idea</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
                {t.heroSubtitle}
              </p>
              <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                <Link href="/idea" className="btn-primary">
                  <Rocket className="w-5 h-5" />
                  {t.exploreBtn}
                </Link>
                <Link href="/privacy" className="btn-ghost">
                  <Shield className="w-5 h-5" />
                  {t.privacyBtn}
                </Link>
              </div>
            </div>

            <div className="w-full border border-white/10 bg-white/[0.03] p-3 sm:w-auto">
              <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase text-gray-500">
                <Languages className="h-4 w-4" aria-hidden="true" />
                Language
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(['en', 'vi'] as Language[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLang(option)}
                    aria-pressed={lang === option}
                    className={`min-h-[40px] border px-4 text-xs font-semibold uppercase transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700] ${
                      lang === option
                        ? 'border-[#FFD700]/40 bg-[#FFD700] text-black'
                        : 'border-white/10 bg-white/[0.03] text-gray-400 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="page-shell">
          <div className="flex overflow-x-auto gap-0 py-4 scrollbar-hide">
            {sections.map((section) => (
              <button
                type="button"
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`ui-tab ${activeSection === section.id ? 'ui-tab-active' : ''}`}
              >
                <section.icon className="w-4 h-4" aria-hidden="true" />
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-shell py-10">
        {activeSection === 'overview' && (
          <section className="space-y-10">
            <div className="border border-white/10 bg-white/[0.03] p-5 sm:p-7">
              <h2 className="flex items-center gap-3 text-2xl font-semibold text-white">
                <Lightbulb className="w-7 h-7 text-[#FFD700]" aria-hidden="true" />
                {t.whatIs}
              </h2>
              <p className="mt-4 max-w-4xl text-base leading-7 text-gray-400">{t.whatIsDesc}</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Sparkles, title: t.shareIdeas, text: t.shareIdeasDesc },
                  { icon: Users, title: t.getFeedback, text: t.getFeedbackDesc },
                  { icon: Wallet, title: t.earnRewards, text: t.earnRewardsDesc },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="border border-white/10 bg-black/20 p-4">
                      <Icon className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                      <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xl font-semibold text-white">{t.howItWorks}</h2>
              <div className="grid gap-4 md:grid-cols-4">
                {t.steps.map((item) => (
                  <div key={item.step} className="border border-white/10 bg-white/[0.03] p-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center bg-[#FFD700] text-sm font-semibold text-black">{item.step}</span>
                    <h3 className="mt-4 text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'value' && (
          <section className="space-y-8">
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-white">
              <Target className="w-7 h-7 text-[#FFD700]" aria-hidden="true" />
                {t.whyGimme}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {valueColumns.map((column) => {
                const Icon = column.icon;
                return (
                  <div key={column.title} className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                      <Icon className={`h-5 w-5 ${column.tone}`} aria-hidden="true" />
                      {column.title}
                    </h3>
                    <ul className="space-y-3">
                      {column.items.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-gray-300">
                          <CheckCircle className={`mt-0.5 h-4 w-4 flex-shrink-0 ${column.tone}`} aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  </div>
                );
              })}
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold text-white">{t.keyFeatures}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {t.features.map((feature, index) => {
                  const Icon = featureIcons[index] || Sparkles;
                  return (
                    <div key={feature.title} className="border border-white/10 bg-white/[0.03] p-5">
                      <Icon className="h-5 w-5 text-[#FFD700]" aria-hidden="true" />
                      <h4 className="mt-4 text-sm font-semibold text-white">{feature.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'guide' && (
          <section className="space-y-8">
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-white">
              <FileText className="w-7 h-7 text-[#FFD700]" aria-hidden="true" />
                {t.userGuide}
            </h2>
            <div className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-white">{t.gettingStarted}</h3>
              <div className="mt-5 space-y-6">
                <div>
                  <h4 className="font-semibold text-[#FFD700]">{t.step1Title}</h4>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                      {t.step1Desc}
                    </p>
                </div>
                <div>
                  <h4 className="font-semibold text-[#FFD700]">{t.step2Title}</h4>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                      {t.step2Desc}
                    </p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-400">
                    {t.step2Items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FFD700]" aria-hidden="true" />
                        {item}
                      </li>
                      ))}
                    </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-[#FFD700]">{t.step3Title}</h4>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                      {t.step3Desc}
                    </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-white">{t.howToSubmit}</h3>
                <div className="mt-5 space-y-4">
                  {t.submitSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center bg-[#FFD700] text-sm font-semibold text-black">{index + 1}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{step.title}</h4>
                        <p className="mt-1 text-sm leading-6 text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#FFD700]/25 bg-[#FFD700]/10 p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-white">{t.tipsForSuccess}</h3>
                <div className="mt-5 space-y-4">
                  {t.successTips.map((item) => (
                    <div key={item.tip} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FFD700]" aria-hidden="true" />
                      <div>
                        <span className="text-sm font-semibold text-white">{item.tip}</span>
                        <p className="mt-1 text-sm leading-6 text-gray-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'faq' && (
          <section className="space-y-4">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-white">
              <HelpCircle className="w-7 h-7 text-[#FFD700]" aria-hidden="true" />
              {t.faqTitle}
            </h2>
              {t.faqs.map((faq, i) => (
              <article key={faq.q} className="border border-white/10 bg-white/[0.03] p-5">
                <h3 className="flex items-start gap-2 text-sm font-semibold text-white">
                    <span className="text-[#FFD700]">Q:</span>
                    {faq.q}
                  </h3>
                <p className="mt-2 pl-6 text-sm leading-6 text-gray-400">{faq.a}</p>
              </article>
              ))}
          </section>
        )}

        {activeSection === 'roadmap' && (
          <section className="space-y-6">
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-white">
              <Map className="w-7 h-7 text-[#FFD700]" aria-hidden="true" />
              {t.roadmapTitle}
            </h2>

            <div className="space-y-4">
              {t.phases.map((phase) => (
                <article
                  key={phase.phase}
                  className={`border bg-white/[0.03] p-5 sm:p-6 ${
                      phase.status === 'current' ? 'border-[#FFD700]/50' : 'border-white/10'
                    }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`border px-3 py-1 text-xs font-semibold uppercase ${
                      phase.status === 'completed' ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' :
                      phase.status === 'current' ? 'border-[#FFD700]/35 bg-[#FFD700]/10 text-[#FFD700]' :
                      'border-white/10 bg-white/[0.04] text-gray-400'
                    }`}>
                      {phase.phase}
                    </span>
                    <span className="text-sm text-gray-500">{phase.date}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{phase.title}</h3>
                  <ul className="mt-4 space-y-2">
                        {phase.items.map((item, j) => {
                          const isItemObject = typeof item === 'object' && item !== null;
                          const itemText = isItemObject ? item.text : item;
                          const itemStatus = isItemObject ? item.status : (phase.status === 'completed' ? 'completed' : 'pending');
                          
                          return (
                      <li key={`${phase.phase}-${j}`} className="flex items-start gap-2 text-sm leading-6 text-gray-300">
                              {itemStatus === 'completed' ? (
                          <CheckCircle className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-200" aria-hidden="true" />
                              ) : itemStatus === 'in-progress' ? (
                          <span className="mt-2 h-2 w-2 flex-shrink-0 bg-[#FFD700]" aria-hidden="true" />
                              ) : (
                          <span className="mt-2 h-2 w-2 flex-shrink-0 border border-gray-600" aria-hidden="true" />
                              )}
                              {itemText}
                              {itemStatus === 'in-progress' && (
                          <span className="ml-1 text-[#FFD700]">{t.weAreHere}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                </article>
                ))}
              </div>
          </section>
        )}
      </div>

      <footer className="border-t border-white/10 bg-white/[0.03] px-4 py-14 text-center sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{t.footerTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">
            {t.footerDesc}
          </p>
          <Link href="/idea" className="btn-primary mx-auto mt-7">
            {t.getStarted}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </footer>
    </main>
  );
};

export default DocsPage;
