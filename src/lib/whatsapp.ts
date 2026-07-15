import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PHONE_WA } from './contact';
import { maskPhone, normalizePhoneDigits } from './phone';

const DATA_DIR = process.env.ZAV_DATA_DIR || path.join(process.cwd(), 'data');
const STATE_FILE = 'whatsapp.json';
const DEFAULT_INSTANCE = 'renace';
const DEFAULT_API_URL = 'https://evoapi.renace.tech';
const TEXT_DELAY_MS = 3500;
/** Pause between outbound notifications (client → admin) to reduce ban risk. */
const QUEUE_GAP_MS = 4500;

function env(name: string, fallback = '') {
  const raw = process.env[name] ?? fallback;
  return String(raw).trim().replace(/^["']|["']$/g, '');
}

export type WhatsAppState = {
  instanceName: string;
  connected: boolean;
  phone: string;
  updatedAt: string;
};

type EvoResult = {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
};

const defaultState = (): WhatsAppState => ({
  instanceName: env('EVOLUTION_INSTANCE', DEFAULT_INSTANCE) || DEFAULT_INSTANCE,
  connected: false,
  phone: '',
  updatedAt: new Date().toISOString(),
});

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function writeState(state: WhatsAppState) {
  await ensureDataDir();
  const full = path.join(DATA_DIR, STATE_FILE);
  const tmp = `${full}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await fs.rename(tmp, full);
}

export async function getWhatsAppState(): Promise<WhatsAppState> {
  await ensureDataDir();
  const full = path.join(DATA_DIR, STATE_FILE);
  try {
    const raw = await fs.readFile(full, 'utf8');
    const parsed = JSON.parse(raw) as Partial<WhatsAppState>;
    return {
      instanceName: String(parsed.instanceName || env('EVOLUTION_INSTANCE', DEFAULT_INSTANCE) || DEFAULT_INSTANCE),
      connected: Boolean(parsed.connected),
      phone: String(parsed.phone || ''),
      updatedAt: String(parsed.updatedAt || new Date().toISOString()),
    };
  } catch {
    const state = defaultState();
    await writeState(state);
    return state;
  }
}

export async function saveWhatsAppState(patch: Partial<WhatsAppState>): Promise<WhatsAppState> {
  const current = await getWhatsAppState();
  const next: WhatsAppState = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeState(next);
  return next;
}

export function evolutionApiUrl() {
  return env('EVOLUTION_API_URL', DEFAULT_API_URL).replace(/\/$/, '');
}

export function evolutionApiKey() {
  return env('EVOLUTION_API_KEY');
}

export function adminWhatsAppNumber() {
  return env('ADMIN_WHATSAPP', PHONE_WA);
}

/** API key + URL are enough; instance can be created from admin QR flow. */
export function whatsappConfigured() {
  return Boolean(evolutionApiUrl() && evolutionApiKey());
}

async function activeInstanceName() {
  const envName = env('EVOLUTION_INSTANCE', DEFAULT_INSTANCE) || DEFAULT_INSTANCE;
  const state = await getWhatsAppState();
  // Deploy .env / .evolution.local is source of truth (avoid stale zav-notify from old UI)
  if (envName && state.instanceName !== envName) {
    await saveWhatsAppState({ instanceName: envName });
    return envName;
  }
  return state.instanceName || envName;
}

async function evoFetch(route: string, options: RequestInit = {}): Promise<EvoResult> {
  const baseUrl = evolutionApiUrl();
  const apiKey = evolutionApiKey();
  if (!baseUrl || !apiKey) {
    return { success: false, error: 'Evolution API not configured' };
  }

  try {
    const res = await fetch(`${baseUrl}${route}`, {
      ...options,
      signal: AbortSignal.timeout(25_000),
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: parseEvoError(data, res.status), data, status: res.status };
    }
    return { success: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error';
    return { success: false, error: message };
  }
}

function parseEvoError(data: any, status?: number): string {
  const msg = data?.message ?? data?.error ?? data?.response?.message;
  if (Array.isArray(msg)) {
    return msg
      .map((m) => (typeof m === 'string' ? m : JSON.stringify(m)))
      .join(', ')
      .slice(0, 240);
  }
  if (typeof msg === 'string' && msg.trim()) return msg.slice(0, 240);
  if (msg && typeof msg === 'object') return JSON.stringify(msg).slice(0, 240);
  if (status === 404) return 'Not Found';
  if (status === 401) return 'Unauthorized';
  return status ? `HTTP ${status}` : 'Evolution request failed';
}

function humanizeEvolutionError(err?: string, status?: number): string {
  const e = String(err || '').toLowerCase();
  if (status === 401 || e.includes('unauthorized') || e.includes('forbidden')) {
    return (
      'Evolution rejected the API key (Unauthorized). ' +
      'EVOLUTION_API_KEY must be the GLOBAL key from evoapi Manager (AUTHENTICATION_API_KEY), ' +
      'not an instance token like RENACE.TECH.'
    );
  }
  if (status === 404 || e.includes('not found')) {
    return 'WhatsApp instance not found on Evolution. Check EVOLUTION_INSTANCE (renace) in .evolution.local.';
  }
  if (e.includes('timeout') || e.includes('fetch failed') || e.includes('network')) {
    return 'Could not reach evoapi.renace.tech. Check server outbound HTTPS.';
  }
  return err || 'Evolution request failed';
}

/** Prefer real base64 QR images; ignore short pairing `code` strings. */
function extractQr(data: any): string | null {
  const candidates = [
    data?.qrcode?.base64,
    data?.base64,
    data?.qr?.base64,
    typeof data?.qrcode === 'string' ? data.qrcode : null,
  ];
  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    const cleaned = raw.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
    if (cleaned.length < 80) continue;
    return raw.startsWith('data:') ? raw : `data:image/png;base64,${cleaned}`;
  }
  return null;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Typing-style delay passed to Evolution sendText (anti-ban). */
export function textSendDelayMs() {
  return TEXT_DELAY_MS;
}

/** Gap between sequential outbound messages in a queue. */
export function queueGapMs() {
  return QUEUE_GAP_MS;
}

export async function probeEvolutionAdmin() {
  const result = await evoFetch('/instance/fetchInstances');
  if (!result.success) {
    return {
      ok: false as const,
      error: humanizeEvolutionError(result.error, result.status),
      status: result.status,
    };
  }
  return { ok: true as const };
}

/**
 * Connect existing Evolution instance (`renace` by default) and return QR if needed.
 * Prefer connect over create — shared Renace instances already exist on evoapi.
 */
export async function startWhatsAppSession(instanceName?: string) {
  const name = (instanceName || (await activeInstanceName())).trim() || DEFAULT_INSTANCE;
  await saveWhatsAppState({ instanceName: name, connected: false });

  // Soft probe — continue even if list fails; connectionState/connect may still work
  const probe = await probeEvolutionAdmin();

  // Already linked?
  const live = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`);
  if (live.success) {
    const state = extractState(live.data);
    if (state === 'open') {
      const phone = extractOwnerPhone(live.data);
      await saveWhatsAppState({ connected: true, phone: phone || '', instanceName: name });
      return {
        ok: true as const,
        instanceName: name,
        qrcode: null as string | null,
        alreadyConnected: true as const,
      };
    }
  }

  // Fresh QR for existing instance
  const conn = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
  if (conn.success) {
    const qr = extractQr(conn.data);
    if (qr) {
      return { ok: true as const, instanceName: name, qrcode: qr };
    }
  }

  // If probe failed and connect failed, surface the clearer admin-key error
  if (!probe.ok && (conn.status === 401 || live.status === 401)) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: probe.error,
    };
  }

  // Missing instance only → create (requires global Evolution key)
  const missing =
    conn.status === 404 ||
    /not found/i.test(String(conn.error || '')) ||
    live.status === 404 ||
    /not found/i.test(String(live.error || ''));

  if (!missing) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: humanizeEvolutionError(conn.error || live.error, conn.status || live.status),
    };
  }

  if (!probe.ok) {
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: probe.error,
    };
  }

  const createBody = JSON.stringify({
    instanceName: name,
    qrcode: true,
    integration: 'WHATSAPP-BAILEYS',
  });
  const created = await evoFetch('/instance/create', { method: 'POST', body: createBody });
  if (created.success) {
    const qr = extractQr(created.data);
    if (qr) return { ok: true as const, instanceName: name, qrcode: qr };
    await sleep(800);
    const again = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
    const qr2 = again.success ? extractQr(again.data) : null;
    if (qr2) return { ok: true as const, instanceName: name, qrcode: qr2 };
  }

  return {
    ok: false as const,
    instanceName: name,
    qrcode: null as string | null,
    error: humanizeEvolutionError(
      created.error || conn.error || 'Could not create or connect instance',
      created.status || conn.status,
    ),
  };
}

