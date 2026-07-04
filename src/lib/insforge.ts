/**
 * Insforge client (PostgREST-compatible), same pattern as Moonshadows Sentinel.
 * Endpoint: https://insforge.renace.tech
 */

const ENDPOINT = (process.env.INSFORGE_URL || 'https://insforge.renace.tech').replace(/\/$/, '');
const ANON_KEY =
  process.env.INSFORGE_ANON_KEY ||
  'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24ifQ.YTrshWNWGSWsmc6DUhitFQSXDICh9BTIiz4CK0GX0Cw';
const SERVICE_KEY = process.env.INSFORGE_SERVICE_KEY || ANON_KEY;

export function insforgeEnabled() {
  return Boolean(ENDPOINT && ANON_KEY);
}

function isLegacyPostgrest() {
  return /\/rest\/v1$/i.test(ENDPOINT);
}

function tablePath(table: string) {
  return isLegacyPostgrest() ? `/${table}` : `/api/database/records/${table}`;
}

function buildUrl(table: string, qs = '') {
  const q = qs && !qs.startsWith('?') ? `?${qs}` : qs;
  return `${ENDPOINT}${tablePath(table)}${q}`;
}

function headers(prefer = 'return=representation') {
  return {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    Prefer: prefer,
  };
}

export type InsforgeStatus = {
  enabled: boolean;
  connected: boolean;
  endpoint: string;
  error?: string;
  checkedAt: string;
};

export async function probeInsforge(): Promise<InsforgeStatus> {
  const checkedAt = new Date().toISOString();
  if (!insforgeEnabled()) {
    return {
      enabled: false,
      connected: false,
      endpoint: ENDPOINT,
      error: 'not_configured',
      checkedAt,
    };
  }

  try {
    // Prefer ZAV tables; fall back to a lightweight health probe
    const url = buildUrl('zav_quotes', 'limit=1');
    const res = await fetch(url, {
      method: 'GET',
      headers: headers('return=minimal'),
    });

    if (res.ok || res.status === 404 || res.status === 406) {
      // 404 table missing still means API is reachable
      const connected = res.ok || res.status === 404 || res.status === 406;
      return {
        enabled: true,
        connected,
        endpoint: ENDPOINT,
        error: res.ok ? undefined : `http_${res.status}_table_may_need_schema`,
        checkedAt,
      };
    }

    return {
      enabled: true,
      connected: false,
      endpoint: ENDPOINT,
      error: `http_${res.status}`,
      checkedAt,
    };
  } catch (err) {
    return {
      enabled: true,
      connected: false,
      endpoint: ENDPOINT,
      error: err instanceof Error ? err.message : 'network',
      checkedAt,
    };
  }
}

export async function insforgeInsert(table: string, row: Record<string, unknown> | Record<string, unknown>[]) {
  if (!insforgeEnabled()) return { ok: false, error: 'not_configured' as const };
  try {
    const res = await fetch(buildUrl(table), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(Array.isArray(row) ? row : [row]),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `http_${res.status}`, detail: text.slice(0, 200) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network' };
  }
}

export async function insforgeUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict = 'id',
) {
  if (!insforgeEnabled()) return { ok: false, error: 'not_configured' as const };
  try {
    const res = await fetch(buildUrl(table, `on_conflict=${encodeURIComponent(onConflict)}`), {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify([row]),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `http_${res.status}`, detail: text.slice(0, 200) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'network' };
  }
}

export function quoteToInsforgeRow(quote: Record<string, unknown>) {
  return {
    id: quote.id,
    created_at: quote.createdAt,
    service: quote.service,
    size: quote.size,
    frequency: quote.frequency,
    name: quote.name,
    phone: quote.phone,
    email: quote.email,
    zip: quote.zip,
    notes: quote.notes || null,
    locale: quote.locale,
    status: quote.status || 'new',
    completed_at: quote.completedAt || null,
    invoice_id: quote.invoiceId || null,
  };
}

export function invoiceToInsforgeRow(invoice: Record<string, unknown>) {
  return {
    id: invoice.id,
    quote_id: invoice.quoteId,
    number: invoice.number,
    created_at: invoice.createdAt,
    status: invoice.status,
    client_name: invoice.clientName,
    client_email: invoice.clientEmail,
    client_phone: invoice.clientPhone,
    client_address: invoice.clientAddress || null,
    service: invoice.service,
    description: invoice.description,
    amount: invoice.amount,
    tax: invoice.tax,
    total: invoice.total,
    currency: invoice.currency,
    notes: invoice.notes || null,
    billing_snapshot: invoice.billingSnapshot || null,
  };
}
