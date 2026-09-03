export type NumberContext = 'compact' | 'detailed';
export type SignMode = 'auto' | 'always';

export type FormattedValue = {
  display: string;
  raw: string;
  ariaLabel: string;
};

const invalidValue: FormattedValue = {
  display: '--',
  raw: '',
  ariaLabel: 'no data',
};

function parseValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return null;
  return Object.is(parsed, -0) ? 0 : parsed;
}

function rawDecimal(value: string | number, parsed: number) {
  if (typeof value === 'string' && !/[eE]/.test(value)) return value;
  const rendered = parsed.toString();
  if (!/[eE]/.test(rendered)) return rendered;
  return parsed.toFixed(20).replace(/\.?0+$/, '');
}

function signedPrefix(value: number, sign: SignMode) {
  if (value < 0) return '-';
  if (value > 0 && sign === 'always') return '+';
  return '';
}

export function formatStableValue(
  value: string | number | null | undefined,
  context: NumberContext = 'compact',
  sign: SignMode = 'auto',
): FormattedValue {
  const parsed = parseValue(value);
  if (parsed === null) return invalidValue;
  if (parsed === 0) return { display: '$0.00', raw: '0', ariaLabel: '0 US dollars' };

  const absolute = Math.abs(parsed);
  const prefix = signedPrefix(parsed, sign);
  const raw = rawDecimal(value as string | number, parsed);
  if (absolute < 0.01) {
    return {
      display: `${prefix}<$0.01`,
      raw,
      ariaLabel: `${prefix}less than 0.01 US dollars`,
    };
  }

  if (context === 'compact') {
    const suffixes = [
      { threshold: 1e12, suffix: 'T' },
      { threshold: 1e9, suffix: 'B' },
      { threshold: 1e6, suffix: 'M' },
      { threshold: 1e3, suffix: 'K' },
    ];
    const unit = suffixes.find(({ threshold }) => absolute >= threshold);
    if (unit) {
      const abbreviated = (absolute / unit.threshold).toFixed(1).replace(/\.0$/, '');
      const display = `${prefix}$${abbreviated}${unit.suffix}`;
      return { display, raw, ariaLabel: display };
    }
  }

  const display = `${prefix}$${absolute.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  return { display, raw, ariaLabel: display };
}

export function formatUsdcAmount(
  value: string | number | null | undefined,
  context: NumberContext = 'detailed',
  sign: SignMode = 'auto',
): FormattedValue {
  const parsed = parseValue(value);
  if (parsed === null) return invalidValue;
  if (parsed === 0) return { display: '0', raw: '0', ariaLabel: '0 USDC' };

  const absolute = Math.abs(parsed);
  const prefix = signedPrefix(parsed, sign);
  const raw = rawDecimal(value as string | number, parsed);
  const decimals = context === 'compact' ? 2 : 4;
  const rounded = absolute.toFixed(decimals).replace(/\.?0+$/, '');
  if (Number(rounded) === 0) {
    const marker = context === 'compact' ? '0.01' : '0.0001';
    return {
      display: `${prefix}<${marker}`,
      raw,
      ariaLabel: `${prefix}less than ${marker} USDC`,
    };
  }

  const display = `${prefix}${Number(rounded).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  })}`;
  return { display, raw, ariaLabel: `${display} USDC` };
}

export function formatSolAmount(
  value: string | number | null | undefined,
  context: NumberContext = 'detailed',
): FormattedValue {
  const parsed = parseValue(value);
  if (parsed === null) return invalidValue;
  if (parsed === 0) return { display: '0', raw: '0', ariaLabel: '0 SOL' };

  const absolute = Math.abs(parsed);
  const raw = rawDecimal(value as string | number, parsed);
  const decimals = context === 'compact' ? 4 : 6;
  const rounded = absolute.toFixed(decimals).replace(/\.?0+$/, '');
  if (Number(rounded) === 0) {
    const marker = context === 'compact' ? '0.0001' : '0.000001';
    return {
      display: `<${marker}`,
      raw,
      ariaLabel: `less than ${marker} SOL`,
    };
  }

  const display = Number(rounded).toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
  return { display, raw, ariaLabel: `${display} SOL` };
}
