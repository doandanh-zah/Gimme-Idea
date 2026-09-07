import type { Locale } from '@gimme-idea/contracts';

export type LegalDocumentKind = 'terms' | 'privacy';
type LegalSection = { id: string; title: string; paragraphs: string[] };
type LegalDocument = { title: string; summary: string; sections: LegalSection[] };

// Keep these documents explicitly in draft until the operator and contact details,
// applicable jurisdiction, retention schedule and production processors are confirmed.
export const legalRevision = '2026-09-06';
export const legalCopy = {
  vi: {
    draft: 'Bản dự thảo — chưa có hiệu lực',
    notice:
      'Nội dung được soạn cho Gimme Idea và đang chờ hoàn thiện các thông tin pháp lý và chính sách vận hành còn thiếu. Việc đăng nhập không được coi là chấp thuận bản dự thảo này.',
    updated: 'Bản soạn ngày 06/09/2026',
    contents: 'Nội dung trang',
    home: 'Về trang chủ',
    terms: 'Điều khoản sử dụng',
    privacy: 'Chính sách bảo mật',
    newTab: 'mở trong thẻ mới',
    authLead: 'Đọc bản dự thảo',
    and: 'và',
    authNote: 'Các tài liệu đang chờ hoàn thiện và chưa có hiệu lực.',
    sources: 'Chính sách của dịch vụ liên quan',
  },
  en: {
    draft: 'Draft — not yet effective',
    notice:
      'Prepared for Gimme Idea, pending completion of outstanding legal and operational details. Signing in does not constitute acceptance of this draft.',
    updated: 'Draft prepared September 6, 2026',
    contents: 'On this page',
    home: 'Back to home',
    terms: 'Terms of Use',
    privacy: 'Privacy Policy',
    newTab: 'opens in a new tab',
    authLead: 'Read the draft',
    and: 'and',
    authNote: 'These documents are awaiting completion and are not yet effective.',
    sources: 'Related service policies',
  },
} as const;

