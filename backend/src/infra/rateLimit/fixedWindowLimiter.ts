import type { Clock } from "../../domain/ports/Clock.js";

export interface LimitResult {
  allowed: boolean;
  // Remaining time of the current window; how long the client should wait when blocked
  retryAfterMs: number;
}

interface Window {
  count: number;
  resetsAt: number;
}

// Counts hits per key in fixed time windows (e.g. 30 per 10 minutes per IP).
// In memory: each backend instance counts on its own. With several instances the
// counters would move to Redis (INCR + EXPIRE), like the room state.
export class FixedWindowLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly options: { limit: number; windowMs: number; clock: Clock },
  ) {}

  // Counts one hit for the key and says whether it is still within the limit
  hit(key: string): LimitResult {
    const now = this.options.clock.now();
    this.sweep(now);

    const current = this.windows.get(key);
    const window = current && current.resetsAt > now ? current : { count: 0, resetsAt: now + this.options.windowMs };
    window.count += 1;
    this.windows.set(key, window);

    return { allowed: window.count <= this.options.limit, retryAfterMs: window.resetsAt - now };
  }

  // Says whether the key is already over the limit, without counting a hit
  check(key: string): LimitResult {
    const now = this.options.clock.now();
    const window = this.windows.get(key);
    if (!window || window.resetsAt <= now) return { allowed: true, retryAfterMs: 0 };
    return { allowed: window.count < this.options.limit, retryAfterMs: window.resetsAt - now };
  }

  get size(): number {
    return this.windows.size;
  }

  // Drops expired windows so the map doesn't grow with every IP ever seen
  private sweep(now: number): void {
    if (this.windows.size < 1000) return;
    for (const [key, window] of this.windows) {
      if (window.resetsAt <= now) this.windows.delete(key);
    }
  }
}
