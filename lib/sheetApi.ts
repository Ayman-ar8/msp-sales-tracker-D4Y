import 'server-only';
import type { Payload } from './types';

export class SheetApiError extends Error {
  constructor(message: string, readonly kind: 'not_configured' | 'unauthorised' | 'network' | 'script') {
    super(message);
  }
}

function config() {
  const url = process.env.SHEET_API_URL;
  const key = process.env.SHEET_API_KEY;
  if (!url || !key) {
    throw new SheetApiError('SHEET_API_URL and SHEET_API_KEY are not set in Vercel yet.', 'not_configured');
  }
  return { url, key };
}

/** Calls the Apps Script web app. The key goes in the POST body, never the URL. */
async function call<T>(action: 'data' | 'sync'): Promise<T> {
  const { url, key } = config();
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ key, action }),
      cache: 'no-store',
      redirect: 'follow'
    });
  } catch (e) {
    throw new SheetApiError(`Could not reach the Sheet: ${(e as Error).message}`, 'network');
  }
  const text = await res.text();
  let body: { ok?: boolean; error?: string; data?: unknown } & Record<string, unknown>;
  try {
    body = JSON.parse(text);
  } catch {
    throw new SheetApiError('The Sheet answered with something that is not data. Check the web app is deployed with access "Anyone".', 'script');
  }
  if (body.error === 'unauthorised') throw new SheetApiError('The SHEET_API_KEY in Vercel does not match the Sheet.', 'unauthorised');
  if (body.ok === false && body.error) throw new SheetApiError(`The Sheet reported an error: ${body.error}`, 'script');
  return body as T;
}

export async function fetchPayload(): Promise<Payload> {
  const body = await call<{ data: Payload }>('data');
  return body.data;
}

export interface SyncResult {
  ok: boolean;
  status: string;
  rows?: number;
  message?: string;
  retry_after_seconds?: number;
}

export async function requestSync(): Promise<SyncResult> {
  return call<SyncResult>('sync');
}
