import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { getMailConfigStatus, sendTestMail, verifyMailConnection } from '../../../lib/mail';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const status = getMailConfigStatus();
  const verify = await verifyMailConnection();
  return json({ status, verify });
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
  return json(result, result.ok ? 200 : 502);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
