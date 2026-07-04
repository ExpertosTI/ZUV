import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { updateQuote, type QuoteStatus } from '../../../lib/store';

export const prerender = false;

export const PATCH: APIRoute = async ({ params, request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const id = params.id;
  if (!id) return json({ error: 'Missing id' }, 400);

  let body: { status?: QuoteStatus; notes?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const patch: Parameters<typeof updateQuote>[1] = {};
  if (body.status === 'new' || body.status === 'viewed' || body.status === 'done') {
    patch.status = body.status;
    if (body.status === 'done') patch.completedAt = new Date().toISOString();
  }
  if (typeof body.notes === 'string') patch.notes = body.notes;

  const quote = await updateQuote(id, patch);
  if (!quote) return json({ error: 'Not found' }, 404);

  return json({ ok: true, quote });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
