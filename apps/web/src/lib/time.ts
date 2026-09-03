import type { Locale } from '@gimme-idea/contracts';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatPostTime(locale: Locale, iso: string, now = Date.now()) {
  const created = new Date(iso).getTime();
  if (!Number.isFinite(created)) return iso;
  const age = Math.max(0, now - created);
  if (age < DAY) {
    const relativeFormatter = new Intl.RelativeTimeFormat(locale, { numeric: 'always' });
    if (age < MINUTE)
      return relativeFormatter.format(-Math.max(1, Math.floor(age / SECOND)), 'second');
    if (age < HOUR) return relativeFormatter.format(-Math.floor(age / MINUTE), 'minute');
    return relativeFormatter.format(-Math.floor(age / HOUR), 'hour');
  }
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}
