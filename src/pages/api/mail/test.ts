import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { sendTestMail, verifyMailConnection } from '../../../lib/mail';
import { publicError, publicJson, rateLimit } from '../../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  const verify = await verifyMailConnection();
  return publicJson({
    verify: {
      ok: verify.ok,
      error: verify.ok ? undefined : 'Mail notifications need attention.',
    },
  });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`mail-test:${ip}`, 5, 60_000)) {
    return publicError('Too many attempts. Try again shortly.', 429);
  }

  // Always send to configured admin — never accept arbitrary "to" from client
  const result = await sendTestMail();
  if (result.ok) return publicJson({ ok: true });
  return publicError('Could not send test notification.', 502);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
