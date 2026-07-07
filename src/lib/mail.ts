import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Invoice, Quote } from './store';
import { formatSchedule, REMINDER_WINDOW_MS } from './schedule';

/** Read env at call-time (never bake empty values at build). */
function env(name: string, fallback = '') {
  const raw = process.env[name] ?? fallback;
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

function mailEnv() {
  return {
    user: env('SMTP_USER', 'hello@zavinteriorclean.com'),
    pass: env('SMTP_PASS'),
    host: env('SMTP_HOST', 'smtp.gmail.com'),
    port: Number(env('SMTP_PORT', '587')) || 587,
    admin: env('ADMIN_EMAIL', 'azhaliaestepan@gmail.com'),
    fromName: env('SMTP_FROM_NAME', 'ZAV Interior & Clean'),
    siteUrl: env('PUBLIC_SITE_URL', 'https://zavinteriorclean.com').replace(/\/$/, ''),
    replyTo: env('SMTP_REPLY_TO', 'hello@zavinteriorclean.com'),
    profile: env('SMTP_PROFILE', '').toLowerCase(),
  };
}

/** Resolve SMTP host/port — ZAV uses Google Workspace for @zavinteriorclean.com mailboxes. */
function resolvedSmtp() {
  const m = mailEnv();
  let { host, port, profile, user } = m;

  const zavMailbox = /@zavinteriorclean\.com$/i.test(user);
  const hostingerHost = /hostinger/i.test(host);

  if (profile === 'hostinger') {
    host = 'smtp.hostinger.com';
    port = 465;
  } else if (
    profile === 'google' ||
    profile === 'gmail' ||
    /@(gmail\.com|googlemail\.com)$/i.test(user) ||
    (zavMailbox && hostingerHost)
  ) {
    host = 'smtp.gmail.com';
    port = 587;
  }

  return {
    ...m,
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    provider: port === 587 && /gmail/i.test(host) ? 'google' : hostingerHost ? 'hostinger' : 'smtp',
  };
}

const labels = {
  en: {
    services: {
      home: 'Home cleaning',
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
    clientSubject: 'We confirmed your preferred schedule',
    clientHello: 'Hi',
    clientBody:
      'Thanks for booking a preferred visit window with ZAV Interior & Clean. We received your request and will honor this schedule as closely as possible.',
    clientDetails: 'Your request',
    clientFooter: 'Questions? Reply to this email or WhatsApp us at (717) 415-6171.',
    adminSubject: 'New quote + schedule',
    reminderSubject: 'Reminder: your cleaning visit is coming up',
    reminderBody: 'This is a friendly reminder about your preferred visit window with ZAV Interior & Clean.',
    scheduleLabel: 'Preferred schedule',
    invoiceSubject: 'Your invoice from ZAV Interior & Clean',
    invoiceHello: 'Hi',
    invoiceBody: 'Your invoice is ready. You can review the details below or open the full invoice online.',
    invoiceOpen: 'View invoice',
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
    clientSubject: 'Confirmamos tu horario preferido',
    clientHello: 'Hola',
    clientBody:
      'Gracias por agendar una ventana de visita con ZAV Interior & Clean. Recibimos tu solicitud y respetaremos este horario lo más posible.',
    clientDetails: 'Tu solicitud',
    clientFooter: '¿Preguntas? Responde este correo o escríbenos por WhatsApp al (717) 415-6171.',
    adminSubject: 'Nueva cotización + horario',
    reminderSubject: 'Recordatorio: tu visita de limpieza se acerca',
    reminderBody: 'Este es un recordatorio amable de tu ventana de visita preferida con ZAV Interior & Clean.',
    scheduleLabel: 'Horario preferido',
    invoiceSubject: 'Tu factura de ZAV Interior & Clean',
    invoiceHello: 'Hola',
    invoiceBody: 'Tu factura está lista. Puedes revisar los detalles abajo o abrir la factura completa en línea.',
    invoiceOpen: 'Ver factura',
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
    clientSubject: 'Confirmamos seu horário preferido',
    clientHello: 'Olá',
    clientBody:
      'Obrigado por agendar uma janela de visita com a ZAV Interior & Clean. Recebemos seu pedido e vamos respeitar esse horário o máximo possível.',
    clientDetails: 'Seu pedido',
    clientFooter: 'Dúvidas? Responda este e-mail ou fale no WhatsApp: (717) 415-6171.',
    adminSubject: 'Novo orçamento + horário',
    reminderSubject: 'Lembrete: sua visita de limpeza está chegando',
    reminderBody: 'Este é um lembrete amigável da sua janela de visita preferida com a ZAV Interior & Clean.',
    scheduleLabel: 'Horário preferido',
    invoiceSubject: 'Sua fatura da ZAV Interior & Clean',
    invoiceHello: 'Olá',
    invoiceBody: 'Sua fatura está pronta. Veja os detalhes abaixo ou abra a fatura completa online.',
    invoiceOpen: 'Ver fatura',
  },
} as const;

type LocaleKey = keyof typeof labels;

function t(locale: string) {
  if (locale === 'es' || locale === 'pt') return labels[locale];
  return labels.en;
}

function labelOf(map: Record<string, string>, key: string) {
  return map[key] || key;
}

function mailConfigured() {
  const { pass } = mailEnv();
  if (!pass) return { ok: false as const, reason: 'SMTP_PASS is empty' };
  if (/TU_APP_PASSWORD|YOUR_GOOGLE|changeme|xxx/i.test(pass)) {
    return { ok: false as const, reason: 'SMTP_PASS is still a placeholder' };
  }
  return { ok: true as const };
}

function createTransport() {
  const cfg = mailConfigured();
  if (!cfg.ok) {
    console.warn('[mail]', cfg.reason);
    return null;
  }

  const smtp = resolvedSmtp();
  const options: SMTPTransport.Options = {
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    requireTLS: smtp.requireTLS,
    auth: {
      user: smtp.user,
      pass: smtp.pass,
    },
    tls: { minVersion: 'TLSv1.2' },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  };

  return nodemailer.createTransport(options);
}

function mailStatusForAdmin() {
  const cfg = mailConfigured();
  const smtp = resolvedSmtp();
  return {
    configured: cfg.ok,
    host: smtp.host,
    port: smtp.port,
    user: smtp.user.replace(/(.{2}).+(@.+)/, '$1***$2'),
    provider: smtp.provider,
    reason: cfg.ok ? undefined : 'Mail is not configured on the server.',
  };
}

function detailsHtml(quote: Quote, locale: LocaleKey) {
  const L = t(locale);
  const schedule =
    quote.preferredDate && quote.preferredSlot
      ? formatSchedule(quote.preferredDate, quote.preferredSlot, locale)
      : '—';
  const rows = [
    [L.scheduleLabel, schedule],
    ['Service', labelOf(L.services, quote.service)],
    ['Home size', labelOf(L.sizes, quote.size)],
    ['Frequency', labelOf(L.frequencies, quote.frequency)],
    ['Name', quote.name],
    ['Phone', quote.phone],
    ['Email', quote.email],
    ['ZIP', quote.zip],
    ['Notes', quote.notes || '—'],
  ];

  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6b6560;font-size:13px;border-bottom:1px solid #efe8dc">${k}</td><td style="padding:8px 0;font-size:13px;color:#1a1a1a;border-bottom:1px solid #efe8dc"><strong>${escapeHtml(String(v))}</strong></td></tr>`,
    )
    .join('');
}

function escapeHtml(s: string) {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function money(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
}

/** Branded email shell — logo centered, cream/mustard/navy like the site */
function wrap(title: string, body: string) {
  const siteUrl = mailEnv().siteUrl;
  const logoUrl = `${siteUrl}/logo.png`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f4ef;font-family:'DM Sans',Segoe UI,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(title)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ef;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;border:1px solid #efe8dc;overflow:hidden">
        <tr><td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#fffef9 0%,#ffffff 100%)">
          <img src="${logoUrl}" alt="ZAV Interior & Clean" width="220" style="display:block;margin:0 auto 12px;max-width:220px;width:100%;height:auto;border:0" />
          <p style="margin:0;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#a8841a;font-weight:700">Interior &amp; Clean</p>
        </td></tr>
        <tr><td style="padding:8px 28px 28px">
          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.25;color:#1a1a1a;font-weight:700">${escapeHtml(title)}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #efe8dc;text-align:center">
          <p style="margin:0 0 6px;font-size:12px;color:#6b6560">Homes that feel alive — and stay immaculate.</p>
          <p style="margin:0;font-size:12px;color:#1b3a5c;font-weight:600">
            <a href="tel:+17174156171" style="color:#1b3a5c;text-decoration:none">(717) 415-6171</a>
            &nbsp;·&nbsp;
            <a href="${siteUrl}" style="color:#1b3a5c;text-decoration:none">zavinteriorclean.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function explainSmtpError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Invalid login|BadCredentials|535|Authentication failed/i.test(msg)) {
    return 'SMTP authentication failed. Check SMTP_USER and SMTP_PASS on the server.';
  }
  if (/ECONNECTION|ETIMEDOUT|ENOTFOUND/i.test(msg)) {
    return 'Could not reach SMTP server. Check host/port and outbound firewall.';
  }
  // Never leak stack traces or credentials
  return 'Mail delivery failed.';
}

export function getMailConfigStatus() {
  const cfg = mailConfigured();
  return {
    configured: cfg.ok,
    reason: cfg.ok ? undefined : 'Mail is not configured on the server.',
    ...mailStatusForAdmin(),
  };
}

export async function verifyMailConnection() {
  const status = getMailConfigStatus();
  if (!status.configured) {
    return { ok: false as const, error: status.reason, hint: status.reason };
  }

  const transport = createTransport();
  if (!transport) {
    return { ok: false as const, error: 'Mail is not available.', hint: status.reason };
  }

  try {
    await transport.verify();
    return { ok: true as const, ...mailStatusForAdmin() };
  } catch (err) {
    const hint = explainSmtpError(err);
    console.error('[mail] verify failed:', hint);
    return {
      ok: false as const,
      error: 'Mail notifications need attention.',
      hint,
      ...mailStatusForAdmin(),
    };
  }
}

export async function sendTestMail(to?: string) {
  const m = mailEnv();
  const transport = createTransport();
  const status = getMailConfigStatus();
  if (!transport) {
    return { ok: false as const, error: status.reason || 'not_configured' };
  }

  const dest = to || m.admin;

  try {
    await transport.sendMail({
      from: `"${m.fromName}" <${m.user}>`,
      replyTo: m.replyTo,
      to: dest,
      subject: 'ZAV mail test · OK',
      html: wrap(
        'Mail test OK',
        `<p style="color:#3d3d3d;line-height:1.55">Notification channel is ready.</p>`,
      ),
    });
    return { ok: true as const, to: dest };
  } catch (err) {
    const hint = explainSmtpError(err);
    console.error('[mail] test failed:', hint);
    return { ok: false as const, error: hint };
  }
}

export async function sendQuoteNotifications(quote: Quote) {
  const status = getMailConfigStatus();
  const transport = createTransport();
  const m = mailEnv();
  if (!transport) {
    console.error('[mail] skip quote notify:', status.reason || 'not configured');
    return { sent: false, client: false, admin: false, error: status.reason || 'smtp_not_configured' };
  }

  const locale = (quote.locale === 'es' || quote.locale === 'pt' ? quote.locale : 'en') as LocaleKey;
  const L = t(locale);
  const adminL = labels.en;

  const clientHtml = wrap(
    L.clientSubject,
    `<p style="color:#3d3d3d;line-height:1.55">${L.clientHello} ${escapeHtml(quote.name)},</p>
     <p style="color:#3d3d3d;line-height:1.55">${L.clientBody}</p>
     <p style="margin:18px 0 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a8841a;font-weight:700">${L.clientDetails}</p>
     <table style="border-collapse:collapse;width:100%">${detailsHtml(quote, locale)}</table>
     <p style="margin-top:18px;color:#6b6560;font-size:13px">${L.clientFooter}</p>
     <p style="margin-top:18px;text-align:center">
       <a href="${m.siteUrl}/#quote" style="display:inline-block;background:linear-gradient(135deg,#c9a227,#a8841a);color:#1a1a1a;text-decoration:none;font-weight:700;font-size:13px;padding:12px 20px;border-radius:999px">zavinteriorclean.com</a>
     </p>`,
  );

  const adminHtml = wrap(
    adminL.adminSubject,
    `<p style="color:#3d3d3d;line-height:1.55">New free-estimate request from <strong>${escapeHtml(quote.name)}</strong>.</p>
     <table style="border-collapse:collapse;width:100%">${detailsHtml(quote, 'en')}</table>
     <p style="margin-top:18px">
       <a href="tel:${escapeHtml(quote.phone)}" style="color:#1b3a5c">${escapeHtml(quote.phone)}</a>
       ·
       <a href="mailto:${escapeHtml(quote.email)}" style="color:#1b3a5c">${escapeHtml(quote.email)}</a>
     </p>
     <p style="margin-top:12px;font-size:12px;color:#6b6560">Open the site, type <strong>ZAV</strong> + PIN to manage the inbox.</p>`,
  );

  const from = `"${m.fromName}" <${m.user}>`;

  // Send sequentially — more reliable on shared SMTP than parallel
  let clientOk = false;
  let adminOk = false;
  let error: string | undefined;

  try {
    await transport.sendMail({
      from,
      to: quote.email,
      replyTo: m.replyTo,
      subject: `${L.clientSubject} · ZAV`,
      html: clientHtml,
    });
    clientOk = true;
  } catch (err) {
    error = explainSmtpError(err);
    console.error('[mail] client notify failed:', error);
  }

  try {
    await transport.sendMail({
      from,
      to: m.admin,
      replyTo: quote.email,
      subject: `${adminL.adminSubject}: ${quote.name} · ZAV`,
      html: adminHtml,
    });
    adminOk = true;
  } catch (err) {
    error = explainSmtpError(err);
    console.error('[mail] admin notify failed:', error);
  }

  return {
    sent: clientOk && adminOk,
    client: clientOk,
    admin: adminOk,
    error,
  };
}

export async function sendScheduleReminder(quote: Quote) {
  const transport = createTransport();
  const m = mailEnv();
  if (!transport || !quote.preferredDate || !quote.preferredSlot) {
    return { sent: false, client: false, admin: false, error: 'not_ready' };
  }

  const locale = (quote.locale === 'es' || quote.locale === 'pt' ? quote.locale : 'en') as LocaleKey;
  const L = t(locale);
  const schedule = formatSchedule(quote.preferredDate, quote.preferredSlot, locale);

  const clientHtml = wrap(
    L.reminderSubject,
    `<p style="color:#3d3d3d;line-height:1.55">${L.clientHello} ${escapeHtml(quote.name)},</p>
     <p style="color:#3d3d3d;line-height:1.55">${L.reminderBody}</p>
     <p style="margin:16px 0;padding:12px 14px;border-radius:12px;background:#faf7f1;border:1px solid #efe8dc;font-weight:700;color:#1b3a5c">${escapeHtml(schedule)}</p>
     <table style="border-collapse:collapse;width:100%">${detailsHtml(quote, locale)}</table>
     <p style="margin-top:18px;color:#6b6560;font-size:13px">${L.clientFooter}</p>`,
  );

  const adminHtml = wrap(
    `Reminder · ${quote.name}`,
    `<p style="color:#3d3d3d;line-height:1.55">Upcoming preferred visit for <strong>${escapeHtml(quote.name)}</strong>.</p>
     <p style="margin:16px 0;padding:12px 14px;border-radius:12px;background:#faf7f1;border:1px solid #efe8dc;font-weight:700;color:#1b3a5c">${escapeHtml(schedule)}</p>
     <table style="border-collapse:collapse;width:100%">${detailsHtml(quote, 'en')}</table>`,
  );

  const from = `"${m.fromName}" <${m.user}>`;
  let clientOk = false;
  let adminOk = false;

  try {
    await transport.sendMail({
      from,
      to: quote.email,
      replyTo: m.replyTo,
      subject: `${L.reminderSubject} · ZAV`,
      html: clientHtml,
    });
    clientOk = true;
  } catch (err) {
    console.error('[mail] reminder client failed:', explainSmtpError(err));
  }

  try {
    await transport.sendMail({
      from,
      to: m.admin,
      replyTo: quote.email,
      subject: `Reminder: ${quote.name} · ${schedule}`,
      html: adminHtml,
    });
    adminOk = true;
  } catch (err) {
    console.error('[mail] reminder admin failed:', explainSmtpError(err));
  }

  return { sent: clientOk && adminOk, client: clientOk, admin: adminOk };
}

/** Send reminders for visits within the next 24 hours (once per quote). */
export async function processDueReminders() {
  const { getQuotes, updateQuote } = await import('./store');
  const quotes = await getQuotes();
  const now = Date.now();
  let sent = 0;

  for (const quote of quotes) {
    if (!quote.scheduledAt || quote.reminderSentAt) continue;
    if (quote.status === 'done') continue;
    const when = new Date(quote.scheduledAt).getTime();
    if (!Number.isFinite(when)) continue;
    // Between now and +24h
    if (when < now || when > now + REMINDER_WINDOW_MS) continue;

    const result = await sendScheduleReminder(quote);
    if (result.client || result.admin) {
      await updateQuote(quote.id, { reminderSentAt: new Date().toISOString() });
      sent += 1;
    }
  }

  return { checked: quotes.length, sent };
}

export async function sendInvoiceToClient(invoice: Invoice, locale = 'en') {
  const transport = createTransport();
  const m = mailEnv();
  if (!transport) {
    return { ok: false as const, error: 'smtp_not_configured' };
  }

  const L = t(locale);
  const invoiceUrl = `${m.siteUrl}/invoice/${invoice.id}?t=${encodeURIComponent(invoice.accessToken || '')}`;

  const recurringNote = invoice.recurring
    ? `<p style="margin:12px 0;padding:10px 12px;border-radius:12px;background:#faf7f1;border:1px solid #efe8dc;font-size:13px;color:#3d3d3d">
         Recurring <strong>${escapeHtml(invoice.frequency)}</strong> · Cycle #${invoice.cycle}<br/>
         Period: ${escapeHtml(new Date(invoice.periodStart).toLocaleDateString())} — ${escapeHtml(new Date(invoice.periodEnd).toLocaleDateString())}
       </p>`
    : '';

  const html = wrap(
    L.invoiceSubject,
    `<p style="color:#3d3d3d;line-height:1.55">${L.invoiceHello} ${escapeHtml(invoice.clientName)},</p>
     <p style="color:#3d3d3d;line-height:1.55">${L.invoiceBody}</p>
     ${recurringNote}
     <table style="border-collapse:collapse;width:100%;margin:16px 0">
       <tr><td style="padding:8px 0;color:#6b6560;font-size:13px">Invoice</td><td style="padding:8px 0;font-weight:700">${escapeHtml(invoice.number)}</td></tr>
       <tr><td style="padding:8px 0;color:#6b6560;font-size:13px">Service</td><td style="padding:8px 0;font-weight:700">${escapeHtml(invoice.description)}</td></tr>
       <tr><td style="padding:8px 0;color:#6b6560;font-size:13px">Total</td><td style="padding:8px 0;font-weight:800;color:#1b3a5c;font-size:18px">${escapeHtml(money(invoice.total, invoice.currency))}</td></tr>
     </table>
     <p style="text-align:center;margin:22px 0 8px">
       <a href="${invoiceUrl}" style="display:inline-block;background:linear-gradient(135deg,#c9a227,#a8841a);color:#1a1a1a;text-decoration:none;font-weight:700;font-size:13px;padding:12px 22px;border-radius:999px">${escapeHtml(L.invoiceOpen)}</a>
     </p>`,
  );

  try {
    await transport.sendMail({
      from: `"${m.fromName}" <${m.user}>`,
      replyTo: m.replyTo,
      to: invoice.clientEmail,
      bcc: m.admin,
      subject: `${L.invoiceSubject} · ${invoice.number}`,
      html,
    });
    return { ok: true as const };
  } catch (err) {
    console.error('[mail] invoice notify failed:', explainSmtpError(err));
    return { ok: false as const, error: explainSmtpError(err) };
  }
}
