export type GTMQuestion = {
  id: number;
  stage: 'qualification' | 'problem' | 'jtbd' | 'icp' | 'mvp' | 'pricing' | 'pmf';
  prompt: string;
};

export const QUESTION_PACK_SIZE = 5;
export const FREE_QUESTIONS_PER_DAY = 2;

export const GTM_QUESTION_BANK: GTMQuestion[] = [
  { id: 1, stage: 'qualification', prompt: 'Bạn thuộc nhóm nào gần nhất với vấn đề này?' },
  { id: 2, stage: 'qualification', prompt: 'Trong 30 ngày qua, bạn gặp vấn đề này bao nhiêu lần?' },
  { id: 3, stage: 'problem', prompt: 'Lần gần nhất vấn đề này xảy ra là khi nào?' },
  { id: 4, stage: 'problem', prompt: 'Bạn đã xử lý như thế nào ở lần gần nhất?' },
  { id: 5, stage: 'problem', prompt: 'Bạn mất gì nhiều nhất vì vấn đề này?' },
  { id: 6, stage: 'problem', prompt: 'Nếu không giải quyết, hậu quả 3 tháng tới là gì?' },
  { id: 7, stage: 'problem', prompt: 'Bạn đã trả tiền cho giải pháp nào chưa?' },
  { id: 8, stage: 'jtbd', prompt: 'Giải pháp gần nhất bạn dùng là gì?' },
  { id: 9, stage: 'jtbd', prompt: 'Điều gì khiến bạn muốn đổi giải pháp?' },
  { id: 10, stage: 'jtbd', prompt: 'Điều gì khiến bạn chần chừ chưa đổi?' },
  { id: 11, stage: 'jtbd', prompt: '“Job” chính bạn muốn hoàn thành là gì?' },
  { id: 12, stage: 'jtbd', prompt: 'Bạn đo kết quả thành công bằng chỉ số nào?' },
  { id: 13, stage: 'icp', prompt: 'Ai là người chịu đau lớn nhất trong flow?' },
  { id: 14, stage: 'icp', prompt: 'Ai là người ra quyết định trả tiền?' },
  { id: 15, stage: 'icp', prompt: 'Ngân sách thường nằm ở đâu?' },
  { id: 16, stage: 'icp', prompt: 'Mức độ cấp bách hiện tại (1-5)?' },
  { id: 17, stage: 'icp', prompt: 'Nếu có tool tốt hơn, bạn thử trong bao lâu?' },
  { id: 18, stage: 'mvp', prompt: 'Nếu chỉ được chọn 1 outcome, bạn chọn gì?' },
  { id: 19, stage: 'mvp', prompt: 'Must-have nào để bạn dùng thử?' },
  { id: 20, stage: 'mvp', prompt: 'Nice-to-have nào chưa cần ở v1?' },
  { id: 21, stage: 'mvp', prompt: 'Điều gì làm bạn bỏ ngay lần đầu dùng?' },
  { id: 22, stage: 'mvp', prompt: 'Onboarding bao lâu là chấp nhận được?' },
  { id: 23, stage: 'pricing', prompt: 'Mức giá nào quá rẻ khiến bạn nghi ngờ chất lượng?' },
  { id: 24, stage: 'pricing', prompt: 'Mức giá nào bạn thấy “hời”?' },
  { id: 25, stage: 'pricing', prompt: 'Mức giá nào bắt đầu đắt nhưng vẫn cân nhắc?' },
  { id: 26, stage: 'pricing', prompt: 'Mức giá nào quá đắt, chắc chắn không mua?' },
  { id: 27, stage: 'pricing', prompt: 'Bạn thích trả theo tháng hay usage?' },
  { id: 28, stage: 'pmf', prompt: 'Nếu ngày mai không dùng được, bạn thất vọng mức nào?' },
  { id: 29, stage: 'pmf', prompt: 'Bạn sẽ giới thiệu sản phẩm này cho ai đầu tiên?' },
  { id: 30, stage: 'pmf', prompt: 'Lý do lớn nhất khiến bạn chưa giới thiệu là gì?' },
];
