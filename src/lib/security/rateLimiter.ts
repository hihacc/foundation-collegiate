import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache
const rateLimitCache = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitCache.entries()) {
      if (now > record.resetTime) {
        rateLimitCache.delete(key);
      }
    }
  }, 300000);
}

/**
 * Checks whether a given IP has exceeded the allowed request limit within the window.
 * @param req NextRequest
 * @param limit Max allowed requests within window (default: 60)
 * @param windowMs Window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  req: NextRequest,
  limit: number = 60,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; reset: number } {
  // Extract client IP address from standard headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const routeKey = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();

  const record = rateLimitCache.get(routeKey);

  if (!record || now > record.resetTime) {
    rateLimitCache.set(routeKey, { count: 1, resetTime: now + windowMs });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000)
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000)
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetTime / 1000)
  };
}
