export type OperationCurrency = 'USDT' | 'EUR' | 'BRL';
export interface OperationPreferences {
  mode: 'manual' | 'automatic';
  maximumUsdt: number | null;
  shortcuts: number[];
}
export interface CapitalAccount {
  id: string;
  availableBalance: number | null;
  accountCurrency?: OperationCurrency;
  /** Existing ledger balances are USDT base, regardless of the display currency. */
  balanceCurrency?: OperationCurrency;
  canStartNewOperation?: boolean;
}
export interface CapitalLeg { id: string; accountId: string | null; odd: number | null }
export interface CapitalRates { usdtBrl: number; eurUsdt: number }
export interface CapitalInput {
  accounts: readonly CapitalAccount[];
  legs: readonly CapitalLeg[];
  rates: CapitalRates;
  maximumUsdt?: number | null;
}
export interface CapitalIssue {
  code: 'missing_account' | 'unavailable_account' | 'missing_balance' | 'invalid_odds' | 'missing_rate' | 'invalid_maximum' | 'invalid_capital' | 'insufficient_balance';
  message: string;
}
export interface CapitalAllocation {
  id: string;
  accountId: string;
  stakeUsdt: number;
  nativeCurrency: OperationCurrency;
  nativeEquivalent: number;
}
export interface CapitalSuggestion {
  totalUsdt: number | null;
  selectedAvailableUsdt: number;
  allocations: CapitalAllocation[];
  issues: CapitalIssue[];
  limitedBy: 'account' | 'maximum' | null;
  explanation: string;
}

const cents = (amount: number) => Math.floor(amount * 100 + 1e-8);
const money = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;
const validRate = (rate: number) => Number.isFinite(rate) && rate > 0;

export function normalizeOperationPreferences(input: unknown): OperationPreferences {
  const value = input && typeof input === 'object' ? input as Partial<OperationPreferences> : {};
  const positive = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;
  return {
    mode: value.mode === 'automatic' ? 'automatic' : 'manual',
    maximumUsdt: positive(value.maximumUsdt) ? money(value.maximumUsdt) : null,
    shortcuts: Array.isArray(value.shortcuts)
      ? [...new Set(value.shortcuts.filter(positive).map(money).filter((n) => n > 0))].slice(0, 6)
      : [],
  };
}

export function canApplyAutomaticCapital(input: {
  mode: OperationPreferences['mode'];
  editingEntryId: string | null;
  manualOverride: boolean;
  hasRecordedResult: boolean;
}): boolean {
  return input.mode === 'automatic' && !input.editingEntryId && !input.manualOverride && !input.hasRecordedResult;
}

