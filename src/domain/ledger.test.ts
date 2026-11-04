import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccountStartNewOperation,
  canUserAccessCredentials,
  computeGlobalSummary,
  computePartnershipPeriodMetrics,
  evaluateBetEntry,
  filterByUserPermission,
  formatIsoDateBR,
  formatPeriodRangeLabel,
  getCurrentMonthPeriod,
  getMonthYearPeriod,
  isDateWithinRange,
  isWithdrawalInTransit,
  normalizePeriodBounds,
  parseAppDateSpan,
  parseBankStatementText,
  parseCurrencyInput,
  parseOperationalMonthYear,
} from './ledger.ts';
import type { BetEntry, HouseAccount, Partnership, UserProfile, Withdrawal } from './types.ts';

test('evaluateBetEntry calculates green leg net profit accurately and keeps incomplete entries pending', () => {
  const incompleteEntry: BetEntry = {
    id: 'e1',
    mode: 'rapido',
    operationType: 'ao_vivo',
    houses: ['Pinnacle', 'Betão'],
    event: 'Keila - BK Opava',
    market: '',
    createdAt: '11/10/2026 11:20',
    concludedAt: null,
    operatorId: 'op_a',
    origin: 'Manual',
    totalInvestedCapital: 5000,
    resultStatus: 'aguardando_detalhamento',
    reconciliationStatus: 'pendente_apuracao',
    simpleResultHint: null,
    notes: '',
    legs: [
      {
        id: 'l1',
        label: 'Perna Green',
        houseName: 'Pinnacle',
        partnershipId: 'p_joao',
        accountId: 'acc_pin_joao',
        selection: '',
        odd: null,
        stake: 2600,
        result: 'green',
        grossReturn: null,
        createdAt: '11/10/2026 11:20',
      },
      {
        id: 'l2',
        label: 'Perna Red',
        houseName: 'Betão',
        partnershipId: 'p_maria',
        accountId: 'acc_betao_maria',
        selection: '',
        odd: null,
        stake: 2400,
        result: 'red',
        grossReturn: 0,
        createdAt: '11/10/2026 11:20',
      },
    ],
  };

  const evalIncomplete = evaluateBetEntry(incompleteEntry);
  assert.equal(evalIncomplete.canConclude, false);
  assert.equal(evalIncomplete.hasAccounts, true);
  assert.equal(evalIncomplete.hasTotalCapital, true);
  assert.equal(evalIncomplete.hasGreenStake, true);
  assert.equal(evalIncomplete.hasGreenReturn, false);
  assert.equal(evalIncomplete.netProfit, null);
  assert.equal(evalIncomplete.reservedStakeByAccount['acc_pin_joao'], 2600);
  assert.equal(evalIncomplete.reservedStakeByAccount['acc_betao_maria'], 2400);

  // Now complete the green return
  const completedEntry: BetEntry = {
    ...incompleteEntry,
    legs: [
      {
        ...incompleteEntry.legs[0],
        grossReturn: 5180,
      },
      incompleteEntry.legs[1],
    ],
  };

  const evalComplete = evaluateBetEntry(completedEntry);
  assert.equal(evalComplete.canConclude, true);
  assert.equal(evalComplete.totalStake, 5000);
  assert.equal(evalComplete.totalReturn, 5180);
  assert.equal(evalComplete.netProfit, 180);
  assert.equal(evalComplete.roiPercent, 3.6);
});

