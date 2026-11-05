import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardReport, buildSettledProfitSeries, selectSettledEntries } from './reporting.ts';
import {
  INITIAL_ENTRIES, INITIAL_PARTNERSHIPS, INITIAL_BANK_ACCOUNTS, INITIAL_HOUSE_ACCOUNTS,
  INITIAL_WITHDRAWALS, INITIAL_DEPOSITS_TRANSFERS, INITIAL_DIVERGENCES,
} from './seed.ts';
import type { BetEntry } from './types.ts';

const completed = INITIAL_ENTRIES.find((entry) => entry.resultStatus === 'concluida')!;
const boundary: BetEntry = { ...completed, id: 'boundary', createdAt: '30/09/2026 23:50', concludedAt: '01/10/2026 00:10' };
test('a planning budget does not count as an invested amount or alter the settled result', () => {
  const small = buildSettledProfitSeries([{ ...boundary, plannedCapital: 100 }]);
  const large = buildSettledProfitSeries([{ ...boundary, plannedCapital: 1000000 }]);
  assert.deepEqual(small, large);
});

test('settlement report uses conclusion date across month boundaries and inclusive bounds', () => {
  assert.deepEqual(selectSettledEntries([boundary], '2026-10-01', '2026-10-01').settledEntries.map((e) => e.id), ['boundary']);
  assert.equal(selectSettledEntries([boundary], '2026-09-01', '2026-09-30').settledEntries.length, 0);
});

test('undated or invalid settlements do not fall back to creation or invent a result date', () => {
  const data = [null, '31/02/2026', 'sem data'].map((concludedAt, index) => ({ ...boundary, id: String(index), concludedAt }));
  assert.equal(selectSettledEntries(data).undatedCount, 3);
  assert.equal(selectSettledEntries(data).settledEntries.length, 0);
  assert.equal(buildSettledProfitSeries(data).length, 0);
});

test('profit points aggregate records chronologically and preserve drilldown identities', () => {
  const series = buildSettledProfitSeries([boundary, { ...boundary, id: 'second' }, { ...boundary, id: 'earlier', concludedAt: '29/09/2026' }]);
  assert.deepEqual(series.map((point) => point.date), ['2026-09-29', '2026-10-01']);
  assert.deepEqual(series[1].entryIds, ['boundary', 'second']);
  assert.equal(series[1].operations, 2);
  assert.equal(series[1].amount, Math.round(series[0].amount * 200) / 100);
});

test('period filters preserve present inventory, reservations and withdrawal transit', () => {
  const data = {
    partnerships: INITIAL_PARTNERSHIPS, houseAccounts: INITIAL_HOUSE_ACCOUNTS,
    bankAccounts: INITIAL_BANK_ACCOUNTS, entries: [...INITIAL_ENTRIES, boundary],
    withdrawals: INITIAL_WITHDRAWALS, deposits: INITIAL_DEPOSITS_TRANSFERS, divergences: INITIAL_DIVERGENCES,
  };
  const september = buildDashboardReport(data, '2026-09-01', '2026-09-30');
  const october = buildDashboardReport(data, '2026-10-01', '2026-10-31');
  for (const key of ['totalGlobalCapital', 'availableInHouses', 'totalBankBalances', 'reservedInOpenBets', 'inTransitWithdrawals', 'projectedOpenProfit'] as const) {
    assert.equal(september.summary[key], october.summary[key], key);
  }
  assert.ok(october.settledEntries.some((entry) => entry.id === 'boundary'));
  assert.ok(!september.settledEntries.some((entry) => entry.id === 'boundary'));
  assert.equal(september.operationalSnapshot.entries, data.entries);
});
