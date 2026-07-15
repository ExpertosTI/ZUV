import type { APIRoute } from 'astro';
import { authorized } from '../../../../lib/auth';
import { publicError, publicJson } from '../../../../lib/security';
import { refreshEvolutionConnection, whatsappConfigured } from '../../../../lib/whatsapp';

export const prerender = false;

/** Poll until state === "open" after scanning QR. */
export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, state: 'error', error: 'not_configured' }, 503);
  }

  const result = await refreshEvolutionConnection();
  return publicJson({
    ok: result.ok,
    success: result.ok,
    instanceName: result.instanceName,
    state: result.state,
    phone: result.phone || null,
    error: result.error,
  });
};
