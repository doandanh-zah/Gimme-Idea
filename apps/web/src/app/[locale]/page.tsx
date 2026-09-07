import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowUpRight,
  Blocks,
  Building2,
  Fingerprint,
  Lightbulb,
  SearchCheck,
  Target,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { copy, isLocale } from '@/lib/i18n';
import { Narrative } from '@/components/narrative';
import { BrainLoader, BrainStageCaption } from '@/components/brain-loader';
import { LandingEntrance } from '@/components/landing-entrance';
import { getProblem } from '@/lib/api';

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const vi = locale === 'vi';
  const t = copy[locale];
  const problems = (
    await Promise.all([
      getProblem('restaurant-food-waste').catch(() => null),
      getProblem('tenant-repair-visibility').catch(() => null),
    ])
  ).filter((p) => p !== null);
  return (
    <main id="main" className="brand-landing">
      <section
        className="landing-experience"
        aria-label={vi ? 'Từ vấn đề đến bản build' : 'From problem to build'}
      >
        <div className="landing-story-copy">
          <LandingEntrance>
            <div className="landing-hero-copy">
              <p className="landing-eyebrow" data-entrance>
                <span />
                {vi
                  ? 'MẠNG LƯỚI CHO NHỮNG NGƯỜI GIẢI QUYẾT VẤN ĐỀ'
                  : 'A NETWORK FOR THE PROBLEM SOLVERS'}
              </p>
              <h1 data-entrance>
                {vi ? (
                  <>
                    Vấn đề ở<br />
                    khắp nơi.
                    <br />
                    <em>
                      Ý tưởng cần
                      <br />
                      một khởi đầu.
                    </em>
                  </>
                ) : (
                  <>
                    Problems
                    <br />
                    are everywhere.
                    <br />
                    <em>
                      Possibility
                      <br />
                      starts here.
                    </em>
                  </>
                )}
              </h1>
              <p className="landing-hero-intro" data-entrance>
                {vi
                  ? 'Hiểu vấn đề thật. Khám phá những hướng giải. Kết nối với người biến ý tưởng thành hiện thực.'
                  : 'Understand real problems. Discover new directions. Connect with the people who bring ideas to life.'}
              </p>
              <div className="landing-hero-actions" data-entrance>
                <Link className="button button-primary" href={`/${locale}/problems`}>
                  {vi ? 'Khám phá vấn đề' : 'Explore Problems'}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
                <Link className="button button-quiet" href={`/${locale}/create/problem`}>
                  {vi ? 'Đăng một vấn đề' : 'Post a Problem'}
                  <ArrowUpRight size={19} aria-hidden="true" />
                </Link>
              </div>
              <a className="landing-scroll-cue" href="#sequence">
                {vi ? 'XEM CÁCH MỌI THỨ KẾT NỐI' : 'SEE HOW IT ALL CONNECTS'}
                <ArrowDownRight size={17} aria-hidden="true" />
              </a>
            </div>
          </LandingEntrance>
          <Narrative items={t.sequence} />
        </div>
        <div className="landing-brain-column">
          <div className="brain-frame">
            <div className="brain-frame-label">
              <span>GIMME IDEA</span>
              <span>THE POSSIBILITY ENGINE</span>
            </div>
            <div className="brain-fallback" aria-hidden="true">
              <svg viewBox="0 0 500 500">
                <g fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M245 85C172 61 106 128 122 194c-49 35-35 108 6 125-4 54 45 96 93 72l24-18V85Zm15 0c73-24 139 43 123 109 49 35 35 108-6 125 4 54-45 96-93 72l-24-18V85Z" />
                  <path d="m245 120-73 28-50 46 91 21 32 63-72 54-45-13m117-159-32 55-43 42 3 75 48 59M260 120l73 28 50 46-91 21-32 63 72 54 45-13m-117-159 32 55 43 42-3 75-48 59M172 148l-2 109-48-63m211-46 2 109 48-63" />
                  {[
                    [172, 148],
                    [122, 194],
                    [213, 215],
                    [173, 332],
                    [221, 391],
                    [333, 148],
                    [383, 194],
                    [292, 215],
                    [332, 332],
                    [284, 391],
                  ].map(([cx, cy], i) => (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={i % 3 === 0 ? 6 : 3}
                      fill={i % 2 === 0 ? 'var(--purple)' : 'var(--yellow)'}
                      stroke="none"
                    />
                  ))}
                </g>
              </svg>
            </div>
            <BrainLoader locale={locale} />
            <div className="brain-frame-caption">
              <BrainStageCaption locale={locale} />
              <span>PROBLEM · IDEA · BUILD</span>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-research">
        <div>
          <p className="landing-eyebrow">
            {vi ? 'HIỂU TRƯỚC KHI XÂY DỰNG' : 'CONTEXT BEFORE CODE'}
          </p>
          <h2>
            {vi ? (
              <>
                Đừng bắt đầu
                <br />
                từ con số không.
              </>
            ) : (
              <>
                Your next idea.
                <br />A better starting point.
              </>
            )}
          </h2>
          <p>
            {vi
              ? 'Những bản build trước, bằng chứng và góc nhìn khác giúp bạn đặt câu hỏi tốt hơn. Ý tưởng vẫn là của bạn.'
              : 'Past builds, evidence and different perspectives help you ask better questions. The idea is still yours.'}
          </p>
          <Link href={`/${locale}/projects`}>
            {vi ? 'Khám phá kho dự án' : 'Explore the build library'}
            <ArrowUpRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div className="research-principles">
          {[
            {
              icon: SearchCheck,
              title: vi ? 'Bằng chứng có nguồn' : 'Evidence you can trace',
              body: vi
                ? 'Phân biệt điều đã biết, điều suy luận và điều chưa được xác minh.'
                : 'See what is known, what is inferred and what still needs verification.',
            },
            {
              icon: Fingerprint,
              title: vi ? 'Góc nhìn của bạn được giữ nguyên' : 'Your perspective stays yours',
              body: vi
                ? 'Nghiên cứu bổ sung bối cảnh, không viết lại ý tưởng của người tạo.'
                : 'Research adds context without rewriting the creator’s original thesis.',
            },
            {
              icon: Blocks,
              title: vi ? 'Bài học từ những gì đã thử' : 'Learn from what came before',
              body: vi
                ? 'Kết quả một cuộc thi không phải kết luận về tương lai của dự án.'
                : 'A competition result is one chapter, not the whole story of a project.',
            },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title}>
              <Icon size={25} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      {problems.length > 0 && (
        <section className="landing-discover">
          <div className="landing-section-heading">
            <div>
              <p className="landing-eyebrow">{vi ? 'TỪ MẠNG LƯỚI' : 'FROM THE NETWORK'}</p>
              <h2>{vi ? 'Điều gì đáng được giải quyết?' : 'What is worth solving?'}</h2>
            </div>
            <Link href={`/${locale}/problems`}>
              {vi ? 'Xem tất cả' : 'Explore all'}
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          </div>
          <div className="landing-problem-grid">
            {problems.map((problem, index) => (
              <Link key={problem.id} href={`/${locale}/problems/${problem.slug}`}>
                <span className="landing-record-number">0{index + 1}</span>
                <span className="landing-eyebrow">
                  <Target size={18} aria-hidden="true" />
                  {vi ? 'VẤN ĐỀ' : 'PROBLEM'}
                </span>
                <h3>{problem.title}</h3>
                <p>{problem.summary}</p>
                <span className="landing-record-action">
                  {vi ? 'Tìm hiểu vấn đề' : 'Understand the problem'}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="landing-audiences">
        <div className="landing-section-heading">
          <div>
            <p className="landing-eyebrow">
              {vi ? 'MỖI GÓC NHÌN ĐỀU CÓ GIÁ TRỊ' : 'THERE IS MORE THAN ONE WAY IN'}
            </p>
            <h2>{vi ? 'Bạn sẽ bắt đầu từ đâu?' : 'Where will you start?'}</h2>
          </div>
        </div>
        <div className="audience-grid">
          {[
            {
              icon: Lightbulb,
              title: vi ? 'Người có ý tưởng' : 'The curious minds',
              text: vi
                ? 'Nhìn thấy vấn đề mà người khác bỏ qua. Đề xuất một hướng giải mới.'
                : 'Notice what others overlook. Share a problem or propose a different direction.',
              href: '/create/idea',
              cta: vi ? 'Chia sẻ ý tưởng' : 'Bring an idea',
            },
            {
              icon: Blocks,
              title: vi ? 'Người xây dựng' : 'The hands-on builders',
              text: vi
                ? 'Hiểu điều cần xây, học từ những lần thử trước và chứng minh khả năng.'
                : 'Find a meaningful challenge, learn from past attempts and prove your skills.',
              href: '/bounties',
              cta: vi ? 'Tìm thử thách' : 'Find a challenge',
            },
            {
              icon: Building2,
              title: vi ? 'Doanh nghiệp' : 'The organizations',
              text: vi
                ? 'Mang vấn đề thật đến với những góc nhìn và năng lực giải quyết mới.'
                : 'Bring a real challenge to fresh perspectives and people who can deliver.',
              href: '/create/problem',
              cta: vi ? 'Đăng vấn đề' : 'Share a problem',
            },
          ].map(({ icon: Icon, title, text, href, cta }) => (
            <article key={href}>
              <Icon size={30} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href={`/${locale}${href}`}>
                {cta}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="landing-final">
        <p className="landing-eyebrow">
          {vi
            ? 'MỘT VẤN ĐỀ CÓ THỂ LÀ KHỞI ĐẦU CỦA BẠN'
            : 'ONE PROBLEM COULD BE YOUR STARTING POINT'}
        </p>
        <h2>
          {vi ? (
            <>
              Thế giới còn nhiều vấn đề.
              <br />
              <em>Bạn mang đến điều gì?</em>
            </>
          ) : (
            <>
              The world has problems.
              <br />
              <em>What will you bring?</em>
            </>
          )}
        </h2>
        <Link className="button button-primary" href={`/${locale}/home`}>
          {vi ? 'Bước vào mạng lưới' : 'Explore the network'}
          <ArrowUpRight size={21} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
