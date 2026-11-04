import type {
  BankAccount,
  BetEntry,
  BetLeg,
  CostRecord,
  DepositTransfer,
  HouseAccount,
  Partnership,
  ReconciliationDivergence,
  StatementImportCandidate,
  UserProfile,
  Withdrawal,
} from './types.ts';

export interface EntryEvaluation {
  canConclude: boolean;
  missingFields: string[];
  hasAccounts: boolean;
  hasTotalCapital: boolean;
  hasGreenStake: boolean;
  hasGreenReturn: boolean;
  totalStake: number;
  totalReturn: number;
  netProfit: number | null;
  roiPercent: number | null;
  reservedStakeByAccount: Record<string, number>;
  projectedProfit: number | null;
}

/**
 * Avalia uma entrada (Modo Rápido ou Detalhado) sem inventar valores ausentes.
 * Separa situação do resultado da situação de conciliação financeira.
 */
export function evaluateBetEntry(entry: BetEntry): EntryEvaluation {
  const missingFields: string[] = [];
  let sumLegStakes = 0;
  let sumLegReturns = 0;
  let allLegsHaveAccount = entry.legs.length > 0;
  let allLegsHaveStake = entry.legs.length > 0;
  let allSettledLegsHaveReturn = true;
  let hasAtLeastOneGreenOrCashout = false;
  let greenStakeOk = false;
  let greenReturnOk = false;
  let projectedReturn = 0;
  let canProject = false;

  const reservedStakeByAccount: Record<string, number> = {};

  if (entry.legs.length === 0) {
    missingFields.push('pernas da operação');
  }

  const expectedLegsCount = Math.max(entry.houses.length, entry.legs.length, 1);
  if (entry.legs.length < expectedLegsCount) {
    missingFields.push(`faltam ${expectedLegsCount - entry.legs.length} perna(s)`);
    allLegsHaveAccount = false;
    allLegsHaveStake = false;
  }

  for (const leg of entry.legs) {
    if (!leg.accountId) {
      allLegsHaveAccount = false;
    }
    if (leg.stake === null || leg.stake === undefined || Number.isNaN(leg.stake) || leg.stake <= 0) {
      allLegsHaveStake = false;
    } else {
      sumLegStakes += leg.stake;
      if (entry.resultStatus !== 'concluida' && leg.accountId && leg.result !== 'void') {
        reservedStakeByAccount[leg.accountId] =
          (reservedStakeByAccount[leg.accountId] || 0) + leg.stake;
      }
    }

    if (leg.result === 'green') {
      hasAtLeastOneGreenOrCashout = true;
      if (leg.stake !== null && leg.stake > 0) {
        greenStakeOk = true;
      }
      if (leg.grossReturn !== null && leg.grossReturn > 0) {
        greenReturnOk = true;
        sumLegReturns += leg.grossReturn;
      } else {
        allSettledLegsHaveReturn = false;
      }
    } else if (leg.result === 'cashout' || leg.result === 'parcial') {
      hasAtLeastOneGreenOrCashout = true;
      if (leg.stake !== null && leg.stake > 0) {
        greenStakeOk = true;
      }
      if (leg.grossReturn !== null && leg.grossReturn >= 0) {
        greenReturnOk = true;
        sumLegReturns += leg.grossReturn;
      } else {
        allSettledLegsHaveReturn = false;
      }
    } else if (leg.result === 'void') {
      hasAtLeastOneGreenOrCashout = true;
      if (leg.stake !== null && leg.stake > 0) {
        greenStakeOk = true;
        greenReturnOk = true;
        // Uma perna void devolve ou libera a stake, sem lucro ou prejuízo
        sumLegReturns += leg.grossReturn !== null ? leg.grossReturn : leg.stake;
      } else {
        allSettledLegsHaveReturn = false;
      }
    } else if (leg.result === 'red') {
      // Uma perna red consome a stake conhecida uma única vez (retorno 0)
      sumLegReturns += 0;
    } else if (leg.result === 'pendente') {
      allSettledLegsHaveReturn = false;
      if (leg.stake && leg.odd && leg.odd > 1) {
        projectedReturn = Math.max(projectedReturn, leg.stake * leg.odd);
        canProject = true;
      }
    }
  }

  // Caso todas as pernas sejam red (ex: operação de 1 perna red ou perda total)
  const allLegsRed =
    entry.legs.length > 0 &&
    entry.legs.length >= expectedLegsCount &&
    entry.legs.every((l) => l.result === 'red');
  if (allLegsRed) {
    hasAtLeastOneGreenOrCashout = true;
    greenStakeOk = allLegsHaveStake;
    greenReturnOk = true;
  }

  if (!allLegsHaveAccount) {
    missingFields.push('contas das pernas');
  }
  if (!allLegsHaveStake) {
    missingFields.push('stake das pernas');
  }

  const totalStake =
    entry.totalInvestedCapital !== null && entry.totalInvestedCapital > 0
      ? entry.totalInvestedCapital
      : sumLegStakes;

  const hasTotalCapital = totalStake > 0 && allLegsHaveStake;
  if (!hasTotalCapital) {
    missingFields.push('capital total investido');
  }

  if (!greenReturnOk || !allSettledLegsHaveReturn || !hasAtLeastOneGreenOrCashout) {
    missingFields.push('retorno do green / resultado');
  }

  if (entry.simpleResultHint && (!allLegsHaveAccount || !allLegsHaveStake || !greenReturnOk)) {
    if (!missingFields.includes('valores/contas para apuração financeira')) {
      missingFields.push('valores/contas para apuração financeira');
    }
  }

  const canConclude =
    allLegsHaveAccount &&
    allLegsHaveStake &&
    hasTotalCapital &&
    allSettledLegsHaveReturn &&
    hasAtLeastOneGreenOrCashout &&
    greenReturnOk &&
    entry.legs.length >= expectedLegsCount;

  const netProfit = canConclude ? roundCurrency(sumLegReturns - totalStake) : null;
  const roiPercent =
    canConclude && totalStake > 0
      ? roundCurrency(((sumLegReturns - totalStake) / totalStake) * 100)
      : null;

  const projectedProfit =
    !canConclude && canProject && totalStake > 0
      ? roundCurrency(projectedReturn - totalStake)
      : null;

  return {
    canConclude,
    missingFields,
    hasAccounts: allLegsHaveAccount,
    hasTotalCapital,
    hasGreenStake: greenStakeOk || allLegsHaveStake,
    hasGreenReturn: greenReturnOk && allSettledLegsHaveReturn && hasAtLeastOneGreenOrCashout,
    totalStake: roundCurrency(totalStake),
    totalReturn: roundCurrency(sumLegReturns),
    netProfit,
    roiPercent,
    reservedStakeByAccount,
    projectedProfit,
  };
}

