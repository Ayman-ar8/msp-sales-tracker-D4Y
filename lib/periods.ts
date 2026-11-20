import { addDays, daysBetween, monthEnd, monthStart, monthLabel, shortDate } from './dates';

export type View = 'daily' | 'range' | 'monthly';

export interface Period {
  start: string;
  end: string;
  label: string;
  prevStart: string;
  prevEnd: string;
  prevLabel: string;
}

/**
 * The selected period and the period it is compared with.
 * - Daily: one date vs the day before.
 * - Range: start..end vs the same number of days immediately before.
 * - Monthly: a calendar month vs the previous month. The current month is
 *   month-to-date and is compared with the same days of the previous month,
 *   so a part-month never looks like a drop.
 */
export function periodFor(view: View, anchor: { date?: string; start?: string; end?: string; month?: string }, today: string): Period {
  if (view === 'daily') {
    const d = anchor.date ?? today;
    const p = addDays(d, -1);
    return { start: d, end: d, label: shortDate(d), prevStart: p, prevEnd: p, prevLabel: shortDate(p) };
  }

  if (view === 'range') {
    const start = anchor.start ?? addDays(today, -6);
    const end = anchor.end && anchor.end >= start ? anchor.end : start;
    const len = daysBetween(start, end) + 1;
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(len - 1));
    return {
      start,
      end,
      label: `${shortDate(start)} – ${shortDate(end)}`,
      prevStart,
      prevEnd,
      prevLabel: `${shortDate(prevStart)} – ${shortDate(prevEnd)}`
    };
  }

  const first = monthStart((anchor.month ?? today.slice(0, 7)) + '-01');
  const isCurrent = first === monthStart(today);
  const end = isCurrent ? today : monthEnd(first);
  const prevFirst = monthStart(addDays(first, -1));
  const prevMonthEnd = monthEnd(prevFirst);
  let prevEnd = prevMonthEnd;
  if (isCurrent) {
    const sameDay = addDays(prevFirst, daysBetween(first, end));
    prevEnd = sameDay < prevMonthEnd ? sameDay : prevMonthEnd;
  }
  return {
    start: first,
    end,
    label: isCurrent ? `${monthLabel(first)} (to date)` : monthLabel(first),
    prevStart: prevFirst,
    prevEnd,
    prevLabel: isCurrent ? `${monthLabel(prevFirst)}, same days` : monthLabel(prevFirst)
  };
}
