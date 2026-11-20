export const metadata = { title: 'Sign in · Sales Tracker' };

const MESSAGES: Record<string, string> = {
  wrong: 'That password is not right.',
  not_configured: 'The dashboard password is not set yet. Add DASHBOARD_PASSWORD in Vercel and redeploy.'
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form className="login-card" method="post" action="/api/login">
        <h1>Sales dashboard</h1>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus />
        {error && <p className="login-error" role="alert">{MESSAGES[error] ?? 'Could not sign in.'}</p>}
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