test('evaluateBetEntry handles void leg (returns stake with 0 profit/loss) and cashout leg (uses received value)', () => {
  const voidEntry: BetEntry = {
    id: 'e_void',
    mode: 'detalhado',
    operationType: 'pre_jogo',
    houses: ['Pinnacle'],
    event: 'Jogo X',
    market: 'Over 2.5',
    createdAt: '10/10/2026 15:00',
    concludedAt: '10/10/2026 17:00',
    operatorId: 'op_a',
    origin: 'Manual',
    totalInvestedCapital: 1000,
    resultStatus: 'concluida',
    reconciliationStatus: 'conciliada',
    simpleResultHint: null,
    notes: '',
    legs: [
      {
        id: 'l_v1',
        label: 'Perna Única',
        houseName: 'Pinnacle',
        partnershipId: 'p_joao',
        accountId: 'acc_pin_joao',
        selection: 'Over 2.5',
        odd: 1.95,
        stake: 1000,
        result: 'void',
        grossReturn: null,
        createdAt: '10/10/2026 15:00',
      },
    ],
  };

  const evalVoid = evaluateBetEntry(voidEntry);
  assert.equal(evalVoid.canConclude, true);
  assert.equal(evalVoid.totalReturn, 1000);
  assert.equal(evalVoid.netProfit, 0);

  const cashoutEntry: BetEntry = {
    ...voidEntry,
    id: 'e_cashout',
    operationType: 'cashout',
    totalInvestedCapital: 1776,
    legs: [
      {
        ...voidEntry.legs[0],
        stake: 1776,
        result: 'cashout',
        grossReturn: 1737.62,
      },
    ],
  };

  const evalCashout = evaluateBetEntry(cashoutEntry);
  assert.equal(evalCashout.canConclude, true);
  assert.equal(evalCashout.netProfit, -38.38);
});

test('withdrawal remains in transit until bank receipt confirmation', () => {
  const baseW: Withdrawal = {
    id: 'w1',
    houseAccountId: 'acc_kto_joao',
    partnershipId: 'p_joao',
    destinationBankId: 'bank_pg_joao',
    amount: 3200,
    receivedAmount: null,
    feeAmount: 0,
    facialCosts: [8],
    noCostConfirmed: false,
    stage: 'solicitado',
    issueType: 'nenhum',
    issueNotes: '',
    priority: 'media',
    requestedAt: '10/10/2026 18:02',
    houseCompletedAt: null,
    bankReceivedAt: null,
    hoursElapsed: 17,
    operatorId: 'op_a',
  };

  assert.equal(isWithdrawalInTransit(baseW), true);
  assert.equal(isWithdrawalInTransit({ ...baseW, stage: 'concluido_casa' }), true);
  assert.equal(isWithdrawalInTransit({ ...baseW, stage: 'em_transito' }), true);
  assert.equal(isWithdrawalInTransit({ ...baseW, stage: 'recebido_banco' }), false);
  assert.equal(isWithdrawalInTransit({ ...baseW, stage: 'devolvido_casa' }), false);
});

test('limited house account blocks new operational bets/deposits while allowing withdrawal & reconciliation', () => {
  const limitedAcc: HouseAccount = {
    id: 'acc_bet365_carlos',
    partnershipId: 'p_carlos',
    houseName: 'Bet365',
    cloneGroup: 'Sem clones',
    label: 'Bet365 · Carlos',
    status: 'limitada',
    login: 'carlos.op',
    passwordSecret: 'segredo123',
    availableBalance: 640,
    informedRealBalance: null,
    lastReconciledAt: null,
    weeklyFacialDue: null,
    weeklyFacialPending: false,
    notes: '',
    authorizedOperatorIds: ['op_a'],
  };

  const check = canAccountStartNewOperation(limitedAcc);
  assert.equal(check.allowed, false);
  assert.ok(check.reason?.includes('Conta limitada'));
});

