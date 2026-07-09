import { generateWithTools, type ChatTurn, turnsToContents } from './gemini';
import { getDashboard } from './store';
import { adminWhatsAppNumber, getWhatsAppConfigStatus, sendAdminWhatsApp } from './whatsapp';

const SYSTEM = `You are ZAV Admin Assistant — an operations copilot for ZAV Interior & Clean (Pennsylvania, US).
You have real tools to read the business dashboard and send WhatsApp messages to the ZAV admin.

Rules:
- Answer in the same language the user writes (English, Spanish, or Portuguese).
- When asked for reports, summaries, or to notify via WhatsApp, use send_whatsapp with a clear formatted message.
- Only send WhatsApp when the user explicitly wants a notification or report delivered to their phone.
- Keep WhatsApp messages concise, use bullet lines and emojis sparingly for scanability.
- Never invent quote data — always use get_dashboard or list_quotes first.
- Admin WhatsApp is the business line; you cannot message clients directly from here.`;

const TOOLS = [
  {
    name: 'get_dashboard',
    description: 'KPIs: visits, leads, conversion, inbox counts, invoices, trends.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'list_quotes',
    description: 'Recent quote / estimate requests.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['new', 'viewed', 'done', 'all'], description: 'Filter by status' },
        limit: { type: 'number', description: 'Max rows (default 10)' },
      },
    },
  },
  {
    name: 'send_whatsapp',
    description: 'Send a WhatsApp message to the ZAV admin with a report or details.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Full message body to send' },
      },
      required: ['message'],
    },
  },
];

async function runTool(name: string, args: Record<string, unknown> = {}) {
  if (name === 'get_dashboard') {
    const d = await getDashboard();
    return {
      kpis: d.kpis,
      breakdown: d.breakdown,
      trend: d.trend,
      generatedAt: d.generatedAt,
    };
  }

  if (name === 'list_quotes') {
    const d = await getDashboard();
    const status = String(args.status || 'all');
    const limit = Math.min(50, Math.max(1, Number(args.limit) || 10));
    let rows = d.quotes;
    if (status !== 'all') {
      rows = rows.filter((q) => (q.status || 'new') === status);
    }
    return rows.slice(0, limit).map((q) => ({
      id: q.id,
      createdAt: q.createdAt,
      name: q.name,
      phone: q.phone,
      email: q.email,
      service: q.service,
      size: q.size,
      frequency: q.frequency,
      preferredDate: q.preferredDate,
      preferredSlot: q.preferredSlot,
      status: q.status || 'new',
      locale: q.locale,
      notes: q.notes,
    }));
  }

  if (name === 'send_whatsapp') {
    const message = String(args.message || '').trim().slice(0, 3500);
    if (!message) return { ok: false, error: 'empty_message' };
    const wa = getWhatsAppConfigStatus();
    if (!wa.configured) return { ok: false, error: 'whatsapp_not_configured' };
    const r = await sendAdminWhatsApp(message);
    return {
      ok: r.ok,
      to: adminWhatsAppNumber().replace(/\d(?=\d{4})/g, '*'),
      error: r.ok ? undefined : r.error,
    };
  }

  return { error: 'unknown_tool' };
}

export type AssistantMessage = ChatTurn;

export type AssistantAction = {
  tool: string;
  result: unknown;
};

export async function runAssistantChat(history: AssistantMessage[], userMessage: string) {
  const turns: ChatTurn[] = [...history, { role: 'user', text: userMessage }];
  const actions: AssistantAction[] = [];
  const contents = turnsToContents(turns);

  for (let i = 0; i < 6; i++) {
    const result = await generateWithTools(contents, {
      systemInstruction: SYSTEM,
      tools: TOOLS,
      temperature: 0.35,
    });

    if (!result.ok) {
      return {
        ok: false as const,
        error: result.error,
        reply: '',
        actions,
      };
    }

    if (result.functionCall?.name) {
      const toolResult = await runTool(result.functionCall.name, result.functionCall.args || {});
      actions.push({ tool: result.functionCall.name, result: toolResult });

      contents.push({
        role: 'model',
        parts: [{ functionCall: result.functionCall }],
      });
      contents.push({
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: result.functionCall.name,
              response: toolResult as Record<string, unknown>,
            },
          },
        ],
      });
      continue;
    }

    const reply = result.text || '';
    return { ok: true as const, reply, actions };
  }

  return {
    ok: false as const,
    error: 'tool_loop_limit',
    reply: '',
    actions,
  };
}

export function assistantCapabilities() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    whatsapp: getWhatsAppConfigStatus(),
    tools: TOOLS.map((t) => t.name),
  };
}
