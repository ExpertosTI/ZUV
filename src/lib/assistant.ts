import { generateWithTools, type ChatTurn, turnsToContents } from './gemini';
import { getDashboard } from './store';
import { adminWhatsAppNumber, getWhatsAppConfigStatus, sendAdminWhatsApp } from './whatsapp';

const SYSTEM = `You are ZAV Admin Assistant for ZAV Interior & Clean (Orlando, FL).
You can read the dashboard and send WhatsApp to the admin line.

Rules:
- Answer in the same language the user writes (English, Spanish, or Portuguese).
- Use tools for live data; do not invent quotes or numbers.
- Only send WhatsApp when the user asks to notify or deliver a report.
- Keep WhatsApp messages short and clear.
- You cannot message clients from this assistant.`;

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
    const wa = await getWhatsAppConfigStatus();
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

export async function assistantCapabilities() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    whatsapp: await getWhatsAppConfigStatus(),
    tools: TOOLS.map((t) => t.name),
  };
}
