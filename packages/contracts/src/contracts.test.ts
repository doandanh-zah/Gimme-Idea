import { describe, expect, it } from 'vitest';
import { apiErrorSchema, localeSchema } from './index.js';

describe('public contracts', () => {
  it('accepts only supported locales', () => {
    expect(localeSchema.safeParse('en').success).toBe(true);
    expect(localeSchema.safeParse('fr').success).toBe(false);
  });

  it('requires a request id in API errors', () => {
    expect(
      apiErrorSchema.safeParse({ code: 'NOT_FOUND', message: 'Missing', requestId: 'req-1' })
        .success,
    ).toBe(true);
  });
});
