import type { APIRoute } from 'astro';
import { authorized } from '../../../../lib/auth';
import { publicError, publicJson } from '../../../../lib/security';
import { logoutEvolutionInstance, whatsappConfigured } from '../../../../lib/whatsapp';

export const prerender = false;

export const DELETE: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, error: 'not_configured' }, 503);
  }

  const result = await logoutEvolutionInstance();
  return publicJson({
    ok: result.ok,
    success: result.ok,
    error: result.error,
    instanceName: result.instanceName,
  }, result.ok ? 200 : 400);
};