test('operational account isolation: stock and inactive partnerships are filtered out of live operations', () => {
  const activePartnership: Partnership = {
    id: 'p_active',
    code: 'PARC-001',
    titularName: 'Maria Silva',
    shortName: 'Maria',
    cpf: '111',
    birthDate: '01/01/1990',
    address: 'Rua 1',
    emailOperation: 'maria@op.com',
    emailPersonal: 'maria@gmail.com',
    phones: '119999',
    chipLocation: 'Chip 1',
    referral: 'Indicação',
    period: 'Outubro/2026',
    status: 'ativa',
    origin: 'atendimento',
    createdAt: '01/10/2026',
    operatorId: 'op_a',
    paidByOperatorId: 'op_a',
    creationCost: 200,
    creationCostCharged: true,
    reimbursementDueToOperatorId: null,
    reimbursementAmount: 0,
    reimbursementSettled: true,
    pixWithdrawals: 'maria@op.com',
    pixPayments: '111',
    notes: '',
    assignmentHistory: [],
  };

  const stockPartnership: Partnership = {
    ...activePartnership,
    id: 'p_stock',
    status: 'estoque',
    titularName: 'Estoque 14',
    operatorId: null,
  };

  const accActive: HouseAccount = {
    id: 'acc_1',
    partnershipId: 'p_active',
    houseName: 'Pinnacle',
    cloneGroup: 'Sem clones',
    label: 'Pinnacle · Maria',
    status: 'pronta',
    login: 'pin.maria',
    passwordSecret: 'pass123',
    availableBalance: 1500,
    informedRealBalance: 1500,
    lastReconciledAt: '11/10/2026',
    weeklyFacialDue: null,
    weeklyFacialPending: false,
    notes: '',
    authorizedOperatorIds: ['op_a'],
  };

  const accStock: HouseAccount = {
    ...accActive,
    id: 'acc_2',
    partnershipId: 'p_stock',
    label: 'Pinnacle · Estoque 14',
  };

  const partnerships = [activePartnership, stockPartnership];
  const allAccounts = [accActive, accStock];

  const activeIds = new Set(partnerships.filter((p) => p.status === 'ativa').map((p) => p.id));
  const operationalAccounts = allAccounts.filter((a) => activeIds.has(a.partnershipId));

  assert.equal(operationalAccounts.length, 1);
  assert.equal(operationalAccounts[0].id, 'acc_1');
  assert.equal(operationalAccounts[0].partnershipId, 'p_active');
});

test('RBAC permissions isolate operator partnerships, accounts, and credentials', () => {
  const opA: UserProfile = {
    id: 'op_a',
    name: 'Operador A',
    shortName: 'Operador A',
    login: 'operador.a',
    email: 'operador.a@enigma.com',
    status: 'ativo',
    role: 'operador',
    companyId: 'enigma',
    profitSharePercent: 50,
    initialMonthlyBalance: 20000,
  };
  const opB: UserProfile = {
    id: 'op_b',
    name: 'Operador B',
    shortName: 'Operador B',
    login: 'operador.b',
    email: 'operador.b@enigma.com',
    status: 'ativo',
    role: 'operador',
    companyId: 'enigma',
    profitSharePercent: 50,
    initialMonthlyBalance: 15000,
  };

  const pA: Partnership = {
    id: 'p_a',
    code: 'PAR-01',
    titularName: 'Titular A',
    shortName: 'Titular A',
    cpf: '000.000.000-01',
    birthDate: '01/01/1998',
    address: 'Rua A',
    emailOperation: 'a@op.com',
    emailPersonal: 'a@p.com',
    phones: '1199999999',
    chipLocation: 'Gaveta 1',
    referral: '',
    period: 'Outubro',
    status: 'ativa',
    origin: 'atendimento',
    createdAt: '01/10/2026',
    operatorId: 'op_a',
    paidByOperatorId: 'op_a',
    creationCost: 150,
    creationCostCharged: true,
    reimbursementDueToOperatorId: null,
    reimbursementAmount: 0,
    reimbursementSettled: true,
    pixWithdrawals: 'a@op.com',
    pixPayments: '000.000.000-01',
    notes: '',
    assignmentHistory: [],
  };

  const pB: Partnership = {
    ...pA,
    id: 'p_b',
    operatorId: 'op_b',
  };

  assert.equal(canUserAccessCredentials(opA, pA), true);
  assert.equal(canUserAccessCredentials(opA, pB), false);

  const filteredForA = filterByUserPermission(opA, {
    partnerships: [pA, pB],
    houseAccounts: [],
    bankAccounts: [],
    entries: [],
    withdrawals: [],
    deposits: [],
    costs: [],
    divergences: [],
  });

  assert.equal(filteredForA.partnerships.length, 1);
  assert.equal(filteredForA.partnerships[0].id, 'p_a');
});

