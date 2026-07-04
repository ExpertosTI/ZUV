import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import type { Quote } from './store';

function env(name: string, fallback = '') {
  const raw = process.env[name] ?? fallback;
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

const SMTP_USER = env('SMTP_USER', 'hello@zavinteriorclean.com');
const SMTP_PASS = env('SMTP_PASS');
const SMTP_HOST = env('SMTP_HOST', 'smtp.gmail.com');
const SMTP_PORT = Number(env('SMTP_PORT', '587')) || 587;
const ADMIN_EMAIL = env('ADMIN_EMAIL', 'azhaliaestepan@gmail.com');
const FROM_NAME = env('SMTP_FROM_NAME', 'ZAV Interior & Clean');

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
    clientSubject: 'We received your free estimate request',
    clientHello: 'Hi',
    clientBody:
      'Thanks for requesting a free estimate with ZAV Interior & Clean. We will contact you shortly.',
    clientDetails: 'Your request',
    clientFooter: 'Questions? Reply to this email or WhatsApp us at (717) 415-6171.',
    adminSubject: 'New quote request',
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
    clientSubject: 'Recibimos tu solicitud de cotización gratis',
    clientHello: 'Hola',
    clientBody:
      'Gracias por solicitar una cotización gratis con ZAV Interior & Clean. Te contactaremos pronto.',
    clientDetails: 'Tu solicitud',
    clientFooter: '¿Preguntas? Responde este correo o escríbenos por WhatsApp al (717) 415-6171.',
    adminSubject: 'Nueva cotización',
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
    clientSubject: 'Recebemos seu pedido de orçamento grátis',
    clientHello: 'Olá',
    clientBody:
      'Obrigado por solicitar um orçamento grátis com a ZAV Interior & Clean. Entraremos em contato em breve.',
    clientDetails: 'Seu pedido',
    clientFooter: 'Dúvidas? Responda este e-mail ou fale no WhatsApp: (717) 415-6171.',
    adminSubject: 'Novo orçamento',
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
  if (!SMTP_PASS) return { ok: false as const, reason: 'SMTP_PASS is empty' };
  if (/TU_APP_PASSWORD|YOUR_GOOGLE|changeme|xxx/i.test(SMTP_PASS)) {
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

  const options: SMTPTransport.Options = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    requireTLS: SMTP_PORT === 587,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  };

  return nodemailer.createTransport(options);
}

function detailsHtml(quote: Quote, locale: LocaleKey) {
  const L = t(locale);
  const rows = [
    ['Service', labelOf(L.services, quote.service)],
    ['Home size', labelOf(L.sizes, quote.size)],
    ['Frequency', labelOf(L.frequencies, quote.frequency)],
    ['Name', quote.name],
    ['Phone', quote.phone],
    ['Email', quote.email],
    ['ZIP', quote.zip],
    ['Notes', quote.notes || '—'],
    ['Locale', quote.locale],
    ['ID', quote.id],
    ['When', new Date(quote.createdAt).toLocaleString('en-US')],
  ];

  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b6560;font-size:13px">${k}</td><td style="padding:6px 0;font-size:13px;color:#1a1a1a"><strong>${escapeHtml(String(v))}</strong></td></tr>`,
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

function wrap(title: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f4ef;font-family:DM Sans,Segoe UI,sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #efe8dc">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#a8841a;font-weight:700">ZAV Interior & Clean</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#1a1a1a">${title}</h1>
    ${body}
    <p style="margin:24px 0 0;font-size:12px;color:#6b6560">hello@zavinteriorclean.com · (717) 415-6171</p>
  </div>
</body></html>`;
}

function explainSmtpError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  if (/Invalid login|BadCredentials|535/i.test(msg)) {
    return 'Google rejected the password. Use a Google App Password (not the account password) for hello@zavinteriorclean.com.';
  }
  if (/ECONNECTION|ETIMEDOUT|ENOTFOUND/i.test(msg)) {
    return 'Could not reach SMTP server. Check outbound port 587/465 on the VPS.';
  }
  return msg;
}

export function getMailConfigStatus() {
  const cfg = mailConfigured();
  return {
    configured: cfg.ok,
    reason: cfg.ok ? undefined : cfg.reason,
    user: SMTP_USER,
    host: SMTP_HOST,
    port: SMTP_PORT,
    admin: ADMIN_EMAIL,
    fromName: FROM_NAME,
  };
}

export async function verifyMailConnection() {
  const status = getMailConfigStatus();
  if (!status.configured) {
    return { ok: false as const, ...status, error: status.reason };
  }

  const transport = createTransport();
  if (!transport) {
    return { ok: false as const, ...status, error: 'transport_failed' };
  }

  try {
    await transport.verify();
    return { ok: true as const, ...status };
  } catch (err) {
    const error = explainSmtpError(err);
    console.error('[mail] verify failed:', error);
    return { ok: false as const, ...status, error };
  }
}

export async function sendTestMail(to = ADMIN_EMAIL) {
  const transport = createTransport();
  const status = getMailConfigStatus();
  if (!transport) {
    return { ok: false as const, error: status.reason || 'not_configured' };
  }

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${SMTP_USER}>`,
      to,
      subject: 'ZAV mail test · OK',
      text: `Mail transport works.\nFrom: ${SMTP_USER}\nTo: ${to}\nHost: ${SMTP_HOST}:${SMTP_PORT}\nTime: ${new Date().toISOString()}`,
      html: wrap(
        'Mail test OK',
        `<p style="color:#3d3d3d">SMTP is working for <strong>${escapeHtml(SMTP_USER)}</strong>.</p>
         <p class="muted">Sent to ${escapeHtml(to)} at ${escapeHtml(new Date().toLocaleString())}.</p>`,
      ),
    });
    return { ok: true as const, to };
  } catch (err) {
    const error = explainSmtpError(err);
    console.error('[mail] test failed:', error);
    return { ok: false as const, error };
  }
}

