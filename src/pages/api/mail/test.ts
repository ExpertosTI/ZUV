import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { sendTestMail, verifyMailConnection } from '../../../lib/mail';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const verify = await verifyMailConnection();
  return json({
    verify: {
      ok: verify.ok,
      error: verify.ok ? undefined : 'Mail notifications need attention.',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let to: string | undefined;
  try {
    const body = await request.json();
    to = typeof body?.to === 'string' ? body.to : undefined;
  } catch {
    /* optional body */
  }

  const result = await sendTestMail(to);
  if (result.ok) return json({ ok: true, to: result.to });
  return json({ ok: false, error: 'Could not send test notification.' }, 502);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