export const legalDocuments: Record<Locale, Record<LegalDocumentKind, LegalDocument>> = {
  vi: {
    terms: {
      title: 'Điều khoản sử dụng',
      summary:
        'Quyền và trách nhiệm khi khám phá vấn đề, chia sẻ ý tưởng và tham gia Bounty trên Gimme Idea.',
      sections: [
        {
          id: 'service',
          title: '1. Phạm vi dịch vụ',
          paragraphs: [
            'Gimme Idea giúp cộng đồng tìm hiểu các vấn đề thực tế (Problem), đề xuất ý tưởng (Idea), phát triển dự án (Project) và tham gia cuộc thi có phần thưởng (Bounty). Một số tính năng đang được phát triển hoặc chỉ hoạt động trong môi trường thử nghiệm.',
            'Gimme Idea do Doan Danh (Zah) vận hành. Địa chỉ liên hệ, ngày có hiệu lực, điều kiện độ tuổi và phạm vi pháp luật áp dụng đang chờ xác nhận trước khi phát hành điều khoản chính thức.',
          ],
        },
        {
          id: 'account',
          title: '2. Tài khoản và ví',
          paragraphs: [
            'Bạn có trách nhiệm cung cấp thông tin chính xác, sử dụng tài khoản thuộc quyền kiểm soát của mình và bảo vệ phương thức đăng nhập. Không chia sẻ mã đăng nhập, khóa riêng tư hoặc thông tin khôi phục ví.',
            'Khi được cấu hình, đăng nhập qua nhà cung cấp bên ngoài sử dụng Privy và có thể tạo ví Solana tích hợp. Dịch vụ của nhà cung cấp có các điều khoản riêng. Tài khoản thử nghiệm và ví Devnet được dành cho việc kiểm thử, không phải tài khoản nhận tài sản trên Mainnet.',
          ],
        },
        {
          id: 'content',
          title: '3. Nội dung và quyền sở hữu',
          paragraphs: [
            'Bạn giữ quyền sở hữu đối với nội dung do mình tạo, trong phạm vi bạn có quyền đó. Bạn cần có quyền sử dụng và chia sẻ tài liệu, mã nguồn, hình ảnh hoặc dữ liệu mà mình gửi lên.',
            'Theo điều khoản được đề xuất này, bạn cho phép Gimme Idea lưu trữ, xử lý và hiển thị nội dung nhằm vận hành dịch vụ, đúng phạm vi công khai hoặc riêng tư của nội dung. Quyền này không tự động chuyển quyền sở hữu ý tưởng hoặc mã nguồn cho Gimme Idea hay bên tổ chức Bounty.',
            'Bài Problem, Idea hoặc Project được xuất bản công khai có thể được người khác đọc, chia sẻ hoặc lập chỉ mục. Bài dự thi riêng tư được dành cho tác giả và những người có quyền đánh giá hoặc quản trị phù hợp; việc nộp bài không đồng nghĩa với xuất bản công khai.',
          ],
        },
        {
          id: 'conduct',
          title: '4. Sử dụng có trách nhiệm',
          paragraphs: [
            'Không đăng nội dung vi phạm quyền sở hữu trí tuệ hoặc quyền riêng tư; không mạo danh, quấy rối, gian lận, phát tán mã độc hay tìm cách truy cập tài khoản và bài dự thi khi không có quyền.',
            'Không đưa bí mật thương mại, thông tin nhận dạng nhạy cảm hoặc dữ liệu của người khác vào nội dung công khai nếu chưa có quyền chia sẻ. Nội dung nghiên cứu hoặc gợi ý từ hệ thống cần được kiểm chứng trước khi bạn dựa vào đó để quyết định.',
          ],
        },
        {
          id: 'bounties',
          title: '5. Bounty và bài dự thi',
          paragraphs: [
            'Trước khi nộp bài, hãy đọc điều kiện tham gia, hạn chót và múi giờ, tiêu chí chấm, yêu cầu bàn giao và điều khoản sở hữu trí tuệ của từng Bounty. Nếu thông tin cần thiết chưa được công bố, hãy chờ bên tổ chức làm rõ.',
            'Nộp bài không bảo đảm được chọn hoặc nhận thưởng. Kết quả đánh giá, trạng thái tài trợ và giao dịch chi trả là những trạng thái riêng biệt. Chỉ xem khoản thưởng là đã nhận khi giao dịch tương ứng được xác nhận và địa chỉ nhận là chính xác.',
            'Điều khoản riêng của Bounty cần được xem xét cùng với điều khoản nền tảng; không suy diễn việc chuyển giao quyền sở hữu từ một nút nộp bài hoặc một nhãn trên giao diện.',
          ],
        },
        {
          id: 'network',
          title: '6. Mạng thử nghiệm và giao dịch',
          paragraphs: [
            'Các luồng ví hiện tại được thiết kế cho Solana Devnet. Token thử nghiệm không phải lời hứa thanh toán bằng tiền hoặc tài sản Mainnet. Luôn kiểm tra mạng, tài sản, số tiền và địa chỉ trước khi xác nhận một thao tác.',
            'Dữ liệu và giao dịch được ghi lên blockchain có thể công khai và không thể sửa hoặc xóa bằng việc xóa tài khoản Gimme Idea. Trạng thái nội dung trong ứng dụng không thay thế xác nhận giao dịch trên mạng.',
          ],
        },
        {
          id: 'availability',
          title: '7. Thay đổi, xử lý vi phạm và trách nhiệm',
          paragraphs: [
            'Tính năng thử nghiệm có thể thay đổi hoặc gián đoạn. Hãy giữ bản sao của nội dung quan trọng. Gimme Idea không đưa ra cam kết rằng một ý tưởng sẽ thành công, một nguồn nghiên cứu luôn chính xác hoặc một Bounty sẽ mang lại thu nhập.',
            'Cơ chế báo cáo vi phạm, xem xét hạn chế tài khoản, khiếu nại, giải quyết tranh chấp và phạm vi trách nhiệm sẽ được hoàn thiện trong bản chính thức. Bản dự thảo này không loại trừ các quyền bắt buộc của người dùng theo pháp luật áp dụng.',
          ],
        },
        {
          id: 'contact',
          title: '8. Liên hệ và phiên bản chính thức',
          paragraphs: [
            'Bên vận hành là Doan Danh (Zah), liên hệ qua Telegram @doandanh_zah. Email hỗ trợ: doanzah2710@gmail.com. Không gửi giấy tờ tùy thân hoặc dữ liệu nhạy cảm tới một địa chỉ chưa được Gimme Idea công bố xác thực.',
            'Bản chính thức cần công bố ngày có hiệu lực và cách thông báo thay đổi quan trọng. Ngày trên trang này là ngày soạn dự thảo, không phải ngày bắt đầu áp dụng.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Chính sách bảo mật',
      summary:
        'Dữ liệu được sử dụng thế nào, nội dung nào có thể công khai và những lựa chọn liên quan đến tài khoản của bạn.',
      sections: [
        {
          id: 'scope',
          title: '1. Phạm vi và bên phụ trách dữ liệu',
          paragraphs: [
            'Bản dự thảo này mô tả các luồng dữ liệu trong ứng dụng Gimme Idea hiện tại. Bên vận hành chịu trách nhiệm về dữ liệu trong ứng dụng là Doan Danh (Zah), liên hệ qua Telegram @doandanh_zah. Email: doanzah2710@gmail.com. Địa chỉ liên hệ bằng thư đang chờ xác nhận. Danh sách nhà cung cấp và khu vực lưu trữ thực tế cần được xác nhận cho môi trường vận hành.',
          ],
        },
        {
          id: 'data',
          title: '2. Những dữ liệu liên quan',
          paragraphs: [
            'Tài khoản: mã định danh, tên hiển thị, tên người dùng, ảnh hồ sơ, phương thức đăng nhập và địa chỉ ví. Tùy nhà cung cấp và quyền bạn cấp, thông tin như email có thể được nhà cung cấp đăng nhập xử lý hoặc dùng để tạo tên hồ sơ.',
            'Nội dung: Problem, Idea, Project, bài dự thi, phản hồi, tệp tải lên, liên kết nguồn và các thông tin bạn nhập vào biểu mẫu. Hệ thống cũng có thể lưu trạng thái đánh giá, thời điểm gửi, thông báo và thông tin giao dịch liên quan.',
            'Dữ liệu kỹ thuật: yêu cầu tới máy chủ và nhà cung cấp có thể bao gồm địa chỉ IP, thông tin trình duyệt, đường dẫn yêu cầu, thời điểm và lỗi. Phạm vi nhật ký, quyền truy cập và thời hạn lưu ở môi trường vận hành cần được xác nhận trước khi phát hành bản chính thức.',
          ],
        },
        {
          id: 'purposes',
          title: '3. Mục đích sử dụng',
          paragraphs: [
            'Dữ liệu phục vụ đăng nhập, hiển thị hồ sơ, lưu và xuất bản nội dung, tiếp nhận bài dự thi, kiểm tra quyền truy cập, vận hành ví và thông báo, xử lý lỗi và ngăn chặn lạm dụng.',
            'Căn cứ xử lý cho từng mục đích, quy trình xin hoặc rút lại sự đồng ý khi cần, và các mục đích bổ sung như tiếp thị hoặc phân tích hành vi phải được xác nhận riêng. Việc đọc hoặc đồng ý với điều khoản sử dụng không thay thế sự đồng ý riêng cho mọi mục đích xử lý dữ liệu.',
          ],
        },
        {
          id: 'visibility',
          title: '4. Công khai, riêng tư và người nhận',
          paragraphs: [
            'Nội dung được xuất bản công khai và thông tin tác giả gắn với nội dung có thể được khách truy cập xem, chia sẻ hoặc lưu lại. Không đưa dữ liệu nhạy cảm vào những trường công khai.',
            'Bài dự thi riêng tư được giới hạn theo quyền của tác giả, người đánh giá và người quản trị phù hợp. Nhãn riêng tư không có nghĩa dữ liệu được mã hóa đầu cuối hoặc chỉ người gửi có thể đọc.',
            'Nhà cung cấp đăng nhập, ví, lưu trữ, hạ tầng và mạng blockchain có thể xử lý dữ liệu cần thiết để thực hiện dịch vụ của họ. Những yêu cầu cung cấp dữ liệu theo pháp luật phải được đánh giá theo pháp luật áp dụng.',
          ],
        },
        {
          id: 'providers',
          title: '5. Dịch vụ bên ngoài và blockchain',
          paragraphs: [
            'Ứng dụng tích hợp Privy cho đăng nhập và ví khi được cấu hình, sử dụng PostgreSQL và cơ chế lưu trữ tương thích Supabase, đồng thời gửi yêu cầu tới mạng Solana. Giao diện hiện tải phông chữ từ Adobe Fonts. Các yêu cầu ra bên ngoài có thể cung cấp cho nhà cung cấp thông tin kỹ thuật như địa chỉ IP.',
            'Việc dùng thư viện Supabase không tự xác định nơi lưu trữ hoặc đơn vị đang lưu dữ liệu. Nhà cung cấp lưu trữ, nhà cung cấp RPC, khu vực dữ liệu và cơ chế chuyển dữ liệu qua biên giới cần được xác nhận theo triển khai thực tế.',
            'Địa chỉ ví và giao dịch ghi trên blockchain có thể được công chúng tra cứu. Gimme Idea không thể xóa lịch sử blockchain chỉ bằng cách xóa bản ghi trong ứng dụng.',
          ],
        },
        {
          id: 'device',
          title: '6. Dữ liệu trên thiết bị',
          paragraphs: [
            'Nội dung công khai đã lưu, đã thích và theo dõi được lưu trong tài khoản trên máy chủ. Ứng dụng dùng bộ nhớ trình duyệt để giữ thông tin phiên, bản nháp và một số thao tác với Quote; IndexedDB có thể giữ tệp của các luồng nội dung cục bộ. Một số dữ liệu chỉ tồn tại trên trình duyệt hiện tại và không tự đồng bộ sang thiết bị khác.',
            'Đăng xuất không đồng nghĩa xóa toàn bộ bản nháp hoặc dữ liệu trình duyệt. Bạn có thể xóa dữ liệu trang trong cài đặt trình duyệt, nhưng thao tác đó có thể làm mất bản nháp và không xóa nội dung đã gửi tới máy chủ hoặc blockchain. SDK đăng nhập cũng có thể dùng cookie hoặc bộ nhớ thiết bị theo chính sách của nhà cung cấp.',
          ],
        },
        {
          id: 'retention',
          title: '7. Lưu giữ, bảo vệ và yêu cầu của bạn',
          paragraphs: [
            'Thời hạn lưu cho tài khoản, nội dung, tệp, nhật ký và bản sao lưu chưa được chốt trong bản dự thảo. Bản chính thức cần nêu thời hạn hoặc tiêu chí xác định thời hạn cho từng nhóm, cùng cách xử lý khi tài khoản bị đóng.',
            'Tùy pháp luật áp dụng, bạn có thể có quyền yêu cầu truy cập, sửa, xóa, nhận bản sao, hạn chế hoặc phản đối việc xử lý dữ liệu, rút lại sự đồng ý và khiếu nại tới cơ quan có thẩm quyền. Kênh tiếp nhận, quy trình xác minh và thời hạn phản hồi đang chờ xác nhận; ứng dụng hiện chưa có luồng tự phục vụ hoàn chỉnh cho mọi yêu cầu này.',
            'Việc xóa có thể chịu giới hạn đối với nghĩa vụ lưu giữ hợp pháp, bản sao do người khác giữ hoặc dữ liệu blockchain. Không có hệ thống truyền và lưu trữ nào có thể bảo đảm an toàn tuyệt đối.',
          ],
        },
        {
          id: 'contact',
          title: '8. Liên hệ và cập nhật',
          paragraphs: [
            'Yêu cầu về dữ liệu cá nhân có thể gửi tới Doan Danh (Zah) qua Telegram @doandanh_zah. Bạn cũng có thể gửi email tới doanzah2710@gmail.com. Quy trình tiếp nhận chính thức cần được hoàn thiện trước khi chính sách có hiệu lực.',
            'Bản chính thức cần xác nhận chính sách độ tuổi, cách xử lý dữ liệu của trẻ em và cách thông báo thay đổi đáng kể. Trang này hiện là dự thảo có ghi ngày soạn để bạn nhận biết phiên bản.',
          ],
        },
      ],
    },
  },
  en: {
    terms: {
      title: 'Terms of Use',
      summary:
        'Your rights and responsibilities when exploring Problems, sharing Ideas and taking part in Bounties on Gimme Idea.',
      sections: [
        {
          id: 'service',
          title: '1. The service',
          paragraphs: [
            'Gimme Idea helps people explore real-world Problems, propose Ideas, develop Projects and take part in competitions with rewards called Bounties. Some features are under development or available only in a test environment.',
            'Gimme Idea is operated by Doan Danh (Zah). The contact address, effective date, age requirements and applicable jurisdiction must be confirmed before final terms are issued.',
          ],
        },
        {
          id: 'account',
          title: '2. Accounts and wallets',
          paragraphs: [
            'You are responsible for accurate account information, using an account you control and protecting your sign-in methods. Do not share login codes, private keys or wallet recovery information.',
            'When configured, third-party sign-in uses Privy and may create an embedded Solana wallet. Providers have their own terms. Test accounts and Devnet wallets are for testing, not for receiving Mainnet assets.',
          ],
        },
        {
          id: 'content',
          title: '3. Content and ownership',
          paragraphs: [
            'You retain the ownership rights you hold in your content. You must have the right to use and share the documents, code, images and data you submit.',
            'Under these proposed terms, you permit Gimme Idea to store, process and display your content to operate the service, within its public or private visibility. This permission does not automatically transfer ownership of your ideas or code to Gimme Idea or a Bounty organizer.',
            'Published public Problems, Ideas and Projects may be read, shared or indexed by others. Private submissions are intended for their authors and appropriately authorized reviewers or administrators; submitting an entry does not make it a public post.',
          ],
        },
        {
          id: 'conduct',
          title: '4. Responsible use',
          paragraphs: [
            'Do not infringe intellectual property or privacy rights, impersonate others, harass, commit fraud, distribute malware or access accounts and submissions without authorization.',
            'Do not include trade secrets, sensitive identifying information or other people’s data in public content without permission. Verify research and system-generated suggestions before relying on them.',
          ],
        },
        {
          id: 'bounties',
          title: '5. Bounties and submissions',
          paragraphs: [
            'Before submitting, read the Bounty’s eligibility rules, deadline and time zone, judging criteria, deliverables and intellectual property terms. Wait for the organizer to clarify missing essential information.',
            'Submitting does not guarantee selection or a reward. Judging results, funding status and payout transactions are separate states. Treat a reward as received only when the corresponding transaction is confirmed and the recipient address is correct.',
            'Review Bounty-specific terms alongside platform terms. Do not infer an ownership transfer from a submit button or interface label.',
          ],
        },
        {
          id: 'network',
          title: '6. Test networks and transactions',
          paragraphs: [
            'The current wallet flows are designed for Solana Devnet. Test tokens are not a promise of payment in money or Mainnet assets. Check the network, asset, amount and address before confirming an action.',
            'Blockchain records and transactions may be public and cannot be edited or deleted by deleting a Gimme Idea account. Application content status does not replace network transaction confirmation.',
          ],
        },
        {
          id: 'availability',
          title: '7. Changes, enforcement and responsibility',
          paragraphs: [
            'Experimental features may change or become unavailable. Keep copies of important work. Gimme Idea does not promise that an idea will succeed, that research is always correct or that a Bounty will generate income.',
            'Reporting, account restriction review, appeals, dispute resolution and liability provisions must be completed in the final terms. This draft does not exclude mandatory user rights under applicable law.',
          ],
        },
        {
          id: 'contact',
          title: '8. Contact and final publication',
          paragraphs: [
            'The operator is Doan Danh (Zah), reachable on Telegram at @doandanh_zah. Support email: doanzah2710@gmail.com. Do not send identification documents or sensitive information to an unverified contact address.',
            'Final terms must state an effective date and how material changes will be communicated. The date on this page is the preparation date, not an effective date.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      summary: 'How data is used, what may be public and the choices related to your account.',
      sections: [
        {
          id: 'scope',
          title: '1. Scope and responsibility',
          paragraphs: [
            'This draft describes data flows in the current Gimme Idea application. The responsible application operator is Doan Danh (Zah), reachable on Telegram at @doandanh_zah. Email: doanzah2710@gmail.com. The postal address awaits confirmation. Production providers and storage locations also need to be confirmed.',
          ],
        },
        {
          id: 'data',
          title: '2. Data involved',
          paragraphs: [
            'Account information includes identifiers, display name, username, profile image, sign-in method and wallet address. Depending on the provider and permissions you grant, information such as email may be processed by the sign-in provider or used to create a profile name.',
            'Content includes Problems, Ideas, Projects, submissions, responses, uploaded files, source links and form entries. The system may also store review status, submission times, notifications and related transaction information.',
            'Technical requests to servers and providers may include IP addresses, browser information, request paths, times and errors. Production logging scope, access and retention must be confirmed before the final policy is issued.',
          ],
        },
        {
          id: 'purposes',
          title: '3. Purposes of use',
          paragraphs: [
            'Data supports sign-in, profiles, storing and publishing content, receiving submissions, checking access, wallet and notification functions, troubleshooting and preventing abuse.',
            'The legal basis for each purpose, consent and withdrawal processes where needed, and additional purposes such as marketing or behavioral analytics must be confirmed separately. Reading or agreeing to terms of use does not replace separate consent for every processing purpose.',
          ],
        },
        {
          id: 'visibility',
          title: '4. Visibility and recipients',
          paragraphs: [
            'Published public content and its associated author information may be viewed, shared or saved by visitors. Do not put sensitive information in public fields.',
            'Private submissions are restricted according to the permissions of authors, reviewers and appropriate administrators. A private label does not imply end-to-end encryption or that only the sender can read the data.',
            'Sign-in, wallet, storage, infrastructure and blockchain providers may process data needed for their services. Legally required disclosure requests must be assessed under applicable law.',
          ],
        },
        {
          id: 'providers',
          title: '5. External services and blockchain',
          paragraphs: [
            'The application integrates Privy for sign-in and wallets when configured, uses PostgreSQL and Supabase-compatible storage, and sends requests to the Solana network. The interface currently loads fonts from Adobe Fonts. External requests may share technical information such as an IP address with providers.',
            'Using a Supabase library does not itself establish where data is hosted or who hosts it. Hosting and RPC providers, data regions and cross-border transfer arrangements must be confirmed for the actual deployment.',
            'Wallet addresses and transactions recorded on a blockchain may be publicly searchable. Gimme Idea cannot remove blockchain history by deleting an application record.',
          ],
        },
        {
          id: 'device',
          title: '6. Data on your device',
          paragraphs: [
            'Saved, liked and followed public content is stored with your account on the server. The application uses browser storage for session information, drafts and some quote-related actions. IndexedDB may hold files from local content flows. Some data exists only in the current browser and does not automatically synchronize across devices.',
            'Signing out does not erase every draft or browser record. You can clear site data in browser settings, but this may lose drafts and will not delete content already sent to servers or a blockchain. Sign-in SDKs may also use cookies or device storage under their providers’ policies.',
          ],
        },
        {
          id: 'retention',
          title: '7. Retention, safeguards and your requests',
          paragraphs: [
            'Retention periods for accounts, content, files, logs and backups have not been finalized. The final policy must state periods or criteria for each category and explain handling after account closure.',
            'Depending on applicable law, you may have rights to access, correct, delete or receive a copy of data, restrict or object to processing, withdraw consent and complain to a competent authority. Contact channels, identity verification and response times await confirmation; the application does not yet provide complete self-service flows for every request.',
            'Deletion may be limited by lawful retention obligations, copies held by others or blockchain records. No transmission or storage system can guarantee absolute security.',
          ],
        },
        {
          id: 'contact',
          title: '8. Contact and updates',
          paragraphs: [
            'Privacy requests can be directed to Doan Danh (Zah) on Telegram at @doandanh_zah. You can also email doanzah2710@gmail.com. The formal handling process must be completed before this policy takes effect.',
            'The final policy must confirm age requirements, handling of children’s data and how significant changes will be communicated. This page is a dated draft so that its version is identifiable.',
          ],
        },
      ],
    },
  },
};
