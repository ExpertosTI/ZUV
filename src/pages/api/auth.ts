import type { APIRoute } from 'astro';
import { encodeAdminToken, isValidPin } from '../../lib/auth';
import { publicError, publicJson, rateLimit } from '../../lib/security';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`auth:${ip}`, 8, 60_000)) {
    return publicError('Too many attempts. Try again shortly.', 429);
  }

  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  const pin = String(body.pin || '').slice(0, 32);
  if (!isValidPin(pin)) {
    return publicError('Unauthorized', 401);
  }

  const token = encodeAdminToken(pin);
  if (!token) return publicError('Unauthorized', 401);

  return publicJson({ ok: true, token });
};
