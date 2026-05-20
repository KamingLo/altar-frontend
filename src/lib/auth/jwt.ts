/** Segment path koleksi Django — wajib trailing slash agar redirect tidak membuang Authorization */
const COLLECTION_PATH_SEGMENTS = new Set([
  'sessions',
  'classes',
  'courses',
  'rooms',
  'semesters',
  'users',
  'asdos',
  'koor',
  'jadwal',
  'substitute-sessions',
]);

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  const exp = payload.exp;
  if (typeof exp !== 'number') return false;
  return exp * 1000 < Date.now();
}

/** Hindari redirect 301/307 yang memutus header Bearer pada request berikutnya */
export function normalizeApiEndpoint(endpoint: string): string {
  const qIdx = endpoint.indexOf('?');
  const path = qIdx === -1 ? endpoint : endpoint.slice(0, qIdx);
  const query = qIdx === -1 ? '' : endpoint.slice(qIdx);

  if (path.endsWith('/')) return endpoint;

  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last && COLLECTION_PATH_SEGMENTS.has(last)) {
    return `${path}/${query}`;
  }

  return endpoint;
}

export const SESSION_EXPIRED_MESSAGE = 'Session expired, please log in again';

export function isSessionExpiredMessage(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('session expired') || lower.includes('invalid or expired token');
}
