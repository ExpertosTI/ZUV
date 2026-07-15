import type { APIRoute } from 'astro';
import { authorized } from '../../../../lib/auth';
import { publicError, publicJson } from '../../../../lib/security';
import { getEvolutionQr, whatsappConfigured } from '../../../../lib/whatsapp';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, error: 'not_configured' }, 503);
  }

  const result = await getEvolutionQr();
  if (!result.qrcode) {
    return publicJson(
      { ok: false, success: false, instanceName: result.instanceName, error: result.error || 'No QR available' },
      400,
    );
  }

  return publicJson({
    ok: true,
    success: true,
    instanceName: result.instanceName,
    qrcode: result.qrcode,
  });
};
