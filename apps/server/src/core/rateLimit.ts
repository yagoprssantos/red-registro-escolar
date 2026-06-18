/**
 * Simple in-memory rate limiter for Express and tRPC routes
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

function getClientIp(req: {
  ip?: string;
  headers: Record<string, unknown>;
}): string {
  return req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
}

function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, maxRequests - entry.count);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

export function rateLimitMiddleware(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const { windowMs, maxRequests } = options;

  return (
    req: { ip?: string; headers: Record<string, unknown> },
    res: {
      setHeader: (key: string, value: string) => void;
      status: (code: number) => { json: (body: unknown) => void };
    },
    next: () => void
  ) => {
    const ip = getClientIp(req);
    const key = `express:${ip}:${windowMs}`;
    const result = checkRateLimit(key, windowMs, maxRequests);

    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    res.setHeader(
      "X-RateLimit-Reset",
      String(Math.ceil(result.resetAt / 1000))
    );

    if (!result.allowed) {
      res.status(429).json({
        error: "Too Many Requests",
        message: `Limite de ${maxRequests} requisições por ${Math.round(windowMs / 1000)}s excedido`,
      });
      return;
    }

    next();
  };
}

/**
 * tRPC middleware for rate limiting authenticated requests
 */
export function rateLimitTRPC(options: {
  windowMs: number;
  maxRequests: number;
}) {
  const { windowMs, maxRequests } = options;

  return async (opts: {
    ctx: {
      req: { ip?: string; headers: Record<string, unknown> };
      res: unknown;
      user?: { id: number };
    };
    next: () => Promise<unknown>;
  }) => {
    const ip = getClientIp(opts.ctx.req);
    const userId = opts.ctx.user?.id ?? "anon";
    const key = `trpc:${ip}:${userId}:${windowMs}`;

    const result = checkRateLimit(key, windowMs, maxRequests);

    if (!result.allowed) {
      throw new Error(
        `Limite de ${maxRequests} requisições por ${Math.round(windowMs / 1000)}s excedido. Tente novamente em alguns segundos.`
      );
    }

    return await opts.next();
  };
}
