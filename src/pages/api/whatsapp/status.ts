import type { APIRoute } from 'astro';
import { authorized } from '../../../lib/auth';
import { publicError, publicJson } from '../../../lib/security';
import { getWhatsAppConfigStatus, whatsappConfigured } from '../../../lib/whatsapp';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  const status = await getWhatsAppConfigStatus();
  return publicJson({
    ...status,
    ready: whatsappConfigured(),
  });
};
