import type { APIRoute } from 'astro';
import { authorized } from '../../../../lib/auth';
import { publicError, publicJson } from '../../../../lib/security';
import {
  deleteEvolutionInstance,
  startWhatsAppSession,
  whatsappConfigured,
} from '../../../../lib/whatsapp';

export const prerender = false;

/** Create instance if needed and return Evolution QR. */
export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, error: 'EVOLUTION_API_URL / EVOLUTION_API_KEY not set' }, 503);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    /* empty body ok */
  }

  const requested = String(body.instanceName || '').trim();
  const started = await startWhatsAppSession(requested || undefined);

  if (started.ok && started.qrcode) {
    return publicJson({
      ok: true,
      success: true,
      instanceName: started.instanceName,
      qrcode: started.qrcode,
    });
  }

  return publicJson(
    {
      ok: false,
      success: false,
      instanceName: started.instanceName,
      error: started.error || 'Failed to create instance / get QR',
    },
    400,
  );
};

/** Delete Evolution instance entirely. */
export const DELETE: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  if (!whatsappConfigured()) {
    return publicJson({ ok: false, error: 'not_configured' }, 503);
  }

  const result = await deleteEvolutionInstance();
  return publicJson({
    ok: result.ok,
    success: result.ok,
    error: result.error,
    instanceName: result.instanceName,
  }, result.ok ? 200 : 400);
};
