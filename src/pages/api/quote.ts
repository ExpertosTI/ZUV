import type { APIRoute } from 'astro';
import { sendQuoteNotifications } from '../../lib/mail';
import { addQuote } from '../../lib/store';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const service = String(body.service || '').trim();
  const size = String(body.size || '').trim();
  const frequency = String(body.frequency || '').trim();
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const zip = String(body.zip || '').trim();
  const notes = String(body.notes || '').trim();
  const locale = String(body.locale || 'en').trim();

  if (!service || !size || !frequency || !name || !phone || !email || !zip) {
    return json({ error: 'Missing required fields' }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }

  const quote = await addQuote({
    service,
    size,
    frequency,
    name,
    phone,
    email,
    zip,
    notes: notes || undefined,
    locale,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  // Notify client + admin; never fail the quote if mail has issues
  let mail = { sent: false as boolean };
  try {
    mail = await sendQuoteNotifications(quote);
  } catch (err) {
    console.error('[quote] mail failed', err);
  }

  return json({ ok: true, id: quote.id, mail }, 201);
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
