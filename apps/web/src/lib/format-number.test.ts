import { describe, expect, it } from 'vitest';
import { formatSolAmount, formatStableValue, formatUsdcAmount } from './format-number';

describe('wallet number formatting', () => {
  it('normalizes zero and signed zero', () => {
    expect(formatStableValue(0).display).toBe('$0.00');
    expect(formatStableValue(-0).display).toBe('$0.00');
  });

  it('uses compact abbreviations and never scientific notation', () => {
    expect(formatStableValue(1234.5).display).toBe('$1.2K');
    expect(formatStableValue(1.52e12).display).toBe('$1.5T');
  });

  it('keeps detailed USDC precision and signed activity amounts', () => {
    expect(formatUsdcAmount('0.001').display).toBe('0.001');
    expect(formatUsdcAmount('300', 'detailed', 'always').display).toBe('+300');
    expect(formatUsdcAmount('-300', 'detailed', 'always').display).toBe('-300');
  });

  it('renders tiny and missing values safely', () => {
    expect(formatStableValue(0.004).display).toBe('<$0.01');
    expect(formatStableValue(null).display).toBe('--');
    expect(formatStableValue(Number.NaN).display).toBe('--');
  });
});

describe('formatSolAmount', () => {
  it('keeps useful Devnet precision without noisy zeroes', () => {
    expect(formatSolAmount('1.250000000').display).toBe('1.25');
    expect(formatSolAmount('0.0000002').display).toBe('<0.000001');
  });
});
