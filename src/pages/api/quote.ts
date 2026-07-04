import type { APIRoute } from 'astro';
import { sendQuoteNotifications, processDueReminders } from '../../lib/mail';
import { buildScheduledAt } from '../../lib/schedule';
import { publicError, publicJson, rateLimit } from '../../lib/security';
import { addQuote, updateQuote } from '../../lib/store';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`quote:${ip}`, 12, 60_000)) {
    return publicError('Too many requests. Try again shortly.', 429);
  }

  // Fire due reminders opportunistically (non-blocking)
  processDueReminders().catch(() => {});

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  const service = String(body.service || '').trim();
  const size = String(body.size || '').trim();
  const frequency = String(body.frequency || '').trim();
  const preferredDate = String(body.preferredDate || '').trim();
  const preferredSlot = String(body.preferredSlot || '').trim();
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = String(body.phone || '').trim().slice(0, 40);
  const email = String(body.email || '').trim().slice(0, 160);
  const zip = String(body.zip || '').trim().slice(0, 20);
  const notes = String(body.notes || '').trim().slice(0, 1000);
  const locale = String(body.locale || 'en').trim().slice(0, 8);

  if (!service || !size || !frequency || !preferredDate || !preferredSlot || !name || !phone || !email || !zip) {
    return publicError('Missing required fields', 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return publicError('Invalid email', 400);
  }

  const scheduledAt = buildScheduledAt(preferredDate, preferredSlot);
  if (!scheduledAt) {
    return publicError('Invalid or past schedule. Pick a future date and time.', 400);
  }

  let quote;
  try {
    quote = await addQuote({
      service,
      size,
      frequency,
      preferredDate,
      preferredSlot,
      scheduledAt,
      name,
      phone,
      email,
      zip,
      notes: notes || undefined,
      locale,
      userAgent: (request.headers.get('user-agent') || '').slice(0, 240) || undefined,
    });
  } catch {
    console.error('[quote] store failed');
    return publicJson({ ok: true, id: `local_${Date.now()}`, stored: false }, 201);
  }

  let mail = { sent: false as boolean, client: false, admin: false, error: undefined as string | undefined };
  try {
    mail = await sendQuoteNotifications(quote);
    if (mail.client || mail.admin) {
      await updateQuote(quote.id, { confirmationSentAt: new Date().toISOString() });
    }
    if (!mail.sent) {
      console.error('[quote] mail partial/fail', {
        client: mail.client,
        admin: mail.admin,
        error: mail.error,
      });
    }
  } catch {
    console.error('[quote] mail exception');
  }

  return publicJson({
    ok: true,
    id: quote.id,
    stored: true,
    schedule: { date: preferredDate, slot: preferredSlot, at: scheduledAt },
    mail: { sent: mail.sent, client: mail.client, admin: mail.admin },
  }, 201);
};
