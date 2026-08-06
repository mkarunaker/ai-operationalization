export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type Entry = { attempts: number; resetAt: number };

export class FixedWindowRateLimiter {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  consume(key: string): RateLimitResult {
    const timestamp = this.now();
    const current = this.entries.get(key);
    const entry = !current || current.resetAt <= timestamp ? { attempts: 0, resetAt: timestamp + this.windowMs } : current;

    if (entry.attempts >= this.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - timestamp) / 1000)) };
    }

    entry.attempts += 1;
    this.entries.set(key, entry);
    return { allowed: true };
  }
}

export const localLoginRateLimiter = new FixedWindowRateLimiter(5, 60_000);
