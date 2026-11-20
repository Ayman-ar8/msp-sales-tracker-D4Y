/** Shapes of the data the Apps Script endpoint returns. Mirrors schema.json. */

export interface Person {
  id: string;
  name: string;
  email: string;
  role: 'closer' | 'setter' | 'both' | string;
  status: 'active' | 'inactive' | string;
  working_days: string;
  start_date: string;
  end_date: string;
}

interface LedgerBase {
  response_id: string;
  submitted_at: string;
  date: string;
  person_id: string;
  person_name: string;
  flags: string;
  source: string;
}

export interface CloserRow extends LedgerBase {
  day_off: 'yes' | 'no' | string;
  calls_on_calendar: number;
  shows_new: number;
  shows_followup: number;
  no_shows: number;
  reschedules: number;
  cancelled: number;
  disqualified: number;
  offers: number;
  closes_pif: number;
  closes_pp: number;
  deposits: number;
  contract_value: number;
  cash_upfront: number;
  cash_pp: number;
  cash_deposit: number;
  notes: string;
}

export interface SetterRow extends LedgerBase {
  day_off: 'yes' | 'no' | string;
  conversations: number;
  qualified_conversations: number;
  calls_booked: number;
  notes: string;
}

export interface RefundRow extends LedgerBase {
  amount: number;
  kind: string;
  notes: string;
}

export interface AdRow {
  date: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  source: 'api' | 'manual' | string;
  override: 'yes' | 'no' | string;
  response_id: string;
  synced_at: string;
}

export interface MissingEod {
  date: string;
  person_id: string;
  name: string;
  email: string;
  form: 'closer' | 'setter';
}

export interface Health {
  status: 'ok' | 'issues' | 'unknown' | string;
  issues: string[];
  last_health_check: string;
  minutes_since_health_check: number | null;
  minutes_since_meta_sync: number | null;
  last_reconcile: string;
  rows_backfilled_last: number;
  rows_backfilled_total: number;
  meta_status: string;
  meta_last_sync: string;
  meta_last_error: string;
  last_response: { closer?: string; setter?: string };
}

export interface Payload {
  schema_version: string;
  generated_at: string;
  today: string;
  settings: {
    business_name: string;
    currency: string;
    timezone: string;
    closers_enabled: boolean;
    setters_enabled: boolean;
    ads_enabled: boolean;
  };
  health: Health;
  team: Person[];
  closer: CloserRow[];
  setter: SetterRow[];
  ads: AdRow[];
  refunds: RefundRow[];
  missing: MissingEod[];
}
