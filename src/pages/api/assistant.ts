import type { APIRoute } from 'astro';
import { authorized } from '../../lib/auth';
import { assistantCapabilities, runAssistantChat, type AssistantMessage } from '../../lib/assistant';
import { isGeminiConfigured } from '../../lib/gemini';
import { publicError, publicJson, rateLimit } from '../../lib/security';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);
  return publicJson({
    ok: true,
    ...assistantCapabilities(),
  });
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!authorized(request)) return publicError('Unauthorized', 401);

  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`assistant:${ip}`, 20, 60_000)) {
    return publicError('Too many requests. Try again shortly.', 429);
  }

  if (!isGeminiConfigured()) {
    return publicError('AI assistant is not configured (GEMINI_API_KEY missing).', 503);
  }

  let body: { message?: string; history?: AssistantMessage[] };
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  const message = String(body.message || '').trim().slice(0, 4000);
  if (!message) return publicError('Message required', 400);

  const history = Array.isArray(body.history)
    ? body.history
        .slice(-12)
        .filter((h) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string')
        .map((h) => ({ role: h.role, text: String(h.text).slice(0, 4000) }))
    : [];

  const result = await runAssistantChat(history, message);
  if (!result.ok) {
    return publicJson({
      ok: false,
      error: result.error,
      reply: result.reply || 'Sorry, I could not complete that request.',
      actions: result.actions,
    }, 502);
  }

  return publicJson({
    ok: true,
    reply: result.reply,
    actions: result.actions,
  });
};
