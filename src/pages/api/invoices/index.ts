import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { sendInvoiceToClient } from '../../../lib/mail';
import { publicError, publicJson } from '../../../lib/security';
import { createInvoiceFromQuote, getInvoices, getQuotes, updateInvoice } from '../../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  const invoices = await getInvoices();
  return publicJson({ invoices });
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  let body: {
    quoteId?: string;
    amount?: number;
    taxRate?: number;
    description?: string;
    clientAddress?: string;
    notes?: string;
    notifyClient?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  if (!body.quoteId) return publicError('quoteId required', 400);

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) {
    return publicError('Invalid amount', 400);
  }

  let invoice;
  try {
    invoice = await createInvoiceFromQuote(body.quoteId, {
      amount,
      taxRate: body.taxRate,
      description: body.description?.slice(0, 500),
      clientAddress: body.clientAddress?.slice(0, 300),
      notes: body.notes?.slice(0, 1000),
    });
  } catch {
    console.error('[invoice] create failed');
    return publicError('Could not create invoice', 500);
  }

  if (!invoice) return publicError('Quote not found', 404);

  let mail = { ok: false as boolean };
  const notify = body.notifyClient !== false;
  if (notify) {
    try {
      const quotes = await getQuotes();
      const quote = quotes.find((q) => q.id === invoice.quoteId);
      mail = await sendInvoiceToClient(invoice, quote?.locale || 'en');
      if (mail.ok) {
        await updateInvoice(invoice.id, { status: 'sent' });
        invoice = { ...invoice, status: 'sent' };
      }
    } catch {
      console.error('[invoice] notify failed');
    }
  }

  return publicJson({ ok: true, invoice, mail }, 201);
};

export const PATCH: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  let body: { id?: string } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  if (!body.id || typeof body.id !== 'string') {
    return publicError('id required', 400);
  }

  const { id, ...patch } = body;
  // Never allow arbitrary field injection of billingSnapshot secrets
  delete patch.billingSnapshot;

  try {
    const invoice = await updateInvoice(id, patch as never);
    if (!invoice) return publicError('Not found', 404);
    return publicJson({ ok: true, invoice });
  } catch {
    return publicError('Could not update invoice', 500);
  }
};
