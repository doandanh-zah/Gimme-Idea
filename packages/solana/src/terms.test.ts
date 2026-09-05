import { describe, expect, it } from 'vitest';
import { canonicalizeBountyTerms, hashBountyTerms } from './index.js';

describe('canonical bounty terms', () => {
  it('is key-order independent and preserves integer strings', () => {
    const left = { prizeAmountRaw: '90071992547409931234', version: 1, nested: { b: 2, a: 1 } };
    const right = { nested: { a: 1, b: 2 }, version: 1, prizeAmountRaw: '90071992547409931234' };
    expect(canonicalizeBountyTerms(left)).toBe(canonicalizeBountyTerms(right));
    expect(hashBountyTerms(left)).toBe(hashBountyTerms(right));
    expect(hashBountyTerms(left)).toMatch(/^[0-9a-f]{64}$/);
  });
});