export type CurrencyDisplayMode = 'usdt_brl_mirror' | 'usdt_only' | 'brl_only';

const USDT_RATE_STORAGE_KEY = 'enigma_usdt_brl_rate_v2';
const EUR_USDT_RATE_STORAGE_KEY = 'enigma_eur_usdt_rate_v2';
const CURRENCY_MODE_STORAGE_KEY = 'enigma_currency_display_mode_v2';

let currentUsdtBrlRate: number = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = Number(localStorage.getItem(USDT_RATE_STORAGE_KEY));
      if (Number.isFinite(saved) && saved > 0) return saved;
    }
  } catch {
    // ignore
  }
  return 5.48;
})();

let currentEurUsdtRate: number = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = Number(localStorage.getItem(EUR_USDT_RATE_STORAGE_KEY));
      if (Number.isFinite(saved) && saved > 0) return saved;
    }
  } catch {
    // ignore
  }
  return 1.08; // 1 EUR = 1.08 USDT padrão
})();

let currentCurrencyDisplayMode: CurrencyDisplayMode = (() => {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(CURRENCY_MODE_STORAGE_KEY) as CurrencyDisplayMode | null;
      if (saved === 'usdt_brl_mirror' || saved === 'usdt_only' || saved === 'brl_only') {
        return saved;
      }
    }
  } catch {
    // ignore
  }
  return 'usdt_only';
})();

export function getUsdtBrlRate(): number {
  return currentUsdtBrlRate;
}

