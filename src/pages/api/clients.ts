import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { getClients, saveClients, type ClientWork } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async () => {
  const clients = await getClients();
  return new Response(JSON.stringify(clients), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: Partial<ClientWork>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const clients = await getClients();
  const client: ClientWork = {
    id: `c_${Date.now().toString(36)}`,
    name: String(body.name || '').trim(),
    city: String(body.city || '').trim(),
    service: String(body.service || '').trim(),
    blurb: String(body.blurb || '').trim(),
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    date: String(body.date || new Date().toISOString().slice(0, 10)),
    featured: Boolean(body.featured),
  };

  if (!client.name || !client.blurb) {
    return new Response(JSON.stringify({ error: 'Name and blurb required' }), { status: 400 });
  }

  clients.unshift(client);
  await saveClients(clients);

  return new Response(JSON.stringify(client), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
