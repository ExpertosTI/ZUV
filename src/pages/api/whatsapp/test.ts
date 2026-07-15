import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { publicError, publicJson, rateLimit } from '../../../lib/security';
import { sendWhatsAppTest, whatsappConfigured } from '../../../lib/whatsapp';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, error: 'WhatsApp / Evolution not configured' }, 503);
  }

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`wa-test:${ip}`, 8, 60_000)) {
    return publicError('Too many attempts. Try again shortly.', 429);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    /* empty ok — sends to ADMIN_WHATSAPP */
  }

  const number = String(body.number || '').trim();
  const message = String(body.message || '').trim();
  const result = await sendWhatsAppTest(number || undefined, message || undefined);

  if (!result.ok) {
    return publicJson({ ok: false, success: false, error: result.error || 'send_failed' }, 502);
  }
  return publicJson({ ok: true, success: true, to: result.to });
};
