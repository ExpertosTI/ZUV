import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { probeInsforge } from '../../../lib/insforge';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const status = await probeInsforge();
  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
