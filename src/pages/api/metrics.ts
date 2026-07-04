import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { getDashboard } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const dashboard = await getDashboard();

  return new Response(JSON.stringify(dashboard), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
