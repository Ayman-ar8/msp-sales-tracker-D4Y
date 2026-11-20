import { NextResponse } from 'next/server';
import { requestSync, SheetApiError } from '@/lib/sheetApi';

/** "Sync now": runs the Meta pull in the Sheet. Protected by the middleware. */
export async function POST() {
  try {
    const result = await requestSync();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof SheetApiError ? e.message : 'Sync failed';
    return NextResponse.json({ ok: false, status: 'error', message }, { status: 502 });
  }
}
