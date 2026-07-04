import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { getBilling, saveBilling, type BillingProfile } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const billing = await getBilling();
  return json(billing);
};

export const PUT: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: Partial<BillingProfile>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const current = await getBilling();
  const next = await saveBilling({
    ...current,
    ...body,
    defaultTaxRate: Number(body.defaultTaxRate ?? current.defaultTaxRate) || 0,
  });

  return json(next);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
