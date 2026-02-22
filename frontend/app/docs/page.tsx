'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Rocket, 
  Users, 
  Wallet, 
  FileText, 
  HelpCircle, 
  Map, 
  Shield, 
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
  Globe,
  Code,
  TrendingUp
} from 'lucide-react';

// Language content
const content = {
  en: {
    // Hero
    badge: 'Documentation',
    heroTitle: 'Welcome to',
    heroSubtitle: 'A Solana-native builder platform to publish ideas/projects, get AI + community feedback, run idea pools, and automate workflows with Agent Mode.'
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
    gettingStarted: '🚀 Getting Started',
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
    howToSubmit: '💡 How to Submit an Idea',
    submitSteps: [
      { title: 'Click "Submit Idea"', desc: 'Find the submit button in the navigation bar or homepage' },
      { title: 'Fill in the Details', desc: 'Provide a compelling title, detailed description, select a category (DeFi, NFT, Gaming, etc.), and add relevant tags' },
      { title: 'Add Context (Optional)', desc: 'Include the problem you\'re solving, your proposed solution, and any supporting links or images' },
      { title: 'Submit & Share', desc: 'Click submit and share your idea with the community. Get feedback, tips, and AI analysis!' },
    ],
    tipsForSuccess: '⭐ Tips for a Great Submission',
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
    weAreHere: '← We are here',
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
    heroSubtitle: 'Nền tảng builder trên Solana để đăng idea/project, nhận phản hồi AI + cộng đồng, theo dõi idea pool và tự động hoá bằng Agent Mode.'
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
    gettingStarted: '🚀 Bắt đầu',
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
    howToSubmit: '💡 Cách Đăng Ý tưởng',
    submitSteps: [
      { title: 'Nhấp "Đăng Ý tưởng"', desc: 'Tìm nút đăng trên thanh điều hướng hoặc trang chủ' },
      { title: 'Điền thông tin', desc: 'Cung cấp tiêu đề hấp dẫn, mô tả chi tiết, chọn danh mục (DeFi, NFT, Gaming, v.v.) và thêm tags' },
      { title: 'Thêm Ngữ cảnh (Tùy chọn)', desc: 'Bao gồm vấn đề bạn đang giải quyết, giải pháp đề xuất và các link hoặc hình ảnh hỗ trợ' },
      { title: 'Gửi & Chia sẻ', desc: 'Nhấp gửi và chia sẻ ý tưởng với cộng đồng. Nhận phản hồi, tip và phân tích AI!' },
    ],
    tipsForSuccess: '⭐ Mẹo để Thành công',
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
    weAreHere: '← Chúng tôi đang ở đây',
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

  // Language Toggle Component
  const LanguageToggle = () => (
    <button
      onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
      className="relative flex items-center w-20 h-9 bg-white/10 rounded-full p-1 cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
    >
      <motion.div
        className="absolute w-8 h-7 bg-gradient-to-r from-[#FFD700] to-[#FDB931] rounded-full shadow-lg"
        animate={{ x: lang === 'en' ? 2 : 42 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
      <span className={`relative z-10 flex-1 text-center text-xs font-bold transition-colors ${lang === 'en' ? 'text-black' : 'text-gray-400'}`}>
        EN
      </span>
      <span className={`relative z-10 flex-1 text-center text-xs font-bold transition-colors ${lang === 'vi' ? 'text-black' : 'text-gray-400'}`}>
        VI
      </span>
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Language Toggle - Fixed Position */}
      <div className="fixed top-24 right-4 z-50">
        <LanguageToggle />
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-black" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 pt-28 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t.heroTitle}{' '}
              <span className="bg-gradient-to-r from-[#FFD700] to-[#FDB931] bg-clip-text text-transparent">
                Gimme Idea
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              {t.heroSubtitle}
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/idea">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold rounded-full flex items-center gap-2"
                >
                  <Rocket className="w-5 h-5" />
                  {t.exploreBtn}
                </motion.button>
              </Link>
              <Link href="/privacy">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-full flex items-center gap-2 hover:bg-white/20 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  {t.privacyBtn}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-4 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`overview-${lang}`}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-[#FFD700]" />
                {t.whatIs}
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
                <p className="text-lg text-gray-300 leading-relaxed mb-6">
                  <strong className="text-white">Gimme Idea</strong> {t.whatIsDesc.replace('Gimme Idea is a', 'is a')}
                </p>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/5 rounded-xl p-5">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{t.shareIdeas}</h3>
                    <p className="text-sm text-gray-400">
                      {t.shareIdeasDesc}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-5">
                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{t.getFeedback}</h3>
                    <p className="text-sm text-gray-400">
                      {t.getFeedbackDesc}
                    </p>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl p-5">
                    <div className="w-12 h-12 bg-[#FFD700]/20 rounded-xl flex items-center justify-center mb-4">
                      <Wallet className="w-6 h-6 text-[#FFD700]" />
                    </div>
                    <h3 className="font-bold text-white mb-2">{t.earnRewards}</h3>
                    <p className="text-sm text-gray-400">
                      {t.earnRewardsDesc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div>
              <h2 className="text-2xl font-bold mb-6">{t.howItWorks}</h2>
              <div className="grid md:grid-cols-4 gap-4">
                {t.steps.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 h-full">
                      <div className="w-10 h-10 bg-gradient-to-r from-[#FFD700] to-[#FDB931] rounded-full flex items-center justify-center text-black font-bold mb-4">
                        {item.step}
                      </div>
                      <h3 className="font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                    {index < 3 && (
                      <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Value Proposition Section */}
        {activeSection === 'value' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`value-${lang}`}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-[#FFD700]" />
                {t.whyGimme}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    {t.forCreators}
                  </h3>
                  <ul className="space-y-3">
                    {t.creatorBenefits.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/20 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#FFD700]" />
                    {t.forCommunity}
                  </h3>
                  <ul className="space-y-3">
                    {t.communityBenefits.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-300">
                        <CheckCircle className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Key Features */}
              <h3 className="text-2xl font-bold mb-6">{t.keyFeatures}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: Sparkles, color: 'purple' },
                  { icon: Heart, color: 'red' },
                  { icon: Star, color: 'yellow' },
                  { icon: Users, color: 'blue' },
                  { icon: Code, color: 'green' },
                  { icon: Shield, color: 'gray' },
                ].map((feature, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                    <div className={`w-10 h-10 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-3`}>
                      <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                    </div>
                    <h4 className="font-bold text-white mb-1">{t.features[i].title}</h4>
                    <p className="text-sm text-gray-400">{t.features[i].desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* User Guide Section */}
        {activeSection === 'guide' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`guide-${lang}`}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#FFD700]" />
                {t.userGuide}
              </h2>

              {/* Getting Started */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">{t.gettingStarted}</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-[#FFD700] mb-2">{t.step1Title}</h4>
                    <p className="text-gray-300 mb-2">
                      {t.step1Desc}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#FFD700] mb-2">{t.step2Title}</h4>
                    <p className="text-gray-300 mb-2">
                      {t.step2Desc}
                    </p>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 ml-4">
                      {t.step2Items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#FFD700] mb-2">{t.step3Title}</h4>
                    <p className="text-gray-300">
                      {t.step3Desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Submitting Ideas */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">{t.howToSubmit}</h3>
                
                <div className="space-y-4">
                  {t.submitSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center text-black font-bold flex-shrink-0">{index + 1}</div>
                      <div>
                        <h4 className="font-bold text-white">{step.title}</h4>
                        <p className="text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips for Success */}
              <div className="bg-gradient-to-r from-[#FFD700]/10 to-purple-500/10 border border-[#FFD700]/20 rounded-2xl p-6 md:p-8">
                <h3 className="text-xl font-bold text-white mb-4">{t.tipsForSuccess}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {t.successTips.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#FFD700] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">{item.tip}:</span>
                        <span className="text-gray-400 ml-1">{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`faq-${lang}`}
            className="space-y-6"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-[#FFD700]" />
              {t.faqTitle}
            </h2>

            <div className="space-y-4">
              {t.faqs.map((faq, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="font-bold text-white mb-2 flex items-start gap-2">
                    <span className="text-[#FFD700]">Q:</span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-400 pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Roadmap Section */}
        {activeSection === 'roadmap' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={`roadmap-${lang}`}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
              <Map className="w-8 h-8 text-[#FFD700]" />
              {t.roadmapTitle}
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#FFD700] via-purple-500 to-gray-700" />

              <div className="space-y-8">
                {t.phases.map((phase, i) => (
                  <div key={i} className="relative pl-20">
                    {/* Timeline dot */}
                    <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                      phase.status === 'completed' ? 'bg-green-500 border-green-500/30' :
                      phase.status === 'current' ? 'bg-[#FFD700] border-[#FFD700]/30 animate-pulse' :
                      'bg-gray-600 border-gray-600/30'
                    }`} />

                    <div className={`bg-white/5 border rounded-2xl p-6 ${
                      phase.status === 'current' ? 'border-[#FFD700]/50' : 'border-white/10'
                    }`}>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          phase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          phase.status === 'current' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {phase.phase}
                        </span>
                        <span className="text-gray-500">{phase.date}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-3">{phase.title}</h3>
                      
                      <ul className="space-y-2">
                        {phase.items.map((item, j) => {
                          const isItemObject = typeof item === 'object' && item !== null;
                          const itemText = isItemObject ? item.text : item;
                          const itemStatus = isItemObject ? item.status : (phase.status === 'completed' ? 'completed' : 'pending');
                          
                          return (
                            <li key={j} className="flex items-center gap-2 text-gray-300">
                              {itemStatus === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : itemStatus === 'in-progress' ? (
                                <div className="w-4 h-4 rounded-full bg-[#FFD700] animate-pulse" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-600" />
                              )}
                              {itemText}
                              {itemStatus === 'in-progress' && (
                                <span className="text-[#FFD700] text-sm ml-1">{t.weAreHere}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-purple-900/30 to-[#FFD700]/10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.footerTitle}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            {t.footerDesc}
          </p>
          <Link href="/idea">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-[#FFD700] to-[#FDB931] text-black font-bold rounded-full inline-flex items-center gap-2"
            >
              {t.getStarted}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
