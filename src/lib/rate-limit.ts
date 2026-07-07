import { logger } from '@/lib/logger';
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Rate limiter en memoria (adecuado para instancia única / dev).
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, retryAfterMs: 0 };
  }

  if (entry.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

async function checkUpstashLoginRateLimit(
  ip: string
): Promise<RateLimitResult | null> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '15 m'),
      prefix: 'cf:login',
    });

    const result = await limiter.limit(ip);
    return {
      allowed: result.success,
      remaining: result.remaining,
      retryAfterMs: result.success
        ? 0
        : Math.max(0, result.reset - Date.now()),
    };
  } catch (error) {
    logger.error('Upstash rate limit error, using memory fallback:', error);
    return null;
  }
}

/** Límite de login: Upstash si está configurado, si no memoria local. */
export async function checkLoginRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const upstash = await checkUpstashLoginRateLimit(ip);
  if (upstash) return upstash;
  return checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
}

export function resetLoginRateLimit(ip: string): void {
  store.delete(`login:${ip}`);
}
