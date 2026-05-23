import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsException } from 'src/shared/exceptions/domain.exceptions';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export const RateLimitPresets = {
  AUTH: { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'auth:' },
  API: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'api:' },
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 120, keyPrefix: 'pub:' },
} as const satisfies Record<string, RateLimitConfig>;

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Sweep expired entries every minute to avoid unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000).unref();

function hit(
  key: string,
  windowMs: number,
): { count: number; resetAt: number } {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  return entry;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Returns a plain NestJS functional middleware.
 * Usage: consumer.apply(createRateLimitMiddleware(RateLimitPresets.AUTH)).forRoutes(...)
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const ip = getClientIp(req);
    const key = `rl:${config.keyPrefix ?? ''}${ip}`;

    const { count, resetAt } = hit(key, config.windowMs);
    const remaining = Math.max(0, config.maxRequests - count);
    const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);

    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());

    if (count > config.maxRequests) {
      res.setHeader('Retry-After', retryAfterSec);
      throw new TooManyRequestsException(
        `Too many requests. Try again in ${retryAfterSec}s.`,
        retryAfterSec,
        'RateLimitMiddleware',
      );
    }

    next();
  };
}

// ─── IP helper ────────────────────────────────────────────────────────────────

const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;

function isValidIpv4(ip: string) {
  if (!IPV4_RE.test(ip)) return false;
  return ip
    .split('.')
    .map(Number)
    .every((n) => n >= 0 && n <= 255);
}

function getClientIp(req: Request): string {
  if (process.env.NODE_ENV === 'production') {
    const cf = req.headers['cf-connecting-ip'];
    if (typeof cf === 'string' && isValidIpv4(cf)) return cf;

    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string') {
      const first = fwd.split(',')[0].trim();
      if (isValidIpv4(first)) return first;
    }
  }

  return req.ip ?? 'unknown';
}