function calculateCapital(input: CapitalInput, typedCapital?: number): CapitalSuggestion {
  const issues: CapitalIssue[] = [];
  const balances = new Map<string, number>();
  const accounts = new Map(input.accounts.map((account) => [account.id, account]));
  const weightsByAccount = new Map<string, number>();
  const inverses = input.legs.map((leg) => {
    if (leg.odd === null || !Number.isFinite(leg.odd) || leg.odd <= 1) {
      issues.push({ code: 'invalid_odds', message: 'Informe uma odd maior que 1 em cada perna.' });
      return 0;
    }
    return 1 / leg.odd;
  });
  if (!input.legs.length) issues.push({ code: 'missing_account', message: 'Adicione uma perna e selecione sua conta.' });
  const inverseSum = inverses.reduce((sum, value) => sum + value, 0);
  const weights = inverses.map((value) => value / inverseSum);

  input.legs.forEach((leg, index) => {
    const account = leg.accountId ? accounts.get(leg.accountId) : undefined;
    if (!account) {
      issues.push({ code: 'missing_account', message: 'Selecione uma conta válida para cada perna.' });
      return;
    }
    if (account.canStartNewOperation === false) {
      issues.push({ code: 'unavailable_account', message: 'Uma conta selecionada está impedida de iniciar novas operações. Revise a conta antes de usar a sugestão.' });
      return;
    }
    weightsByAccount.set(account.id, (weightsByAccount.get(account.id) || 0) + weights[index]);
    if (balances.has(account.id)) return;
    if (account.availableBalance === null || !Number.isFinite(account.availableBalance) || account.availableBalance < 0) {
      issues.push({ code: 'missing_balance', message: 'Uma conta selecionada está sem saldo disponível válido.' });
      return;
    }
    const balanceCurrency = account.balanceCurrency || 'USDT';
    const nativeCurrency = account.accountCurrency || balanceCurrency;
    const needsEur = balanceCurrency === 'EUR' || nativeCurrency === 'EUR';
    const needsBrl = balanceCurrency === 'BRL' || nativeCurrency === 'BRL';
    if ((needsEur && !validRate(input.rates.eurUsdt)) || (needsBrl && !validRate(input.rates.usdtBrl))) {
      issues.push({ code: 'missing_rate', message: 'Confira a cotação necessária para as moedas das contas.' });
      return;
    }
    const usdt = balanceCurrency === 'EUR'
      ? account.availableBalance * input.rates.eurUsdt
      : balanceCurrency === 'BRL'
      ? account.availableBalance / input.rates.usdtBrl
      : account.availableBalance;
    balances.set(account.id, cents(usdt));
  });

  if (input.maximumUsdt !== null && input.maximumUsdt !== undefined && (!Number.isFinite(input.maximumUsdt) || input.maximumUsdt < 0)) {
    issues.push({ code: 'invalid_maximum', message: 'Informe um limite pessoal válido ou deixe o campo vazio.' });
  }
  if (typedCapital !== undefined && (!Number.isFinite(typedCapital) || typedCapital < 0)) {
    issues.push({ code: 'invalid_capital', message: 'Informe o capital da próxima entrada.' });
  }
  const selectedAvailableUsdt = [...balances.values()].reduce((sum, value) => sum + value, 0) / 100;
  const failure = (): CapitalSuggestion => ({
    totalUsdt: null, selectedAvailableUsdt, allocations: [], issues,
    limitedBy: null, explanation: [...new Set(issues.map((issue) => issue.message))].join(' '),
  });
  if (issues.length) return failure();

  const accountCapacity = Math.min(...[...weightsByAccount].map(([id, weight]) => Math.floor((balances.get(id) || 0) / weight + 1e-8)));
  const maximumCents = input.maximumUsdt === null || input.maximumUsdt === undefined ? Infinity : cents(input.maximumUsdt);
  const targetCents = typedCapital === undefined ? Math.min(accountCapacity, maximumCents) : cents(typedCapital);
  if (typedCapital !== undefined && targetCents > accountCapacity) {
    issues.push({ code: 'insufficient_balance', message: 'O capital informado supera o saldo de uma conta na proporção das odds. Reduza o capital ou revise as contas.' });
    return failure();
  }

  const stakes = weights.map((weight) => Math.floor(targetCents * weight + 1e-8));
  const usedByAccount = new Map<string, number>();
  input.legs.forEach((leg, index) => usedByAccount.set(leg.accountId!, (usedByAccount.get(leg.accountId!) || 0) + stakes[index]));
  let remainder = targetCents - stakes.reduce((sum, value) => sum + value, 0);
  const remainderOrder = weights.map((weight, index) => ({ index, fraction: targetCents * weight - stakes[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (const { index } of remainderOrder) {
    if (remainder <= 0) break;
    const id = input.legs[index].accountId!;
    if ((usedByAccount.get(id) || 0) < balances.get(id)!) {
      stakes[index] += 1;
      usedByAccount.set(id, (usedByAccount.get(id) || 0) + 1);
      remainder -= 1;
    }
  }
  const allocations = input.legs.map((leg, index): CapitalAllocation => {
    const account = accounts.get(leg.accountId!)!;
    const nativeCurrency = account.accountCurrency || account.balanceCurrency || 'USDT';
    const stakeUsdt = stakes[index] / 100;
    return {
      id: leg.id, accountId: account.id, stakeUsdt, nativeCurrency,
      nativeEquivalent: money(nativeCurrency === 'EUR' ? stakeUsdt / input.rates.eurUsdt
        : nativeCurrency === 'BRL' ? stakeUsdt * input.rates.usdtBrl : stakeUsdt),
    };
  });
  return {
    totalUsdt: (targetCents - remainder) / 100,
    selectedAvailableUsdt, allocations, issues,
    limitedBy: maximumCents < accountCapacity ? 'maximum' : 'account',
    explanation: 'Proporção inversa das odds, limitada pelo saldo disponível registrado de cada conta e pelo limite pessoal, quando definido. Contas repetidas compartilham o mesmo saldo; reservas já refletidas no disponível não são descontadas novamente.',
  };
}

export function suggestOperationCapital(input: CapitalInput): CapitalSuggestion {
  return calculateCapital(input);
}

export function allocateOperationCapital(input: CapitalInput & { totalUsdt: number }): CapitalSuggestion {
  return calculateCapital(input, input.totalUsdt);
}
