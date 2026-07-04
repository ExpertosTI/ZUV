/** Safe API responses — never leak stacks, paths, or secrets. */

export function publicError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}

export function publicJson(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store',
    },
  });
}

/** Strip secrets from objects before logging */
export function redact(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const clone = { ...(value as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (/pass|secret|token|authorization|cookie/i.test(key)) {
      clone[key] = '[redacted]';
    }
  }
  return clone;
}

const hits = new Map<string, { count: number; reset: number }>();

/** Simple in-memory rate limit (per process). */
export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || now > row.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  row.count += 1;
  if (row.count > limit) return false;
  return true;
}
