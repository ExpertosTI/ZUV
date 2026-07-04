import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { publicError, publicJson } from '../../lib/security';
import { getClients, saveClients, type ClientWork } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async () => {
  const clients = await getClients();
  // Public feed: only safe fields
  return publicJson(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      service: c.service,
      blurb: c.blurb,
      rating: c.rating,
      date: c.date,
    })),
  );
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  let body: Partial<ClientWork>;
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  const clients = await getClients();
  const client: ClientWork = {
    id: `c_${Date.now().toString(36)}`,
    name: String(body.name || '').trim().slice(0, 80),
    city: String(body.city || '').trim().slice(0, 80),
    service: String(body.service || '').trim().slice(0, 80),
    blurb: String(body.blurb || '').trim().slice(0, 500),
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    date: String(body.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
    featured: Boolean(body.featured),
  };

  if (!client.name || !client.blurb) {
    return publicError('Name and blurb required', 400);
  }

  clients.unshift(client);
  await saveClients(clients);

  return publicJson(client, 201);
};