test('parseBankStatementText deduplicates existing transfers and matches in-transit withdrawals', () => {
  const csv = `Data;Descricao;Valor
11/10/2026;PIX RECEBIDO KTO JOAO;3.200,00
09/10/2026;TRANSFERENCIA BANCO ENIGMA;6.500,00`;

  const candidates = parseBankStatementText(
    csv,
    'bank_pg_joao',
    'PGBank · João',
    [
      {
        id: 'w_kto',
        houseAccountId: 'acc_kto_joao',
        partnershipId: 'p_joao',
        destinationBankId: 'bank_pg_joao',
        amount: 3200,
        receivedAmount: null,
        feeAmount: 0,
        facialCosts: [8],
        noCostConfirmed: false,
        stage: 'concluido_casa',
        issueType: 'nenhum',
        issueNotes: '',
        priority: 'media',
        requestedAt: '10/10/2026 18:02',
        houseCompletedAt: '10/10/2026 19:00',
        bankReceivedAt: null,
        hoursElapsed: 17,
        operatorId: 'op_a',
      },
    ],
    [
      {
        id: 't_existing',
        type: 'transferencia_bancos',
        originBankId: 'bank_pg_joao',
        destinationHouseAccountId: null,
        destinationBankId: 'bank_enigma',
        partnershipId: 'p_joao',
        amount: 6500,
        feeAmount: 0,
        status: 'confirmado',
        createdAt: '09/10/2026',
        confirmedAt: '09/10/2026',
        operatorId: 'op_a',
        originTag: 'Extrato importado',
        notes: '',
      },
    ]
  );

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].status, 'conciliavel_saque');
  assert.equal(candidates[0].matchedWithdrawalId, 'w_kto');
  assert.equal(candidates[1].status, 'duplicado');
  assert.equal(candidates[1].selected, false);
  assert.equal(parseCurrencyInput('R$ 12.480,50'), 12480.5);
});

test('isDateWithinRange filters Brazilian dates, short dates, and date spans accurately', () => {
  assert.deepEqual(parseAppDateSpan('11/10/2026 11:20'), {
    startIso: '2026-10-11',
    endIso: '2026-10-11',
  });
  assert.deepEqual(parseAppDateSpan('09/10 16:40'), {
    startIso: '2026-10-09',
    endIso: '2026-10-09',
  });
  assert.deepEqual(parseAppDateSpan('01/10 a 09/10'), {
    startIso: '2026-10-01',
    endIso: '2026-10-09',
  });

  // Filtrando apenas dia 11/10/2026
  assert.equal(isDateWithinRange('11/10/2026 10:15', '2026-10-11', '2026-10-11'), true);
  assert.equal(isDateWithinRange('09/10 16:40', '2026-10-11', '2026-10-11'), false);
  assert.equal(isDateWithinRange('01/10 a 09/10', '2026-10-11', '2026-10-11'), false);

  // Filtrando primeira dezena 01/10 a 09/10
  assert.equal(isDateWithinRange('09/10 16:40', '2026-10-01', '2026-10-09'), true);
  assert.equal(isDateWithinRange('01/10 a 09/10', '2026-10-01', '2026-10-09'), true);
  assert.equal(isDateWithinRange('11/10/2026 10:15', '2026-10-01', '2026-10-09'), false);

  assert.equal(formatIsoDateBR('2026-10-11'), '11/10/2026');
});

