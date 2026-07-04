import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { processDueReminders } from '../../../lib/mail';
import { publicError, publicJson, rateLimit } from '../../../lib/security';

export const prerender = false;

/**
 * Process schedule reminders (client + admin).
 * Auth: admin bearer OR x-cron-secret header matching CRON_SECRET / ADMIN_PASSWORD.
 */
export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`reminders:${ip}`, 30, 60_000)) {
    return publicError('Too many requests', 429);
  }

  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD || '';
  const headerSecret = request.headers.get('x-cron-secret') || '';
  const okAdmin = authorized(request);
  const okCron = Boolean(cronSecret) && headerSecret === cronSecret;

  if (!okAdmin && !okCron) {
    return publicError('Unauthorized', 401);
  }

  try {
    const result = await processDueReminders();
    return publicJson({ ok: true, ...result });
  } catch {
    return publicError('Could not process reminders', 500);
  }
};

export const GET: APIRoute = POST;
