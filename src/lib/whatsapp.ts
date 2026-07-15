import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PHONE_WA } from './contact';
import { maskPhone, normalizePhoneDigits } from './phone';

const DATA_DIR = process.env.ZAV_DATA_DIR || path.join(process.cwd(), 'data');
const STATE_FILE = 'whatsapp.json';
const DEFAULT_INSTANCE = 'zav-notify';
const DEFAULT_API_URL = 'https://evoapi.renace.tech';
const TEXT_DELAY_MS = 1200;

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
  const state = await getWhatsAppState();
  return state.instanceName || env('EVOLUTION_INSTANCE', DEFAULT_INSTANCE) || DEFAULT_INSTANCE;
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
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        `HTTP ${res.status}`;
      return { success: false, error: err, data, status: res.status };
    }
    return { success: true, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'network_error';
    return { success: false, error: message };
  }
}

function extractQr(data: any): string | null {
  const raw =
    data?.qrcode?.base64 ||
    data?.base64 ||
    data?.qrcode ||
    data?.qr?.base64 ||
    null;
  if (!raw || typeof raw !== 'string') return null;
  return raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`;
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
  const name = (instanceName || (await activeInstanceName())).trim() || DEFAULT_INSTANCE;
  const result = await evoFetch('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName: name,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });

  await saveWhatsAppState({ instanceName: name, connected: false });

  if (!result.success) {
    // Instance may already exist — still return name so UI can fetch QR
    return {
      ok: false as const,
      instanceName: name,
      qrcode: null as string | null,
      error: result.error,
      alreadyExists: /already|exist/i.test(String(result.error || '')),
      data: result.data,
    };
  }

  return {
    ok: true as const,
    instanceName: name,
    qrcode: extractQr(result.data),
    data: result.data,
  };
}

export async function getEvolutionQr(instanceName?: string) {
  const name = instanceName || (await activeInstanceName());
  const result = await evoFetch(`/instance/connect/${encodeURIComponent(name)}`);
  if (!result.success) {
    return { ok: false as const, instanceName: name, qrcode: null as string | null, error: result.error };
  }
  return {
    ok: true as const,
    instanceName: name,
    qrcode: extractQr(result.data),
    data: result.data,
  };
}

export async function refreshEvolutionConnection() {
  const name = await activeInstanceName();
  const result = await evoFetch(`/instance/connectionState/${encodeURIComponent(name)}`);
  const state = result.success ? extractState(result.data) : 'error';
  const phone = extractOwnerPhone(result.data);

  if (state === 'open') {
    await saveWhatsAppState({
      connected: true,
      phone: phone || (await getWhatsAppState()).phone,
      instanceName: name,
    });
  } else if (result.success) {
    await saveWhatsAppState({ connected: false, instanceName: name });
  }

  return {
    ok: result.success,
    instanceName: name,
    state,
    phone: phone || (await getWhatsAppState()).phone,
    error: result.error,
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
    '✨ ZAV Interior & Clean',
    '✅ WhatsApp notifications are active.',
    '',
    'This channel will send:',
    '• Quote confirmations to clients',
    '• New-lead alerts to admin',
    '• Invoice & reminder notices',
    '',
    toLabel ? `Test to: ${toLabel}` : '',
    `🕐 ${when}`,
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