function extractState(data: any): string {
  return (
    data?.instance?.state ||
    data?.state ||
    data?.connectionState ||
    data?.status ||
    'unknown'
  );
}

function extractOwnerPhone(data: any): string {
  const owner =
    data?.instance?.owner ||
    data?.owner ||
    data?.instance?.ownerJid ||
    data?.ownerJid ||
    '';
  const digits = String(owner).replace(/@.*$/, '').replace(/\D/g, '');
  return digits || '';
}

export async function createEvolutionInstance(instanceName?: string) {
  return startWhatsAppSession(instanceName);
}

export async function getEvolutionQr(instanceName?: string) {
  // Refresh QR for an existing session — if missing, full start/create
  const name = instanceName || (await activeInstanceName());
  const result = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
  if (result.success) {
    const qrcode = extractQr(result.data);
    if (qrcode) return { ok: true as const, instanceName: name, qrcode, data: result.data };
  }

  if (result.status === 404 || /not found/i.test(String(result.error || ''))) {
    return startWhatsAppSession(name);
  }

  return {
    ok: false as const,
    instanceName: name,
    qrcode: null as string | null,
    error: humanizeEvolutionError(result.error, result.status),
  };
}

export async function refreshEvolutionConnection() {
  const name = await activeInstanceName();
  const result = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`);

  if (!result.success) {
    const missing = result.status === 404 || /not found/i.test(String(result.error || ''));
    return {
      ok: false,
      instanceName: name,
      state: missing ? 'missing' : 'error',
      phone: (await getWhatsAppState()).phone,
      error: humanizeEvolutionError(result.error, result.status),
      data: result.data,
    };
  }

  const state = extractState(result.data);
  const phone = extractOwnerPhone(result.data);

  if (state === 'open') {
    await saveWhatsAppState({
      connected: true,
      phone: phone || (await getWhatsAppState()).phone,
      instanceName: name,
    });
  } else {
    await saveWhatsAppState({ connected: false, instanceName: name });
  }

  return {
    ok: true,
    instanceName: name,
    state,
    phone: phone || (await getWhatsAppState()).phone,
    error: undefined as string | undefined,
    data: result.data,
  };
}

export async function logoutEvolutionInstance() {
  const name = await activeInstanceName();
  const result = await evoFetch(`/instance/logout/${encodeURIComponent(name)}`, { method: 'DELETE' });
  await saveWhatsAppState({ connected: false, phone: '' });
  return { ok: result.success, error: result.error, instanceName: name };
}

export async function deleteEvolutionInstance() {
  const name = await activeInstanceName();
  const result = await evoFetch(`/instance/delete/${encodeURIComponent(name)}`, { method: 'DELETE' });
  await saveWhatsAppState({
    connected: false,
    phone: '',
    instanceName: env('EVOLUTION_INSTANCE', DEFAULT_INSTANCE) || DEFAULT_INSTANCE,
  });
  return { ok: result.success, error: result.error, instanceName: name };
}

export async function getWhatsAppConfigStatus() {
  if (!whatsappConfigured()) {
    return {
      configured: false as const,
      reason: 'EVOLUTION_API_URL / EVOLUTION_API_KEY not set',
      apiUrl: evolutionApiUrl(),
      instance: '',
      connectionState: null as string | null,
      phone: null as string | null,
      adminTo: maskPhone(adminWhatsAppNumber()),
    };
  }

  const state = await getWhatsAppState();
  let connectionState: string | null = state.connected ? 'open' : null;
  let phone = state.phone || null;

  try {
    const live = await refreshEvolutionConnection();
    connectionState = live.state;
    phone = live.phone || phone;
  } catch {
    /* offline ok — use persisted */
  }

  return {
    configured: true as const,
    apiUrl: evolutionApiUrl(),
    instance: state.instanceName,
    connectionState,
    phone: phone ? maskPhone(phone) : null,
    adminTo: maskPhone(adminWhatsAppNumber()),
    connected: connectionState === 'open',
  };
}

async function sendText(to: string, text: string) {
  const instance = await activeInstanceName();
  const phone = normalizePhoneDigits(to, 'US');
  if (!phone) return { ok: false as const, error: 'invalid_phone' };

  const result = await evoFetch(`/message/sendText/${encodeURIComponent(instance)}`, {
    method: 'POST',
    body: JSON.stringify({
      number: phone,
      text,
      delay: TEXT_DELAY_MS,
    }),
  });

  if (!result.success) {
    console.warn('[whatsapp] send failed', result.status, String(result.error || '').slice(0, 200));
    return { ok: false as const, error: result.error || `http_${result.status || 500}` };
  }
  return { ok: true as const };
}

export async function sendWhatsAppMessage(to: string, text: string) {
  if (!whatsappConfigured()) return { ok: false as const, error: 'not_configured' };
  const phone = normalizePhoneDigits(to, 'US');
  if (!phone) return { ok: false as const, error: 'invalid_phone' };
  return sendText(phone, text);
}

export async function sendAdminWhatsApp(text: string) {
  return sendWhatsAppMessage(adminWhatsAppNumber(), text);
}

/** ZAV identity test — same voice as quote notifications. */
export function buildWhatsAppTestMessage(toLabel?: string) {
  const when = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  return [
    'ZAV Interior & Clean',
    'WhatsApp notifications are active for Orlando & Central Florida.',
    '',
    'This channel will send:',
    '- Quote confirmations to clients',
    '- New-lead alerts to admin',
    '- Invoice & reminder notices',
    '',
    toLabel ? `Test to: ${toLabel}` : '',
    `Checked: ${when}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function sendWhatsAppTest(to?: string, customMessage?: string) {
  const dest = (to || adminWhatsAppNumber()).trim();
  if (!dest) return { ok: false as const, error: 'missing_number' };
  const text = (customMessage || '').trim() || buildWhatsAppTestMessage(maskPhone(dest));
  const result = await sendWhatsAppMessage(dest, text);
  return result.ok ? { ok: true as const, to: maskPhone(dest) } : { ok: false as const, error: result.error };
}