export async function sendQuoteNotifications(quote: Quote) {
  const status = getMailConfigStatus();
  const transport = createTransport();
  if (!transport) {
    return { sent: false, client: false, admin: false, error: status.reason || 'smtp_not_configured' };
  }

  const locale = (quote.locale === 'es' || quote.locale === 'pt' ? quote.locale : 'en') as LocaleKey;
  const L = t(locale);
  const adminL = labels.en;

  const clientHtml = wrap(
    L.clientSubject,
    `<p style="color:#3d3d3d;line-height:1.55">${L.clientHello} ${escapeHtml(quote.name)},</p>
     <p style="color:#3d3d3d;line-height:1.55">${L.clientBody}</p>
     <p style="margin:18px 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#a8841a;font-weight:700">${L.clientDetails}</p>
     <table style="border-collapse:collapse">${detailsHtml(quote, locale)}</table>
     <p style="margin-top:18px;color:#6b6560;font-size:13px">${L.clientFooter}</p>`,
  );

  const adminHtml = wrap(
    adminL.adminSubject,
    `<p style="color:#3d3d3d;line-height:1.55">New free-estimate request from <strong>${escapeHtml(quote.name)}</strong>.</p>
     <table style="border-collapse:collapse">${detailsHtml(quote, 'en')}</table>
     <p style="margin-top:18px"><a href="tel:${escapeHtml(quote.phone)}" style="color:#1b3a5c">${escapeHtml(quote.phone)}</a> · <a href="mailto:${escapeHtml(quote.email)}" style="color:#1b3a5c">${escapeHtml(quote.email)}</a></p>`,
  );

  const from = `"${FROM_NAME}" <${SMTP_USER}>`;

  const results = await Promise.allSettled([
    transport.sendMail({
      from,
      to: quote.email,
      replyTo: SMTP_USER,
      subject: `${L.clientSubject} · ZAV`,
      html: clientHtml,
    }),
    transport.sendMail({
      from,
      to: ADMIN_EMAIL,
      replyTo: quote.email,
      subject: `${adminL.adminSubject}: ${quote.name} · ZAV`,
      html: adminHtml,
    }),
  ]);

  const errors: string[] = [];
  for (const r of results) {
    if (r.status === 'rejected') {
      const error = explainSmtpError(r.reason);
      errors.push(error);
      console.error('[mail]', error);
    }
  }

  return {
    sent: errors.length === 0,
    client: results[0].status === 'fulfilled',
    admin: results[1].status === 'fulfilled',
    error: errors[0],
  };
}
