import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { publicError, publicJson } from '../../../lib/security';

export const prerender = false;

/** Kept for compatibility — does not expose infrastructure details. */
export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  return publicJson({ ok: true });
};
