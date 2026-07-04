import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { processDueReminders } from '../../lib/mail';
import { publicError, publicJson } from '../../lib/security';
import { getDashboard } from '../../lib/store';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  processDueReminders().catch(() => {});

  const dashboard = await getDashboard();
  return publicJson(dashboard);
};
