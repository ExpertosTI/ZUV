import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { createInvoiceFromQuote, getInvoices, updateInvoice } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const invoices = await getInvoices();
  return json({ invoices });
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: {
    quoteId?: string;
    amount?: number;
    taxRate?: number;
    description?: string;
    clientAddress?: string;
    notes?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.quoteId) return json({ error: 'quoteId required' }, 400);

  const invoice = await createInvoiceFromQuote(body.quoteId, {
    amount: Number(body.amount) || 0,
    taxRate: body.taxRate,
    description: body.description,
    clientAddress: body.clientAddress,
    notes: body.notes,
  });

  if (!invoice) return json({ error: 'Quote not found' }, 404);
  return json({ ok: true, invoice }, 201);
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: { id?: string } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.id || typeof body.id !== 'string') {
    return json({ error: 'id required' }, 400);
  }

  const { id, ...patch } = body;
  const invoice = await updateInvoice(id, patch as never);
  if (!invoice) return json({ error: 'Not found' }, 404);
  return json({ ok: true, invoice });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
