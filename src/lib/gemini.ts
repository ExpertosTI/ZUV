const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];

function apiKey() {
  return process.env.GEMINI_API_KEY?.trim() || '';
}

export function isGeminiConfigured() {
  return Boolean(apiKey());
}

export function geminiModelName() {
  return process.env.GEMINI_MODEL?.trim() || MODEL_FALLBACKS[0];
}

function modelCandidates() {
  const preferred = geminiModelName();
  return [preferred, ...MODEL_FALLBACKS.filter((m) => m !== preferred)];
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: Record<string, unknown> };
};
type GeminiContent = { role: string; parts: GeminiPart[] };

type ToolDeclaration = {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
};

type GenerateOpts = {
  systemInstruction?: string;
  tools?: ToolDeclaration[];
  temperature?: number;
};

function extractParts(payload: {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
}) {
  return payload.candidates?.[0]?.content?.parts || [];
}

async function callGenerate(
  model: string,
  contents: GeminiContent[],
  opts: GenerateOpts = {},
) {
  const key = apiKey();
  if (!key) return { ok: false as const, status: 401, error: 'gemini_not_configured' };

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature: opts.temperature ?? 0.4 },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }
  if (opts.tools?.length) {
    body.tools = [{ functionDeclarations: opts.tools }];
  }

  const res = await fetch(`${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let payload: { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> };
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false as const, status: res.status, error: `gemini_parse_error:${raw.slice(0, 120)}` };
  }

  if (!res.ok) {
    return { ok: false as const, status: res.status, error: `gemini_http_${res.status}:${raw.slice(0, 200)}` };
  }

  const parts = extractParts(payload);
  const fn = parts.find((p) => p.functionCall)?.functionCall;
  const text = parts.map((p) => p.text || '').join('').trim();
  return { ok: true as const, parts, text, functionCall: fn };
}

export async function generateWithTools(
  contents: GeminiContent[],
  opts: GenerateOpts = {},
) {
  let last = { ok: false as const, status: 500, error: 'gemini_failed' };
  for (const model of modelCandidates()) {
    const result = await callGenerate(model, contents, opts);
    if (result.ok) return result;
    last = result;
    if (result.status === 404 || result.status === 400) continue;
    break;
  }
  return last;
}

export async function generateGeminiText(prompt: string, system?: string) {
  const result = await generateWithTools(
    [{ role: 'user', parts: [{ text: prompt }] }],
    { systemInstruction: system, temperature: 0.3 },
  );
  if (!result.ok) return result;
  if (!result.text) return { ok: false as const, status: 200, error: 'gemini_empty_response' };
  return { ok: true as const, text: result.text };
}

export type ChatTurn = { role: 'user' | 'model'; text: string };

export function turnsToContents(turns: ChatTurn[]): GeminiContent[] {
  return turns.map((t) => ({
    role: t.role === 'model' ? 'model' : 'user',
    parts: [{ text: t.text }],
  }));
}
