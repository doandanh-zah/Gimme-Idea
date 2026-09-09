'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  Github,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  X,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import {
  CaseStudyItem,
  CaseStudyTheme,
  CaseStudyStage,
  CASE_STUDY_THEMES,
  CASE_STUDY_STAGES,
  filterCaseStudies,
} from '@/lib/case-studies';

const stageLabels: Record<CaseStudyStage, { en: string; vi: string; colorClass: string }> = {
  unicorn: {
    en: 'UNICORN',
    vi: 'KỲ LÂN',
    colorClass: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
  },
  growth: {
    en: 'GROWTH',
    vi: 'TĂNG TRƯỞNG',
    colorClass: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
  },
  live: {
    en: 'LIVE PRODUCT',
    vi: 'ĐANG HOẠT ĐỘNG',
    colorClass: 'border-sky-500/40 text-sky-300 bg-sky-500/10',
  },
  prototype: {
    en: 'PROTOTYPE',
    vi: 'NGHIÊN CỨU & MẪU',
    colorClass: 'border-slate-500/40 text-slate-300 bg-slate-500/10',
  },
  sunset: {
    en: 'SUNSET / LESSON',
    vi: 'ĐÃ DỪNG / BÀI HỌC',
    colorClass: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
  },
};

export function CaseStudiesExplorer({
  initialItems,
  locale,
}: {
  initialItems: CaseStudyItem[];
  locale: Locale;
}) {
  const [query, setQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'name_asc'>('score_desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return filterCaseStudies({
      query,
      theme: selectedTheme === 'all' ? null : selectedTheme,
      stage: selectedStage === 'all' ? null : selectedStage,
      sortBy,
    });
  }, [query, selectedTheme, selectedStage, sortBy]);

  const stats = useMemo(() => {
    const total = initialItems.length;
    const unicorns = initialItems.filter((i) => i.case_study.stage === 'unicorn').length;
    const growth = initialItems.filter((i) => i.case_study.stage === 'growth').length;
    return { total, unicorns, growth };
  }, [initialItems]);

  return (
    <div className="case-studies-container space-y-6">
      {/* Overview Stats Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border border-[var(--line,#2a2a2a)] bg-[var(--surface-subtle,#141414)] rounded-sm">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[var(--muted,#888)] font-mono">
            {locale === 'vi' ? 'Tổng số hồ sơ' : 'Total Cases'}
          </span>
          <span className="text-2xl font-bold font-mono text-[var(--text,#fff)]">
            {stats.total}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[var(--muted,#888)] font-mono">
            {locale === 'vi' ? 'Kỳ lân công nghệ' : 'Unicorn Cases'}
          </span>
          <span className="text-2xl font-bold font-mono text-amber-400">{stats.unicorns}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[var(--muted,#888)] font-mono">
            {locale === 'vi' ? 'Đang tăng trưởng' : 'Growth & Active'}
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-400">{stats.growth}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-[var(--muted,#888)] font-mono">
            {locale === 'vi' ? 'Ngành & Lĩnh vực' : 'Themes'}
          </span>
          <span className="text-2xl font-bold font-mono text-[var(--yellow,#f9d65c)]">
            {CASE_STUDY_THEMES.length}
          </span>
        </div>
      </section>

      {/* Control Surface: Search, Themes, Stages, Sorting */}
      <section className="space-y-4 p-4 border border-[var(--line,#2a2a2a)] bg-[var(--surface,#181818)] rounded-sm">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted,#888)]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                locale === 'vi'
                  ? 'Tìm kiếm theo tên, bài toán, giải pháp hoặc từ khóa (vd: Ollama, DeFi, Solana)...'
                  : 'Search by name, problem, solution, tags (e.g. Ollama, DeFi, Solana)...'
              }
              className="w-full pl-10 pr-10 py-2 text-sm bg-[var(--canvas,#0f0f0f)] border border-[var(--line,#2a2a2a)] text-[var(--text,#fff)] focus:outline-none focus:border-[var(--yellow,#f9d65c)] rounded-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted,#888)] hover:text-white"
                aria-label={locale === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-mono uppercase text-[var(--muted,#888)] whitespace-nowrap"
            >
              {locale === 'vi' ? 'Sắp xếp:' : 'Sort:'}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm bg-[var(--canvas,#0f0f0f)] border border-[var(--line,#2a2a2a)] text-[var(--text,#fff)] rounded-sm focus:outline-none focus:border-[var(--yellow,#f9d65c)]"
            >
              <option value="score_desc">
                {locale === 'vi' ? 'Điểm cao nhất (Score)' : 'Highest Score'}
              </option>
              <option value="score_asc">
                {locale === 'vi' ? 'Điểm thấp nhất' : 'Lowest Score'}
              </option>
              <option value="name_asc">{locale === 'vi' ? 'Tên (A-Z)' : 'Name (A-Z)'}</option>
            </select>
          </div>
        </div>

        {/* Theme Pills */}
        <div>
          <div className="text-xs font-mono uppercase text-[var(--muted,#888)] mb-2 flex items-center gap-1.5">
            <Layers size={13} />
            <span>{locale === 'vi' ? 'Chủ đề / Ngành' : 'Ecosystem Theme'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedTheme('all')}
              className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors border ${
                selectedTheme === 'all'
                  ? 'border-[var(--yellow,#f9d65c)] bg-[var(--yellow,#f9d65c)]/15 text-[var(--yellow,#f9d65c)] font-semibold'
                  : 'border-[var(--line,#2a2a2a)] text-[var(--muted,#888)] hover:text-white hover:border-[var(--line-strong,#444)]'
              }`}
            >
              {locale === 'vi' ? 'Tất cả' : 'All Themes'} ({initialItems.length})
            </button>
            {CASE_STUDY_THEMES.map((theme) => {
              const count = initialItems.filter((i) => i.theme === theme).length;
              const isActive = selectedTheme === theme;
              return (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setSelectedTheme(theme)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors border ${
                    isActive
                      ? 'border-[var(--yellow,#f9d65c)] bg-[var(--yellow,#f9d65c)]/15 text-[var(--yellow,#f9d65c)] font-semibold'
                      : 'border-[var(--line,#2a2a2a)] text-[var(--muted,#888)] hover:text-white hover:border-[var(--line-strong,#444)]'
                  }`}
                >
                  {theme} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Filter */}
        <div>
          <div className="text-xs font-mono uppercase text-[var(--muted,#888)] mb-2 flex items-center gap-1.5">
            <TrendingUp size={13} />
            <span>{locale === 'vi' ? 'Trạng thái / Cấp độ' : 'Stage / Maturity'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors border ${
                selectedStage === 'all'
                  ? 'border-white/50 bg-white/10 text-white font-semibold'
                  : 'border-[var(--line,#2a2a2a)] text-[var(--muted,#888)] hover:text-white'
              }`}
            >
              {locale === 'vi' ? 'Tất cả giai đoạn' : 'All Stages'}
            </button>
            {CASE_STUDY_STAGES.map((stage) => {
              const count = initialItems.filter((i) => i.case_study.stage === stage).length;
              const isActive = selectedStage === stage;
              const cfg = stageLabels[stage];
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setSelectedStage(stage)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-sm transition-colors border ${
                    isActive
                      ? cfg.colorClass + ' font-semibold'
                      : 'border-[var(--line,#2a2a2a)] text-[var(--muted,#888)] hover:text-white'
                  }`}
                >
                  {locale === 'vi' ? cfg.vi : cfg.en} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Result Count */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--muted,#888)]">
        <span>
          {locale === 'vi'
            ? `Hiển thị ${filteredItems.length} trên tổng số ${initialItems.length} case study`
            : `Showing ${filteredItems.length} of ${initialItems.length} case studies`}
        </span>
        {(query || selectedTheme !== 'all' || selectedStage !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedTheme('all');
              setSelectedStage('all');
            }}
            className="text-[var(--yellow,#f9d65c)] hover:underline"
          >
            {locale === 'vi' ? 'Đặt lại bộ lọc' : 'Reset filters'}
          </button>
        )}
      </div>

      {/* Cards Feed */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const stageCfg = stageLabels[item.case_study.stage];

            return (
              <article
                key={item.id}
                className="border border-[var(--line,#2a2a2a)] bg-[var(--surface,#181818)] rounded-sm p-5 flex flex-col justify-between hover:border-[var(--line-strong,#444)] transition-all space-y-4"
              >
                {/* Header: Score, Theme, Stage */}
                <div className="flex items-center justify-between gap-2 border-b border-[var(--line,#2a2a2a)] pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs border border-[var(--line,#2a2a2a)] bg-[var(--surface-subtle,#141414)] text-[var(--yellow,#f9d65c)] font-medium">
                      {item.theme}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-xs border ${stageCfg.colorClass}`}
                    >
                      {locale === 'vi' ? stageCfg.vi : stageCfg.en}
                    </span>
                    {item.case_study.origin_hackathon && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-xs border border-violet-500/40 text-violet-300 bg-violet-500/10">
                        {item.case_study.origin_hackathon}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Award size={14} className="text-[var(--yellow,#f9d65c)]" />
                    <span className="text-xs font-mono font-bold text-[var(--text,#fff)]">
                      {item.case_study.score}
                      <span className="text-[var(--muted,#888)] font-normal text-[10px]">/100</span>
                    </span>
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-[var(--text,#fff)] tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[var(--text-subtle,#aaa)] mt-1 leading-relaxed">
                    {item.tagline}
                  </p>
                </div>

                {/* Core Problem (Problem Network First) */}
                <div className="p-3 bg-[var(--canvas,#0f0f0f)] border-l-2 border-rose-500/70 rounded-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-mono uppercase tracking-wider font-semibold">
                    <AlertCircle size={13} />
                    <span>{locale === 'vi' ? 'BÀI TOÁN CỐT LÕI' : 'PRIMARY PROBLEM'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text,#fff)]">
                    {item.problem.title}
                  </h4>
                  <p className="text-xs text-[var(--muted,#888)] leading-relaxed">
                    {item.problem.summary}
                  </p>
                  {item.problem.target_audience.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {item.problem.target_audience.map((aud) => (
                        <span
                          key={aud}
                          className="text-[10px] font-mono px-1.5 py-0.2 bg-white/5 text-[var(--muted,#888)] border border-[var(--line,#2a2a2a)] rounded-xs"
                        >
                          {aud}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Solution Thesis */}
                <div className="p-3 bg-[var(--canvas,#0f0f0f)] border-l-2 border-amber-400/70 rounded-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono uppercase tracking-wider font-semibold">
                    <Lightbulb size={13} />
                    <span>{locale === 'vi' ? 'LUẬN ĐIỂM GIẢI PHÁP' : 'SOLUTION THESIS'}</span>
                  </div>
                  <p className="text-xs text-[var(--text-subtle,#ccc)] leading-relaxed">
                    {item.solution.thesis}
                  </p>
                </div>

                {/* Key Takeaway (For Builders) */}
                <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-mono uppercase tracking-wider font-semibold">
                    <Sparkles size={13} />
                    <span>
                      {locale === 'vi' ? 'BÀI HỌC CHO BUILDERS' : 'BUILDER TAKEAWAY'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-200/90 leading-relaxed italic">
                    "{item.case_study.key_takeaway}"
                  </p>
                </div>

                {/* Traction & Metrics */}
                {item.case_study.metrics_and_traction && (
                  <p className="text-[11px] font-mono text-[var(--muted,#888)] line-clamp-2">
                    <strong className="text-[var(--text,#fff)]">
                      {locale === 'vi' ? 'Traction: ' : 'Traction: '}
                    </strong>
                    {item.case_study.metrics_and_traction}
                  </p>
                )}

                {/* Expandable Details (Features & Team) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-[var(--line,#2a2a2a)] space-y-3">
                    {item.solution.key_features.length > 0 && (
                      <div>
                        <span className="text-[11px] font-mono uppercase text-[var(--muted,#888)] block mb-1.5">
                          {locale === 'vi' ? 'Tính năng giải pháp:' : 'Key Capabilities:'}
                        </span>
                        <ul className="space-y-1">
                          {item.solution.key_features.map((feat, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-[var(--text-subtle,#ccc)] flex items-start gap-1.5"
                            >
                              <CheckCircle2
                                size={13}
                                className="text-emerald-400 mt-0.5 shrink-0"
                              />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.case_study.team && (
                      <div className="text-xs font-mono text-[var(--muted,#888)] flex items-center gap-1.5">
                        <Users size={13} />
                        <span>{item.case_study.team.name}</span>
                        {item.case_study.team.founders.length > 0 && (
                          <span>
                            ({item.case_study.team.founders.join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Footer: External Links & Expand Toggle */}
                <footer className="pt-3 border-t border-[var(--line,#2a2a2a)] flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    {item.case_study.github_url && (
                      <a
                        href={item.case_study.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-[var(--muted,#888)] hover:text-white transition-colors"
                      >
                        <Github size={14} />
                        <span>GitHub</span>
                      </a>
                    )}
                    {item.case_study.website_url && (
                      <a
                        href={item.case_study.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono text-[var(--muted,#888)] hover:text-[var(--yellow,#f9d65c)] transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span>Website</span>
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs font-mono text-[var(--muted,#888)] hover:text-white transition-colors"
                  >
                    {isExpanded
                      ? locale === 'vi'
                        ? 'Thu gọn ▲'
                        : 'Collapse ▲'
                      : locale === 'vi'
                        ? 'Chi tiết ▼'
                        : 'Details ▼'}
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-[var(--line,#2a2a2a)] bg-[var(--surface,#181818)] rounded-sm space-y-3">
          <p className="text-sm text-[var(--muted,#888)]">
            {locale === 'vi'
              ? 'Không tìm thấy case study nào khớp với bộ lọc hiện tại.'
              : 'No case studies matched your current filters.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedTheme('all');
              setSelectedStage('all');
            }}
            className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-[var(--yellow,#f9d65c)] text-black font-bold rounded-sm"
          >
            {locale === 'vi' ? 'Xem tất cả 102 case study' : 'View all 102 case studies'}
          </button>
        </div>
      )}
    </div>
  );
}
