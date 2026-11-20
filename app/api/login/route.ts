import { NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, sessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get('password') ?? '');
  const url = new URL(req.url);

  if (!process.env.DASHBOARD_PASSWORD) {
    return NextResponse.redirect(new URL('/login?error=not_configured', url), 303);
  }
  if (!(await checkPassword(password))) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return NextResponse.redirect(new URL('/login?error=wrong', url), 303);
  }
  const res = NextResponse.redirect(new URL('/', url), 303);
  res.cookies.set(SESSION_COOKIE, await sessionToken(process.env.DASHBOARD_PASSWORD), {
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
  return res;
}
