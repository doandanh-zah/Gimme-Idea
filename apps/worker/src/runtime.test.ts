import { describe, expect, it } from 'vitest';
import { assertClaims, normalizeColosseumProject } from './runtime.js';

describe('worker input boundaries', () => {
  it('accepts sourced claims and rejects unsourced or non-HTTPS AI output', () => {
    expect(
      assertClaims({
        claims: [
          {
            fieldPath: 'summary',
            claim: 'A bounded public claim',
            confidence: 0.8,
            sources: [{ title: 'Primary source', url: 'https://source.test/evidence' }],
          },
        ],
      }),
    ).toHaveLength(1);
    expect(() =>
      assertClaims({
        claims: [
          {
            fieldPath: 'summary',
            claim: 'Unsafe claim',
            confidence: 1,
            sources: [{ title: 'Bad', url: 'http://source.test' }],
          },
        ],
      }),
    ).toThrow('AI_SOURCE_INVALID');
  });
  it('normalizes only complete HTTPS Colosseum records', () => {
    expect(
      normalizeColosseumProject({
        id: 'radar-1',
        name: 'Proof project',
        description: 'A source-backed project.',
        url: 'https://arena.colosseum.org/projects/proof',
      }),
    ).toMatchObject({ externalId: 'radar-1', entityType: 'project' });
    expect(
      normalizeColosseumProject({
        id: 'radar-2',
        name: 'Missing URL',
        description: 'No safe provenance.',
        url: 'javascript:alert(1)',
      }),
    ).toBeNull();
  });
});
