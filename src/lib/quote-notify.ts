import type { Quote } from './store';
import { formatSchedule } from './schedule';
import { PHONE_DISPLAY } from './contact';
import {
  adminWhatsAppNumber,
  queueGapMs,
  sendAdminWhatsApp,
  sendWhatsAppMessage,
  sleep,
} from './whatsapp';

const labels = {
  en: {
    services: {
      home: 'House cleaning',
      deep: 'Deep cleaning',
      move: 'Move-in / move-out',
      interior: 'Interior refresh',
    },
    sizes: {
      studio: 'Studio / 1 bed',
      small: '2 bedrooms',
      medium: '3 bedrooms',
      large: '4+ bedrooms',
    },
    frequencies: {
      once: 'One-time',
      biweekly: 'Every 2 weeks',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    clientTitle: 'ZAV Interior & Clean',
    clientHello: 'Hi',
    clientBody:
      'We got your estimate request. We will reach out soon to confirm timing.',
    clientFooter: `Questions? Call or WhatsApp ${PHONE_DISPLAY}.`,
    adminTitle: 'New quote · ZAV',
    adminLead: 'New estimate request — contact the client to finalize.',
    scheduleLabel: 'Preferred schedule',
  },
  es: {
    services: {
      home: 'Limpieza del hogar',
      deep: 'Limpieza profunda',
      move: 'Mudanza (entrada / salida)',
      interior: 'Refresco de interiores',
    },
    sizes: {
      studio: 'Estudio / 1 habitación',
      small: '2 habitaciones',
      medium: '3 habitaciones',
      large: '4+ habitaciones',
    },
    frequencies: {
      once: 'Una vez',
      biweekly: 'Cada 2 semanas',
      weekly: 'Semanal',
      monthly: 'Mensual',
    },
    clientTitle: 'ZAV Interior & Clean',
    clientHello: 'Hola',
    clientBody:
      'Recibimos tu cotización. Te escribimos pronto para confirmar el horario.',
    clientFooter: `¿Preguntas? Llama o WhatsApp al ${PHONE_DISPLAY}.`,
    adminTitle: 'Nueva cotización · ZAV',
    adminLead: 'Nueva solicitud — contacta al cliente para confirmar.',
    scheduleLabel: 'Horario preferido',
  },
  pt: {
    services: {
      home: 'Limpeza residencial',
      deep: 'Limpeza profunda',
      move: 'Mudança (entrada / saída)',
      interior: 'Refresh de interiores',
    },
    sizes: {
      studio: 'Studio / 1 quarto',
      small: '2 quartos',
      medium: '3 quartos',
      large: '4+ quartos',
    },
    frequencies: {
      once: 'Uma vez',
      biweekly: 'A cada 2 semanas',
      weekly: 'Semanal',
      monthly: 'Mensal',
    },
    clientTitle: 'ZAV Interior & Clean',
    clientHello: 'Olá',
    clientBody:
      'Recebemos seu pedido. Entramos em contato em breve para confirmar o horário.',
    clientFooter: `Dúvidas? Ligue ou WhatsApp: ${PHONE_DISPLAY}.`,
    adminTitle: 'Novo orçamento · ZAV',
    adminLead: 'Nova solicitação — fale com o cliente para confirmar.',
    scheduleLabel: 'Horário preferido',
  },
} as const;

type LocaleKey = keyof typeof labels;

function L(locale: string) {
  if (locale === 'es' || locale === 'pt') return labels[locale];
  return labels.en;
}

function pick(map: Record<string, string>, key: string) {
  return map[key] || key;
}

function quoteLines(quote: Quote, locale: LocaleKey) {
  const t = L(locale);
  const schedule =
    quote.preferredDate && quote.preferredSlot
      ? formatSchedule(quote.preferredDate, quote.preferredSlot, locale)
      : '—';
  return [
    `${t.scheduleLabel}: ${schedule}`,
    `Service: ${pick(t.services, quote.service)}`,
    `Home: ${pick(t.sizes, quote.size)}`,
    `Frequency: ${pick(t.frequencies, quote.frequency)}`,
    `Name: ${quote.name}`,
    `Phone: ${quote.phone}`,
    `Email: ${quote.email}`,
    `ZIP: ${quote.zip}`,
    quote.notes ? `Notes: ${quote.notes}` : null,
  ].filter(Boolean) as string[];
}

export function buildClientWhatsAppMessage(quote: Quote) {
  const locale = (quote.locale === 'es' || quote.locale === 'pt' ? quote.locale : 'en') as LocaleKey;
  const t = L(locale);
  const lines = quoteLines(quote, locale);
  return [
    t.clientTitle,
    '',
    `${t.clientHello} ${quote.name},`,
    '',
    t.clientBody,
    '',
    ...lines,
    '',
    t.clientFooter,
  ].join('\n');
}

export function buildAdminWhatsAppMessage(quote: Quote) {
  const t = labels.en;
  const lines = quoteLines(quote, 'en');
  return [
    t.adminTitle,
    '',
    t.adminLead,
    '',
    `Client: ${quote.phone}`,
    `Email: ${quote.email}`,
    '',
    ...lines,
    '',
    `Reply on WhatsApp: wa.me/${quote.phone.replace(/\D/g, '').replace(/^1?/, '1')}`,
  ].join('\n');
}

export async function sendQuoteWhatsAppNotifications(quote: Quote) {
  const adminTo = adminWhatsAppNumber();
  let clientOk = false;
  let adminOk = false;
  let error: string | undefined;

  try {
    const r = await sendWhatsAppMessage(quote.phone, buildClientWhatsAppMessage(quote));
    clientOk = r.ok;
    if (!r.ok) error = r.error;
  } catch (err) {
    error = err instanceof Error ? err.message : 'client_wa_failed';
    console.error('[whatsapp] client quote notify failed:', error);
  }

  // Queue gap: avoid rapid back-to-back sends from the same number
  await sleep(queueGapMs());

  try {
    const r = await sendAdminWhatsApp(buildAdminWhatsAppMessage(quote));
    adminOk = r.ok;
    if (!r.ok && !error) error = r.error;
  } catch (err) {
    error = err instanceof Error ? err.message : 'admin_wa_failed';
    console.error('[whatsapp] admin quote notify failed:', error);
  }

  if (!adminTo) {
    return { client: clientOk, admin: false, sent: clientOk, error: error || 'no_admin_whatsapp' };
  }

  return {
    client: clientOk,
    admin: adminOk,
    sent: clientOk && adminOk,
    error,
  };
}
