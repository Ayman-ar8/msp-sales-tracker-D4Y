import { Dashboard } from '@/components/Dashboard';
import { demoPayload } from '@/lib/demo';
import { todayIn } from '@/lib/dates';
import { fetchPayload, SheetApiError } from '@/lib/sheetApi';

export const dynamic = 'force-dynamic';

const HELP: Record<SheetApiError['kind'], string> = {
  not_configured: 'Add SHEET_API_URL and SHEET_API_KEY in Vercel > Settings > Environment Variables, then redeploy. Find both in the Sheet: Sales Tracker > Show dashboard connection details.',
  unauthorised: 'The key in Vercel does not match the Sheet. Copy SHEET_API_KEY again from Sales Tracker > Show dashboard connection details, then redeploy.',
  network: 'The Sheet could not be reached. Check SHEET_API_URL is the web app URL ending in /exec.',
  script: 'Check the Apps Script web app is deployed (Execute as: Me, Who has access: Anyone). Ask your assistant to "check my data".'
};

export default async function Page() {
  if (process.env.DEMO_MODE === '1') {
    return <Dashboard data={demoPayload(todayIn('America/New_York'))} demo />;
  }
  try {
    const data = await fetchPayload();
    return <Dashboard data={data} />;
  } catch (e) {
    const err = e instanceof SheetApiError ? e : new SheetApiError(String((e as Error)?.message ?? e), 'script');
    return (
      <main className="page">
        <section className="panel problem" role="alert">
          <h1>The dashboard can&rsquo;t load your data yet</h1>
          <p>{err.message}</p>
          <p className="muted">{HELP[err.kind]}</p>
        </section>
      </main>
    );
  }
}
