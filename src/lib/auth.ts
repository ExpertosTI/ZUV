import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const ADMIN_PIN = process.env.ADMIN_PASSWORD || '04J27';
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function secret() {
  return process.env.ADMIN_SECRET || ADMIN_PIN;
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function isValidPin(pin: string) {
  return safeEqual(String(pin || ''), ADMIN_PIN);
}

/** Signed session token — does not embed the PIN. */
export function encodeAdminToken(pin: string) {
  if (!isValidPin(pin)) return '';
  const exp = Date.now() + TOKEN_TTL_MS;
  const nonce = randomBytes(8).toString('hex');
  const payload = `zav1.${exp}.${nonce}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url');
  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${sig}`;
}

export function authorized(request: Request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || !token.includes('.')) return false;

  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return false;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expected = createHmac('sha256', secret()).update(payload).digest('base64url');
    if (!safeEqual(sig, expected)) return false;

    const parts = payload.split('.');
    if (parts[0] !== 'zav1') return false;
    const exp = Number(parts[1]);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function newAccessToken() {
  return randomBytes(18).toString('base64url');
}
