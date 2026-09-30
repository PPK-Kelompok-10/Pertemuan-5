import "server-only";

type Entry = { count: number; resetAt: number };
const g = globalThis as unknown as { __rl?: Map<string, Entry> };
const store = (g.__rl ??= new Map<string, Entry>());

/**
 * Rate limit sederhana in-memory (cukup untuk tugas/single instance).
 * Di serverless (Vercel) memori tidak dibagi antar instance — untuk production gunakan Upstash/Redis.
 */
export function rateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > limit) return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  return { ok: true, retryAfterSec: 0 };
}

export const resetRateLimit = (key: string) => void store.delete(key);
