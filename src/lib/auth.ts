const ADMIN_PIN = process.env.ADMIN_PASSWORD || '04J27';

export function isValidPin(pin: string) {
  return pin === ADMIN_PIN;
}

export function encodeAdminToken(pin: string) {
  return Buffer.from(`pin:${pin}`, 'utf8').toString('base64url');
}

export function authorized(request: Request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    if (!decoded.startsWith('pin:')) return false;
    return isValidPin(decoded.slice(4));
  } catch {
    return false;
  }
}
