export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Tiny in-memory TTL cache to cut Supabase egress.
 * NOTE: per-instance only (Railway multi-replica won't share cache).
 */
export class TTLCache<T> {
  private map = new Map<string, CacheEntry<T>>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  delete(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}
