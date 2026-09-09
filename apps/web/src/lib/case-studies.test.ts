import { describe, expect, it } from 'vitest';
import {
  getAllCaseStudies,
  getCaseStudyById,
  getCaseStudiesByTheme,
  getCaseStudiesByStage,
  filterCaseStudies,
  CASE_STUDY_THEMES,
  CASE_STUDY_STAGES,
} from './case-studies';

describe('case-studies module', () => {
  it('should load all 102 case studies', () => {
    const all = getAllCaseStudies();
    expect(all).toHaveLength(102);
  });

  it('should find case study by id (e.g. ollama)', () => {
    const item = getCaseStudyById('ollama');
    expect(item).toBeDefined();
    expect(item?.name).toBe('Ollama');
    expect(item?.theme).toBe('AI');
    expect(item?.problem.title).toBeDefined();
    expect(item?.solution.thesis).toBeDefined();
    expect(item?.case_study.stage).toBe('unicorn');
  });

  it('should find case study by theme', () => {
    const aiItems = getCaseStudiesByTheme('AI');
    expect(aiItems.length).toBeGreaterThanOrEqual(10);
    expect(aiItems.every((item) => item.theme === 'AI')).toBe(true);
  });

  it('should find case study by stage', () => {
    const unicorns = getCaseStudiesByStage('unicorn');
    expect(unicorns.length).toBe(10);
  });

  it('should filter by query string', () => {
    const results = filterCaseStudies({ query: 'supabase' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain('Supabase');
  });

  it('should filter by theme and sort by score descending', () => {
    const results = filterCaseStudies({ theme: 'AI', sortBy: 'score_desc' });
    expect(results.length).toBe(10);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].case_study.score).toBeGreaterThanOrEqual(results[i].case_study.score);
    }
  });

  it('should have all valid themes and stages', () => {
    const all = getAllCaseStudies();
    for (const item of all) {
      expect(CASE_STUDY_THEMES).toContain(item.theme);
      expect(CASE_STUDY_STAGES).toContain(item.case_study.stage);
      expect(item.case_study.score).toBeGreaterThanOrEqual(0);
      expect(item.case_study.score).toBeLessThanOrEqual(100);
    }
  });
});
