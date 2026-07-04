import type { APIRoute } from 'astro';
import { trackVisit } from '../../lib/store';

export const prerender = false;

/** Internal visit ping — does not expose metrics. */
export const POST: APIRoute = async ({ request, cookies }) => {
  let visitorKey = cookies.get('zav_vid')?.value;
  if (!visitorKey) {
    visitorKey = `v_${crypto.randomUUID()}`;
    cookies.set('zav_vid', visitorKey, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      secure: request.url.startsWith('https'),
    });
  }

  await trackVisit(visitorKey);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
