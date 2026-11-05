import test from 'node:test';
import assert from 'node:assert/strict';
import {
  allocateOperationCapital,
  canApplyAutomaticCapital,
  suggestOperationCapital,
  normalizeOperationPreferences,
} from './operationCapital.ts';

const rates = { usdtBrl: 5, eurUsdt: 1.25 };
test('a restricted account does not contribute a usable next-entry budget', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'blocked', availableBalance: 200, canStartNewOperation: false }],
    legs: [{ id: 'leg', accountId: 'blocked', odd: 2 }], rates,
  });
  assert.equal(result.totalUsdt, null);
  assert.ok(result.issues.some((issue) => issue.code === 'unavailable_account'));
});
const legs = [
  { id: 'l1', accountId: 'a', odd: 2 },
  { id: 'l2', accountId: 'b', odd: 4 },
];

test('suggestion is capped by the account needed for the odds proportions', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 100 }, { id: 'b', availableBalance: 1000 }],
    legs, rates,
  });
  assert.equal(result.totalUsdt, 150);
  assert.deepEqual(result.allocations.map((a) => a.stakeUsdt), [100, 50]);
  assert.equal(result.selectedAvailableUsdt, 1100);
});

test('uses available balances directly without subtracting existing reservations again', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 80 }, { id: 'b', availableBalance: 50 }],
    legs: legs.map((leg) => ({ ...leg, odd: 2 })), rates,
  });
  assert.equal(result.totalUsdt, 100);
});

test('counts one shared account once and caps its combined legs', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 100 }],
    legs: legs.map((leg) => ({ ...leg, accountId: 'a' })), rates,
  });
  assert.equal(result.totalUsdt, 100);
  assert.equal(result.selectedAvailableUsdt, 100);
  assert.deepEqual(result.allocations.map((a) => a.stakeUsdt), [66.67, 33.33]);
});

test('rounds allocations to cents without exceeding a shared balance or losing the total', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 0.05 }],
    legs: [1, 2, 3].map((id) => ({ id: String(id), accountId: 'a', odd: 2 })), rates,
  });
  assert.equal(result.totalUsdt, 0.05);
  assert.deepEqual(result.allocations.map((a) => a.stakeUsdt), [0.02, 0.02, 0.01]);
});

test('optional personal maximum limits the next entry only', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 1000 }, { id: 'b', availableBalance: 1000 }],
    legs, rates, maximumUsdt: 90,
  });
  assert.equal(result.totalUsdt, 90);
  assert.deepEqual(result.allocations.map((a) => a.stakeUsdt), [60, 30]);
  assert.equal(result.limitedBy, 'maximum');
});

test('zero available balance yields zero instead of a fixed fallback budget', () => {
  const result = suggestOperationCapital({
    accounts: [{ id: 'a', availableBalance: 0 }, { id: 'b', availableBalance: 50 }], legs, rates,
  });
  assert.equal(result.totalUsdt, 0);
  assert.deepEqual(result.allocations.map((a) => a.stakeUsdt), [0, 0]);
});

test('missing account, missing balance and invalid odds withhold the suggestion', () => {
  const base = { accounts: [{ id: 'a', availableBalance: 100 }], legs, rates };
  assert.equal(suggestOperationCapital(base).totalUsdt, null);
  assert.ok(suggestOperationCapital(base).issues.some((issue) => issue.code === 'missing_account'));
  const missingBalance = suggestOperationCapital({ ...base, accounts: [...base.accounts, { id: 'b', availableBalance: null }] });
  assert.equal(missingBalance.totalUsdt, null);
  assert.ok(missingBalance.issues.some((issue) => issue.code === 'missing_balance'));
  const invalidOdds = suggestOperationCapital({ ...base, legs: [{ ...legs[0], odd: 1 }] });
  assert.equal(invalidOdds.totalUsdt, null);
  assert.ok(invalidOdds.issues.some((issue) => issue.code === 'invalid_odds'));
});

test('converts explicit native EUR and BRL balances once using the supplied rates', () => {
  const result = suggestOperationCapital({
    accounts: [
      { id: 'a', availableBalance: 80, balanceCurrency: 'EUR', accountCurrency: 'EUR' },
      { id: 'b', availableBalance: 250, balanceCurrency: 'BRL', accountCurrency: 'BRL' },
    ], legs, rates,
  });
  assert.equal(result.totalUsdt, 150);
  assert.equal(result.selectedAvailableUsdt, 150);
  assert.deepEqual(result.allocations.map((a) => a.nativeEquivalent), [80, 250]);
});

test('already normalized USDT balances are not reinterpreted from the display currency', () => {
  const result = suggestOperationCapital({
    accounts: [
      { id: 'a', availableBalance: 100, accountCurrency: 'EUR' },
      { id: 'b', availableBalance: 50, accountCurrency: 'BRL' },
    ], legs, rates,
  });
  assert.equal(result.totalUsdt, 150);
  assert.deepEqual(result.allocations.map((a) => a.nativeEquivalent), [80, 250]);
});

test('missing required exchange rate or invalid maximum does not invent a conversion', () => {
  const accounts = [{ id: 'a', availableBalance: 80, balanceCurrency: 'EUR' as const }];
  assert.equal(suggestOperationCapital({ accounts, legs: [legs[0]], rates: { ...rates, eurUsdt: 0 } }).totalUsdt, null);
  assert.equal(suggestOperationCapital({ accounts, legs: [legs[0]], rates, maximumUsdt: -1 }).totalUsdt, null);
});

test('manual equalization allocates the typed budget and reports insufficient account balances', () => {
  const result = allocateOperationCapital({
    accounts: [{ id: 'a', availableBalance: 20 }, { id: 'b', availableBalance: 100 }],
    legs, rates, totalUsdt: 90,
  });
  assert.equal(result.totalUsdt, null);
  assert.ok(result.issues.some((issue) => issue.code === 'insufficient_balance'));
});

test('automatic updates respect manual override, saved entries and recorded results', () => {
  const draft = { mode: 'automatic' as const, editingEntryId: null, manualOverride: false, hasRecordedResult: false };
  assert.equal(canApplyAutomaticCapital(draft), true);
  assert.equal(canApplyAutomaticCapital({ ...draft, manualOverride: true }), false);
  assert.equal(canApplyAutomaticCapital({ ...draft, editingEntryId: 'saved' }), false);
  assert.equal(canApplyAutomaticCapital({ ...draft, hasRecordedResult: true }), false);
  assert.equal(canApplyAutomaticCapital({ ...draft, mode: 'manual' }), false);
});

test('preferences discard malformed amounts and keep shortcuts personal and finite', () => {
  assert.deepEqual(normalizeOperationPreferences({ mode: 'automatic', maximumUsdt: 125, shortcuts: [25, -3, '80', 25, Infinity, 60] }), {
    mode: 'automatic', maximumUsdt: 125, shortcuts: [25, 60],
  });
  assert.deepEqual(normalizeOperationPreferences(null), { mode: 'manual', maximumUsdt: null, shortcuts: [] });
});