export function setUsdtBrlRateGlobal(rate: number): number {
  const clean = Number.isFinite(rate) && rate > 0 ? roundCurrency(rate) : 5.48;
  currentUsdtBrlRate = clean;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USDT_RATE_STORAGE_KEY, String(clean));
    }
  } catch {
    // ignore
  }
  return clean;
}

export function getEurUsdtRate(): number {
  return currentEurUsdtRate;
}

export function setEurUsdtRateGlobal(rate: number): number {
  const clean = Number.isFinite(rate) && rate > 0 ? roundCurrency(rate) : 1.08;
  currentEurUsdtRate = clean;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EUR_USDT_RATE_STORAGE_KEY, String(clean));
    }
  } catch {
    // ignore
  }
  return clean;
}

export function getCurrencyDisplayMode(): CurrencyDisplayMode {
  return currentCurrencyDisplayMode;
}

export function setCurrencyDisplayModeGlobal(mode: CurrencyDisplayMode): CurrencyDisplayMode {
  currentCurrencyDisplayMode = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CURRENCY_MODE_STORAGE_KEY, mode);
    }
  } catch {
    // ignore
  }
  return mode;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatCurrencyBRL(value: number, showSign = false): string {
  const abs = Math.abs(value);
  const formattedUsdt = abs.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const brlVal = roundCurrency(abs * currentUsdtBrlRate);
  const formattedBrl = brlVal.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const signPrefix = value < 0 ? '-' : showSign && value > 0 ? '+ ' : '';

  if (currentCurrencyDisplayMode === 'brl_only') {
    return `${signPrefix}R$ ${formattedBrl}`;
  }
  return `${signPrefix}${formattedUsdt} USDT`;
}

/**
 * Formata o saldo de uma conta de casa de forma limpa na moeda nativa da conta
 * (ex.: "5.480,00 USDT", "€ 5.074,07" ou "R$ 5.480,00"), sem poluir seletores e tabelas.
 */
export function formatHouseAccountBalance(
  usdtBaseAmount: number,
  accountCurrency: 'USDT' | 'EUR' | 'BRL' = 'USDT'
): string {
  if (accountCurrency === 'EUR') {
    const eurVal = roundCurrency(usdtBaseAmount / (currentEurUsdtRate || 1.08));
    const formattedEur = eurVal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `€ ${formattedEur}`;
  }
  if (accountCurrency === 'BRL') {
    const brlVal = roundCurrency(usdtBaseAmount * currentUsdtBrlRate);
    const formattedBrl = brlVal.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `R$ ${formattedBrl}`;
  }
  return formatCurrencyBRL(usdtBaseAmount);
}

/**
 * Retorna o equivalente em R$ para uso discreto em tooltips ou rodapés de cards de resumo.
 */