test('computePartnershipPeriodMetrics distributes realized profit and counts across partnerships in period', () => {
  const houseAccounts: HouseAccount[] = [
    {
      id: 'acc_pin_joao',
      partnershipId: 'parc_joao',
      houseName: 'Pinnacle',
      cloneGroup: 'Sem clones',
      label: 'Pinnacle · João',
      status: 'em_uso',
      login: 'joao',
      passwordSecret: '123',
      availableBalance: 10000,
      informedRealBalance: null,
      lastReconciledAt: null,
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: ['op_a'],
    },
    {
      id: 'acc_kto_maria',
      partnershipId: 'parc_maria',
      houseName: 'KTO',
      cloneGroup: 'Clone 2',
      label: 'KTO · Maria',
      status: 'em_uso',
      login: 'maria',
      passwordSecret: '123',
      availableBalance: 8000,
      informedRealBalance: null,
      lastReconciledAt: null,
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const entries: BetEntry[] = [
    {
      id: 'e_concluded',
      mode: 'detalhado',
      operationType: 'pre_jogo',
      houses: ['Pinnacle', 'KTO'],
      event: 'Jogo 1',
      market: 'ML',
      createdAt: '11/10/2026 10:15',
      concludedAt: '11/10/2026 12:00',
      operatorId: 'op_a',
      origin: 'Manual',
      totalInvestedCapital: 5000,
      resultStatus: 'concluida',
      reconciliationStatus: 'conciliada',
      simpleResultHint: 'green',
      notes: 'Concluída',
      legs: [
        {
          id: 'l1',
          label: 'Perna 1',
          houseName: 'Pinnacle',
          partnershipId: 'parc_joao',
          accountId: 'acc_pin_joao',
          selection: 'A',
          odd: 2.0,
          stake: 2600,
          result: 'green',
          grossReturn: 5200,
          createdAt: '11/10/2026 10:15',
        },
        {
          id: 'l2',
          label: 'Perna 2',
          houseName: 'KTO',
          partnershipId: 'parc_maria',
          accountId: 'acc_kto_maria',
          selection: 'B',
          odd: 2.0,
          stake: 2400,
          result: 'red',
          grossReturn: 0,
          createdAt: '11/10/2026 10:15',
        },
      ],
    },
  ];

  const metrics = computePartnershipPeriodMetrics(entries, houseAccounts);
  assert.equal(metrics.parc_joao.entriesCount, 1);
  assert.equal(metrics.parc_joao.concludedCount, 1);
  assert.equal(metrics.parc_joao.realizedProfit, 100);
  assert.equal(metrics.parc_maria.realizedProfit, 100);
});

test('normalizePeriodBounds and formatPeriodRangeLabel keep periodStart and periodEnd consistent', () => {
  assert.deepEqual(normalizePeriodBounds('2026-10-01', '2026-10-09'), {
    periodStart: '2026-10-01',
    periodEnd: '2026-10-09',
  });
  assert.deepEqual(normalizePeriodBounds('2026-10-11', '2026-10-05'), {
    periodStart: '2026-10-11',
    periodEnd: '2026-10-11',
  });
  assert.equal(formatPeriodRangeLabel('', ''), 'Outubro / 2026 (Todo o período)');
  assert.equal(formatPeriodRangeLabel('2026-10-11', '2026-10-11'), '11/10/2026');
  assert.equal(
    formatPeriodRangeLabel('2026-10-01', '2026-10-09'),
    '01/10/2026 até 09/10/2026'
  );
});

test('getCurrentMonthPeriod returns first and last day of current month', () => {
  assert.deepEqual(getCurrentMonthPeriod(new Date(2026, 9, 20)), {
    periodStart: '2026-10-01',
    periodEnd: '2026-10-31',
  });
  assert.deepEqual(getCurrentMonthPeriod(new Date(2026, 1, 15)), {
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
  });
});

test('getMonthYearPeriod and parseOperationalMonthYear compute operational month and year accurately', () => {
  const oct2026 = getMonthYearPeriod(10, 2026);
  assert.equal(oct2026.month, 10);
  assert.equal(oct2026.year, 2026);
  assert.equal(oct2026.periodStart, '2026-10-01');
  assert.equal(oct2026.periodEnd, '2026-10-31');
  assert.equal(oct2026.monthYearLabel, 'Outubro / 2026');

  const sep2026 = getMonthYearPeriod(9, 2026);
  assert.equal(sep2026.periodStart, '2026-09-01');
  assert.equal(sep2026.periodEnd, '2026-09-30');
  assert.equal(sep2026.monthYearLabel, 'Setembro / 2026');

  assert.deepEqual(parseOperationalMonthYear('2026-09-01', '2026-09-30'), {
    month: 9,
    year: 2026,
    monthYearLabel: 'Setembro / 2026',
  });
});

