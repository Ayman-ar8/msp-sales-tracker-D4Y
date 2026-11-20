/**
 * One shared dashboard password (DASHBOARD_PASSWORD in Vercel).
 * The session cookie holds an HMAC of the password, so changing the password
 * logs everyone out at once (that is the offboarding step).
 * Works in both the Edge middleware and Node route handlers (Web Crypto).
 */

export const SESSION_COOKIE = 'st_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sessionToken(password: string): Promise<string> {
  return hmac(password, 'sales-tracker-session-v1');
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(cookieValue: string | undefined): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password || !cookieValue) return false;
  return timingSafeEqual(cookieValue, await sessionToken(password));
}

export async function checkPassword(input: string): Promise<boolean> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(await sessionToken(input), await sessionToken(password));
}