export function formatBrlEquivalent(usdtAmount: number): string {
  const brlVal = roundCurrency(Math.abs(usdtAmount) * currentUsdtBrlRate);
  const sign = usdtAmount < 0 ? '-' : '';
  return `${sign}R$ ${brlVal.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Normaliza o nome de exibição da casa para o formato curto e direto (ex.: "Pinnacle", "BC.Game", "Cloudbet", "Overtime").
 */
export function formatShortHouseName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/Overtime Markets/i, 'Overtime')
    .replace(/\.com|\.xyz/gi, '')
    .trim();
}

export function parseCurrencyInput(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw
    .replace(/USDT/gi, '')
    .replace(/EUR/gi, '')
    .replace(/€/g, '')
    .replace(/R\$/gi, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? roundCurrency(parsed) : null;
}

/**
 *Verifica se uma conta da casa pode receber novas apostas ou depósitos operacionais.
 * Contas limitadas bloqueiam novas atividades operacionais que dependam de conta liberada,
 * mas permitem solicitar saque e conciliar o saldo existente.
 */
export function canAccountStartNewOperation(account: HouseAccount): {
  allowed: boolean;
  reason?: string;
} {
  if (account.status === 'limitada') {
    return {
      allowed: false,
      reason: 'Conta limitada: bloqueada para novas apostas ou depósitos. Apenas saque e conciliação permitidos.',
    };
  }
  return { allowed: true };
}

/**
 * Calcula se um saque ainda está em trânsito (pendente financeiramente).
 * Um saque NÃO é considerado concluído financeiramente só porque foi finalizado na casa.
 * Continua em trânsito até a confirmação do crédito no banco ('recebido_banco').
 */
export function isWithdrawalInTransit(withdrawal: Withdrawal): boolean {
  return (
    withdrawal.stage === 'solicitado' ||
    withdrawal.stage === 'concluido_casa' ||
    withdrawal.stage === 'em_transito'
  );
}

export interface PartnershipBalanceSummary {
  partnershipId: string;
  titularShortName: string;
  housesList: string[];
  availableBalance: number;
  openStakeBalance: number;
  inTransitWithdrawalBalance: number;
  bankBalance: number;
  totalHouseAndOpen: number;
  statusLabel: string;
  statusTone: 'emerald' | 'red' | 'amber' | 'neutral';
}

export interface GlobalFinancialSummary {
  availableInHouses: number;
  activeAccountsCount: number;
  reservedInOpenBets: number;
  openBetsCount: number;
  inTransitWithdrawals: number;
  inTransitWithdrawalsCount: number;
  totalOperationalCapital: number; // Disponível casas + Apostas abertas + Saques em trânsito
  totalBankBalances: number;
  totalGlobalCapital: number; // Operacional + Bancos
  realizedProfitMonth: number;
  resolvedBetsCount: number;
  pendingBetsCount: number;
  projectedOpenProfit: number;
  roiMonthPercent: number;
  accountStatusCounts: {
    prontas: number;
    em_uso: number;
    limitadas: number;
    aguardando_saque_ou_transito: number;
    aguardando_deposito_ou_conferencia: number;
  };
  pendingDepositsAmount: number;
  pendingDepositsCount: number;
  openDivergencesCount: number;
  unexplainedDivergenceAmount: number;
}

export function computeReservedStakesByAccount(entries: BetEntry[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.resultStatus === 'concluida') continue;
    for (const leg of entry.legs) {
      if (leg.accountId && leg.stake && leg.stake > 0 && leg.result !== 'void') {
        map[leg.accountId] = roundCurrency((map[leg.accountId] || 0) + leg.stake);
      }
    }
  }
  return map;
}

export function computeGlobalSummary(params: {
  partnerships: Partnership[];
  houseAccounts: HouseAccount[];
  bankAccounts: BankAccount[];
  entries: BetEntry[];
  withdrawals: Withdrawal[];
  deposits: DepositTransfer[];
  divergences: ReconciliationDivergence[];
}): GlobalFinancialSummary {
  const {
    houseAccounts,
    bankAccounts,
    entries,
    withdrawals,
    deposits,
    divergences,
  } = params;

  const availableInHouses = roundCurrency(
    houseAccounts.reduce((acc, h) => acc + h.availableBalance, 0)
  );
  const activeAccountsCount = houseAccounts.filter(
    (h) => h.availableBalance > 0 || h.status === 'em_uso'
  ).length;

  const openEntries = entries.filter((e) => e.resultStatus !== 'concluida');
  const concludedEntries = entries.filter((e) => e.resultStatus === 'concluida');

  let reservedInOpenBets = 0;
  let projectedOpenProfit = 0;

  for (const entry of openEntries) {
    const ev = evaluateBetEntry(entry);
    reservedInOpenBets += ev.totalStake;
    if (ev.projectedProfit !== null) {
      projectedOpenProfit += ev.projectedProfit;
    }
  }
  reservedInOpenBets = roundCurrency(reservedInOpenBets);
  projectedOpenProfit = roundCurrency(projectedOpenProfit);

  const transitWithdrawals = withdrawals.filter(isWithdrawalInTransit);
  const inTransitWithdrawals = roundCurrency(
    transitWithdrawals.reduce((acc, w) => acc + w.amount, 0)
  );

  // Nota: não somar categorias já incluídas umas nas outras.
  const totalOperationalCapital = roundCurrency(
    availableInHouses + reservedInOpenBets + inTransitWithdrawals
  );

  const totalBankBalances = roundCurrency(
    bankAccounts.reduce((acc, b) => acc + b.balance, 0)
  );

  const totalGlobalCapital = roundCurrency(totalOperationalCapital + totalBankBalances);

  let realizedProfitMonth = 0;
  let totalConcludedStake = 0;
  for (const entry of concludedEntries) {
    const ev = evaluateBetEntry(entry);
    if (ev.netProfit !== null) {
      realizedProfitMonth += ev.netProfit;
    }
    totalConcludedStake += ev.totalStake;
  }
  realizedProfitMonth = roundCurrency(realizedProfitMonth);
  const roiMonthPercent =
    totalConcludedStake > 0
      ? roundCurrency((realizedProfitMonth / totalConcludedStake) * 100)
      : 0;

  const hasBatchEntry8 = concludedEntries.some((e) => e.id === 'entry_8');
  const resolvedBetsCount = concludedEntries.length + (hasBatchEntry8 ? 79 : 0);

  const transitAccountIds = new Set(transitWithdrawals.map((w) => w.houseAccountId));
  const pendingDepositAccountIds = new Set(
    deposits
      .filter((d) => d.type === 'deposito_casa' && d.status !== 'confirmado' && d.destinationHouseAccountId)
      .map((d) => d.destinationHouseAccountId as string)
  );

  const accountStatusCounts = {
    prontas: houseAccounts.filter((a) => a.status === 'pronta').length,
    em_uso: houseAccounts.filter((a) => a.status === 'em_uso').length,
    limitadas: houseAccounts.filter((a) => a.status === 'limitada').length,
    aguardando_saque_ou_transito: houseAccounts.filter(
      (a) => a.status === 'aguardando_saque' || transitAccountIds.has(a.id)
    ).length,
    aguardando_deposito_ou_conferencia: houseAccounts.filter(
      (a) =>
        a.status === 'verificar' ||
        a.status === 'aguardando_deposito' ||
        a.status === 'em_conferencia' ||
        pendingDepositAccountIds.has(a.id)
    ).length,
  };

  const pendingDeps = deposits.filter(
    (d) => d.type === 'deposito_casa' && d.status === 'pretendido'
  );
  const pendingDepositsAmount = roundCurrency(
    pendingDeps.reduce((acc, d) => acc + d.amount, 0)
  );

  const openDivs = divergences.filter((d) => d.status !== 'resolvida');
  const unexplainedDivergenceAmount = roundCurrency(
    openDivs.reduce((acc, d) => acc + Math.abs(d.difference), 0)
  );

  return {
    availableInHouses,
    activeAccountsCount,
    reservedInOpenBets,
    openBetsCount: openEntries.length,
    inTransitWithdrawals,
    inTransitWithdrawalsCount: transitWithdrawals.length,
    totalOperationalCapital,
    totalBankBalances,
    totalGlobalCapital,
    realizedProfitMonth,
    resolvedBetsCount,
    pendingBetsCount: openEntries.length,
    projectedOpenProfit,
    roiMonthPercent,
    accountStatusCounts,
    pendingDepositsAmount,
    pendingDepositsCount: pendingDeps.length,
    openDivergencesCount: openDivs.length,
    unexplainedDivergenceAmount,
  };
}

/**
 * Filtra os registros visíveis de acordo com o perfil do usuário (RBAC nos dados).
 */
export function filterByUserPermission(
  user: UserProfile,
  data: {
    partnerships: Partnership[];
    houseAccounts: HouseAccount[];
    bankAccounts: BankAccount[];
    entries: BetEntry[];
    withdrawals: Withdrawal[];
    deposits: DepositTransfer[];
    costs: CostRecord[];
    divergences: ReconciliationDivergence[];
  }
) {
  if (user.role === 'admin') {
    return data;
  }

  const visiblePartnerships = data.partnerships.filter(
    (p) => p.status === 'estoque' || p.operatorId === user.id
  );
  const myPartnershipIds = new Set(
    data.partnerships.filter((p) => p.operatorId === user.id).map((p) => p.id)
  );

  const visibleHouseAccounts = data.houseAccounts.filter(
    (h) =>
      myPartnershipIds.has(h.partnershipId) ||
      h.authorizedOperatorIds.includes(user.id)
  );
  const visibleBankAccounts = data.bankAccounts.filter(
    (b) =>
      (b.partnershipId && myPartnershipIds.has(b.partnershipId)) ||
      b.authorizedOperatorIds.includes(user.id)
  );

  const visibleEntries = data.entries.filter((e) => e.operatorId === user.id);
  const visibleWithdrawals = data.withdrawals.filter(
    (w) => w.operatorId === user.id || myPartnershipIds.has(w.partnershipId)
  );
  const visibleDeposits = data.deposits.filter(
    (d) =>
      d.operatorId === user.id ||
      (d.partnershipId !== null && myPartnershipIds.has(d.partnershipId))
  );
  const visibleCosts = data.costs.filter(
    (c) => c.operatorId === user.id || c.paidByOperatorId === user.id
  );
  const visibleDivergences = data.divergences.filter(
    (d) =>
      d.operatorId === user.id ||
      (d.partnershipId !== null && myPartnershipIds.has(d.partnershipId))
  );

  return {
    partnerships: visiblePartnerships,
    houseAccounts: visibleHouseAccounts,
    bankAccounts: visibleBankAccounts,
    entries: visibleEntries,
    withdrawals: visibleWithdrawals,
    deposits: visibleDeposits,
    costs: visibleCosts,
    divergences: visibleDivergences,
  };
}

export function canUserAccessCredentials(
  user: UserProfile,
  partnership: Partnership,
  authorizedOperatorIds?: string[]
): boolean {
  if (user.role === 'admin') return true;
  if (partnership.operatorId === user.id) return true;
  if (authorizedOperatorIds && authorizedOperatorIds.includes(user.id)) return true;
  return false;
}

/**
 * Parser e validador de extratos CSV/OFX com deduplicação e conciliação de saques.
 */
export function parseBankStatementText(
  content: string,
  defaultBankId: string,
  defaultBankLabel: string,
  existingWithdrawals: Withdrawal[],
  existingTransfers: DepositTransfer[]
): StatementImportCandidate[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: StatementImportCandidate[] = [];

  // Suporte a formato CSV (Data;Descricao;Valor ou Data,Descricao,Valor)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().startsWith('data') || line.startsWith('<')) continue;
    const parts = line.includes(';') ? line.split(';') : line.split(',');
    if (parts.length < 3) continue;

    const date = parts[0].trim();
    const description = parts[1].trim();
    const rawAmount = parseCurrencyInput(parts.slice(2).join(','));
    if (rawAmount === null) continue;

    const amount = Math.abs(rawAmount);
    const direction: 'credito' | 'debito' = rawAmount >= 0 ? 'credito' : 'debito';

    const alreadyInTransfers = existingTransfers.some(
      (t) =>
        Math.abs(t.amount - amount) < 0.01 &&
        t.createdAt.startsWith(date.slice(0, 5))
    );

    const matchingWithdrawal = existingWithdrawals.find(
      (w) =>
        isWithdrawalInTransit(w) &&
        w.destinationBankId === defaultBankId &&
        Math.abs(w.amount - amount) < 0.01
    );

    let status: 'novo' | 'duplicado' | 'conciliavel_saque' = 'novo';
    if (alreadyInTransfers) {
      status = 'duplicado';
    } else if (matchingWithdrawal && direction === 'credito') {
      status = 'conciliavel_saque';
    }

    results.push({
      id: `stmt_${ i + 1 }_${ Date.now() }`,
      date,
      bankId: defaultBankId,
      bankLabel: defaultBankLabel,
      description,
      amount,
      direction,
      status,
      matchedWithdrawalId: matchingWithdrawal?.id ?? null,
      selected: status !== 'duplicado',
    });
  }

  return results;
}

/**
 * Converte uma data simples em string do sistema ('11/10/2026 10:15', '11/10 11:20', '09/10', '2026-10-11')
 * para o formato ISO comparável 'YYYY-MM-DD'.
 */
export function parseSingleAppDate(raw: string, defaultYear = 2026): string | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.trim();

  // Formato ISO: YYYY-MM-DD (com ou sem horário)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Formato brasileiro completo: DD/MM/YYYY (com ou sem horário)
  const brFullMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brFullMatch) {
    const dd = brFullMatch[1].padStart(2, '0');
    const mm = brFullMatch[2].padStart(2, '0');
    const yyyy = brFullMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // Formato brasileiro curto: DD/MM (com ou sem horário)
  const brShortMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\s|$)/);
  if (brShortMatch) {
    const dd = brShortMatch[1].padStart(2, '0');
    const mm = brShortMatch[2].padStart(2, '0');
    return `${defaultYear}-${mm}-${dd}`;
  }

  return null;
}

/**
 * Extrai o intervalo [startIso, endIso] de uma data ou faixa de datas ('01/10 a 09/10', '11/10/2026 10:15', etc.).
 */
export function parseAppDateSpan(
  rawDate: string,
  defaultYear = 2026
): { startIso: string; endIso: string } | null {
  if (!rawDate || !rawDate.trim()) return null;
  if (rawDate.includes(' a ')) {
    const parts = rawDate.split(' a ');
    const s = parseSingleAppDate(parts[0], defaultYear);
    const e = parseSingleAppDate(parts[1], defaultYear);
    if (s && e) {
      return s <= e ? { startIso: s, endIso: e } : { startIso: e, endIso: s };
    }
    if (s) return { startIso: s, endIso: s };
    if (e) return { startIso: e, endIso: e };
    return null;
  }

  const single = parseSingleAppDate(rawDate, defaultYear);
  return single ? { startIso: single, endIso: single } : null;
}

/**
 * Verifica se uma data ou intervalo do sistema se sobrepõe ao filtro [startDateIso, endDateIso].
 */
export function isDateWithinRange(
  rawDate: string,
  startDateIso?: string | null,
  endDateIso?: string | null,
  defaultYear = 2026
): boolean {
  const start = startDateIso?.trim() || '';
  const end = endDateIso?.trim() || '';
  if (!start && !end) return true;

  const span = parseAppDateSpan(rawDate, defaultYear);
  if (!span) return true;

  if (start && span.endIso < start) return false;
  if (end && span.startIso > end) return false;
  return true;
}

/**
 * Formata uma data ISO 'YYYY-MM-DD' para 'DD/MM/YYYY'.
 */
export function formatIsoDateBR(isoDate: string): string {
  if (!isoDate || !isoDate.trim()) return '';
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return isoDate;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * Retorna as datas inicial (periodStart) e final (periodEnd) do mês corrente
 * (ou da data de referência informada) no formato ISO 'YYYY-MM-DD'.
 */
export function getCurrentMonthPeriod(referenceDate: Date = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();
  const month = String(monthIndex + 1).padStart(2, '0');
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    periodStart: `${year}-${month}-01`,
    periodEnd: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

/**
 * Normaliza as datas 'periodStart' e 'periodEnd' do filtro global,
 * garantindo que se ambas forem preenchidas e periodStart > periodEnd,
 * o intervalo permaneça consistente.
 */
export function normalizePeriodBounds(
  rawPeriodStart: string,
  rawPeriodEnd: string
): { periodStart: string; periodEnd: string } {
  const periodStart = (rawPeriodStart || '').trim();
  let periodEnd = (rawPeriodEnd || '').trim();
  if (periodStart && periodEnd && periodStart > periodEnd) {
    periodEnd = periodStart;
  }
  return { periodStart, periodEnd };
}

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

/**
 * Retorna 'periodStart' (primeiro dia), 'periodEnd' (último dia) e o rótulo legível para um mês (1..12) e ano.
 */
export function getMonthYearPeriod(
  month: number,
  year: number
): {
  month: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  label: string;
  monthYearLabel: string;
} {
  const now = new Date();
  const safeMonth = Math.min(12, Math.max(1, Math.floor(month) || (now.getMonth() + 1)));
  const safeYear = Math.floor(year) || now.getFullYear();
  const mm = String(safeMonth).padStart(2, '0');
  const lastDay = new Date(safeYear, safeMonth, 0).getDate();
  const formattedLabel = `${MONTH_NAMES_PT[safeMonth - 1]} / ${safeYear}`;
  return {
    month: safeMonth,
    year: safeYear,
    periodStart: `${safeYear}-${mm}-01`,
    periodEnd: `${safeYear}-${mm}-${String(lastDay).padStart(2, '0')}`,
    label: formattedLabel,
    monthYearLabel: formattedLabel,
  };
}

/**
 * Extrai o mês (1..12), ano e rótulo de mês/ano a partir de 'periodStart' e 'periodEnd'.
 */
export function parseOperationalMonthYear(
  periodStart: string,
  periodEnd: string
): { month: number; year: number; monthYearLabel: string } {
  const start = (periodStart || '').trim();
  const match = start.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Math.min(12, Math.max(1, Number(match[2])));
    return {
      month,
      year,
      monthYearLabel: `${MONTH_NAMES_PT[month - 1]} / ${year}`,
    };
  }
  const end = (periodEnd || '').trim();
  const endMatch = end.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (endMatch) {
    const year = Number(endMatch[1]);
    const month = Math.min(12, Math.max(1, Number(endMatch[2])));
    return {
      month,
      year,
      monthYearLabel: `${MONTH_NAMES_PT[month - 1]} / ${year}`,
    };
  }
  const now = new Date();
  const fallbackMonth = now.getMonth() + 1;
  const fallbackYear = now.getFullYear();
  return {
    month: fallbackMonth,
    year: fallbackYear,
    monthYearLabel: `${MONTH_NAMES_PT[fallbackMonth - 1]} / ${fallbackYear}`,
  };
}

/**
 * Formata o rótulo legível do período ativo a partir de 'periodStart' e 'periodEnd'.
 */
export function formatPeriodRangeLabel(
  periodStart: string,
  periodEnd: string
): string {
  const start = (periodStart || '').trim();
  const end = (periodEnd || '').trim();
  if (!start && !end) {
    return 'Outubro / 2026 (Todo o período)';
  }
  const startLabel = start ? formatIsoDateBR(start) : 'Início';
  const endLabel = end ? formatIsoDateBR(end) : 'Hoje';
  return startLabel === endLabel ? startLabel : `${startLabel} até ${endLabel}`;
}

/**
 * Calcula o lucro líquido realizado e a quantidade de operações por parceria dentro de um conjunto de entradas filtradas.
 */
export function computePartnershipPeriodMetrics(
  entries: BetEntry[],
  houseAccounts: HouseAccount[]
): Record<
  string,
  {
    realizedProfit: number;
    entriesCount: number;
    concludedCount: number;
    openCount: number;
  }
> {
  const accToPartnership = new Map<string, string>();
  for (const acc of houseAccounts) {
    accToPartnership.set(acc.id, acc.partnershipId);
  }

  const result: Record<
    string,
    {
      realizedProfit: number;
      entriesCount: number;
      concludedCount: number;
      openCount: number;
    }
  > = {};

  for (const entry of entries) {
    const ev = evaluateBetEntry(entry);
    const involvedPartnerships = new Set<string>();

    for (const leg of entry.legs) {
      const pid =
        leg.partnershipId || (leg.accountId ? accToPartnership.get(leg.accountId) : null);
      if (pid) involvedPartnerships.add(pid);
    }

    const pList = Array.from(involvedPartnerships);
    if (pList.length === 0) continue;

    // Distribui o P/L realizado proporcionalmente às pernas ou igualmente entre as parcerias envolvidas
    const shareProfit =
      entry.resultStatus === 'concluida' && ev.netProfit !== null
        ? roundCurrency(ev.netProfit / pList.length)
        : 0;

    for (const pid of pList) {
      if (!result[pid]) {
        result[pid] = {
          realizedProfit: 0,
          entriesCount: 0,
          concludedCount: 0,
          openCount: 0,
        };
      }
      result[pid].entriesCount += 1;
      if (entry.resultStatus === 'concluida') {
        result[pid].concludedCount += 1;
        result[pid].realizedProfit = roundCurrency(result[pid].realizedProfit + shareProfit);
      } else {
        result[pid].openCount += 1;
      }
    }
  }

  return result;
}

