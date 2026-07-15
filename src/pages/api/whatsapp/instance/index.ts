import type { APIRoute } from 'astro';
import { authorized } from '../../../../lib/auth';
import { publicError, publicJson } from '../../../../lib/security';
import {
  createEvolutionInstance,
  deleteEvolutionInstance,
  getEvolutionQr,
  whatsappConfigured,
} from '../../../../lib/whatsapp';

export const prerender = false;

/** Create (or recreate) Evolution instance and return QR when available. */
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
  const created = await createEvolutionInstance(requested || undefined);

  if (created.ok && created.qrcode) {
    return publicJson({
      ok: true,
      success: true,
      instanceName: created.instanceName,
      qrcode: created.qrcode,
    });
  }

  // Already exists or create without QR → fetch connect QR
  if (created.alreadyExists || !created.qrcode) {
    const qr = await getEvolutionQr(created.instanceName);
    if (qr.qrcode) {
      return publicJson({
        ok: true,
        success: true,
        instanceName: created.instanceName,
        qrcode: qr.qrcode,
        reused: Boolean(created.alreadyExists),
      });
    }
  }

  return publicJson(
    {
      ok: false,
      success: false,
      instanceName: created.instanceName,
      error: created.error || 'Failed to create instance',
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
