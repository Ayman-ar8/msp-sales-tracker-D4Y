import { describe, expect, it } from 'vitest';
import { periodFor } from '@/lib/periods';
import { addDays, weekStart, todayIn } from '@/lib/dates';

describe('periods', () => {
  it('daily compares with the day before', () => {
    const p = periodFor('daily', { date: '2026-03-01' }, '2026-03-05');
    expect([p.start, p.end, p.prevStart, p.prevEnd]).toEqual(['2026-03-01', '2026-03-01', '2026-02-28', '2026-02-28']);
  });

  it('range compares with the same number of days just before', () => {
    const p = periodFor('range', { start: '2026-11-10', end: '2026-11-16' }, '2026-11-20');
    expect([p.prevStart, p.prevEnd]).toEqual(['2026-11-03', '2026-11-09']);
  });

  it('current month is month-to-date and compares with the same days of last month', () => {
    const p = periodFor('monthly', { month: '2026-11' }, '2026-11-20');
    expect([p.start, p.end, p.prevStart, p.prevEnd]).toEqual(['2026-11-01', '2026-11-20', '2026-10-01', '2026-10-20']);
  });

  it('same-days comparison stops at the end of a shorter previous month', () => {
    const p = periodFor('monthly', { month: '2026-03' }, '2026-03-31');
    expect([p.prevStart, p.prevEnd]).toEqual(['2026-02-01', '2026-02-28']);
  });

  it('a past month compares full month with full month', () => {
    const p = periodFor('monthly', { month: '2026-10' }, '2026-11-20');
    expect([p.start, p.end, p.prevStart, p.prevEnd]).toEqual(['2026-10-01', '2026-10-31', '2026-09-01', '2026-09-30']);
  });
});

describe('dates', () => {
  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });
  it('finds the Monday of the week', () => {
    expect(weekStart('2026-11-22')).toBe('2026-11-16'); // Sunday -> Monday before
    expect(weekStart('2026-11-16')).toBe('2026-11-16');
  });
  it('gives today in the business timezone, not the server timezone', () => {
    const instant = new Date('2026-11-20T03:30:00Z');
    expect(todayIn('America/Los_Angeles', instant)).toBe('2026-11-19');
    expect(todayIn('Asia/Dubai', instant)).toBe('2026-11-20');
  });
});
