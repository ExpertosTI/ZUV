import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { getMetrics, getQuotes, getClients } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const [metrics, quotes, clients] = await Promise.all([
    getMetrics(),
    getQuotes(),
    getClients(),
  ]);

  return new Response(
    JSON.stringify({
      metrics,
      quotes,
      clients,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
