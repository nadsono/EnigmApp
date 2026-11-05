import { computeGlobalSummary, evaluateBetEntry, parseSingleAppDate } from './ledger.ts';
import type { BetEntry } from './types.ts';

export interface SettledProfitPoint {
  date: string;
  label: string;
  amount: number;
  operations: number;
  entryIds: string[];
}

function settlementDate(entry: BetEntry): string | null {
  if (!entry.concludedAt) return null;
  const iso = parseSingleAppDate(entry.concludedAt);
  if (!iso) return null;
  const date = new Date(iso + 'T12:00:00Z');
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}

export function selectSettledEntries(entries: readonly BetEntry[], start = '', end = '') {
  const settledEntries: BetEntry[] = [];
  let undatedCount = 0;
  for (const entry of entries) {
    if (entry.resultStatus !== 'concluida') continue;
    const date = settlementDate(entry);
    if (!date) {
      undatedCount += 1;
      continue;
    }
    if ((!start || date >= start) && (!end || date <= end)) settledEntries.push(entry);
  }
  return { settledEntries, undatedCount };
}

export function buildSettledProfitSeries(entries: readonly BetEntry[]): SettledProfitPoint[] {
  const byDate = new Map<string, SettledProfitPoint>();
  for (const entry of entries) {
    if (entry.resultStatus !== 'concluida') continue;
    const date = settlementDate(entry);
    const netProfit = evaluateBetEntry(entry).netProfit;
    if (!date || netProfit === null) continue;
    const point = byDate.get(date) ?? {
      date, label: date.slice(8, 10) + '/' + date.slice(5, 7), amount: 0, operations: 0, entryIds: [],
    };
    point.amount = Math.round((point.amount + netProfit) * 100) / 100;
    point.operations += 1;
    point.entryIds.push(entry.id);
    byDate.set(date, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Inventory is current; only the realized result is scoped to the settlement period. */
export function buildDashboardReport(
  authorizedData: Parameters<typeof computeGlobalSummary>[0],
  start = '',
  end = '',
) {
  const report = selectSettledEntries(authorizedData.entries, start, end);
  const current = computeGlobalSummary(authorizedData);
  const period = computeGlobalSummary({ ...authorizedData, entries: report.settledEntries });
  return {
    ...report,
    summary: {
      ...current,
      realizedProfitMonth: period.realizedProfitMonth,
      roiMonthPercent: period.roiMonthPercent,
      resolvedBetsCount: period.resolvedBetsCount,
    },
    operationalSnapshot: {
      entries: authorizedData.entries, withdrawals: authorizedData.withdrawals,
      deposits: authorizedData.deposits, divergences: authorizedData.divergences,
    },
  };
}
