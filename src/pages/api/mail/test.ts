import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { getMailConfigStatus, sendTestMail, verifyMailConnection } from '../../../lib/mail';
import { getWhatsAppConfigStatus } from '../../../lib/whatsapp';
import { publicError, publicJson, rateLimit } from '../../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  const verify = await verifyMailConnection();
  const status = getMailConfigStatus();
  const whatsapp = getWhatsAppConfigStatus();
  return publicJson({
    verify: {
      ok: verify.ok,
      error: verify.ok ? undefined : verify.error || 'Mail notifications need attention.',
      hint: verify.ok ? undefined : verify.hint,
    },
    status,
    whatsapp,
  });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`mail-test:${ip}`, 5, 60_000)) {
    return publicError('Too many attempts. Try again shortly.', 429);
  }

  const result = await sendTestMail();
  if (result.ok) return publicJson({ ok: true, to: result.to });
  return publicJson({ ok: false, error: result.error || 'Could not send test notification.' }, 502);
};
