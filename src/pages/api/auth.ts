import type { APIRoute } from 'astro';
import { encodeAdminToken, isValidPin } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: { pin?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const pin = String(body.pin || '');

  if (!isValidPin(pin)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  return json({
    ok: true,
    token: encodeAdminToken(pin),
  });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
