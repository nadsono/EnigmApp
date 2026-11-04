import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeCsvCell,
  formatCsvNumber,
  generateEntradasCsv,
  generateSaquesCsv,
  generateParceriasCsv,
} from './exportCsv.ts';
import type { BankAccount, BetEntry, HouseAccount, Partnership, Withdrawal } from './types.ts';

test('escapeCsvCell correctly escapes delimiter, quotes, and line breaks', () => {
  assert.equal(escapeCsvCell('Simples', ';'), 'Simples');
  assert.equal(escapeCsvCell('Valor;Com;PontoEVirgula', ';'), '"Valor;Com;PontoEVirgula"');
  assert.equal(escapeCsvCell('Texto com "aspas"', ';'), '"Texto com ""aspas"""');
  assert.equal(escapeCsvCell('Linha 1\nLinha 2', ';'), '"Linha 1\nLinha 2"');
  assert.equal(escapeCsvCell(null, ';'), '');
  assert.equal(escapeCsvCell(undefined, ';'), '');
  assert.equal(escapeCsvCell(1234.56, ';'), '1234.56');
});

test('formatCsvNumber formats with Brazilian comma or international dot', () => {
  assert.equal(formatCsvNumber(1250.5, ','), '1250,50');
  assert.equal(formatCsvNumber(1250.5, '.'), '1250.50');
  assert.equal(formatCsvNumber(null, ','), '');
});

test('generateEntradasCsv exports operational entries with UTF-8 BOM and correct columns', () => {
  const dummyEntries: BetEntry[] = [
    {
      id: 'e1',
      mode: 'rapido',
      operationType: 'ao_vivo',
      houses: ['Pinnacle', 'Bet365'],
      event: 'Flamengo x Palmeiras',
      market: 'Handicap',
      createdAt: '11/10/2026 14:00',
      concludedAt: '11/10/2026 16:00',
      operatorId: 'op_a',
      origin: 'Manual',
      totalInvestedCapital: 5000,
      resultStatus: 'concluida',
      reconciliationStatus: 'conciliada',
      simpleResultHint: null,
      notes: 'Operação sem intercorrências',
      legs: [
        {
          id: 'l1',
          label: 'Perna 1',
          houseName: 'Pinnacle',
          partnershipId: 'p1',
          accountId: 'acc1',
          selection: 'Over 2.5',
          odd: 2.1,
          stake: 2500,
          result: 'green',
          grossReturn: 5250,
          createdAt: '11/10/2026 14:00',
        },
        {
          id: 'l2',
          label: 'Perna 2',
          houseName: 'Bet365',
          partnershipId: 'p1',
          accountId: 'acc2',
          selection: 'Under 2.5',
          odd: 1.95,
          stake: 2500,
          result: 'red',
          grossReturn: 0,
          createdAt: '11/10/2026 14:00',
        },
      ],
    },
  ];

  const dummyAccounts: HouseAccount[] = [
    {
      id: 'acc1',
      partnershipId: 'p1',
      houseName: 'Pinnacle',
      cloneGroup: 'Grupo 1',
      label: 'Pinnacle · João',
      status: 'em_uso',
      login: 'joao.pin',
      passwordSecret: 'pass123',
      availableBalance: 5250,
      informedRealBalance: 5250,
      lastReconciledAt: '11/10/2026',
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const dummyPartnerships: Partnership[] = [
    {
      id: 'p1',
      code: 'PARC-01',
      titularName: 'João da Silva',
      shortName: 'João',
      cpf: '000.000.000-01',
      birthDate: '01/01/1990',
      address: 'Rua 1',
      emailOperation: 'joao@op.com',
      emailPersonal: 'joao@gmail.com',
      phones: '11999999999',
      chipLocation: 'Gaveta 1',
      referral: '',
      period: 'Mensal',
      status: 'ativa',
      origin: 'estoque',
      createdAt: '01/10/2026',
      operatorId: 'op_a',
      paidByOperatorId: 'op_a',
      creationCost: 150,
      creationCostCharged: true,
      reimbursementDueToOperatorId: null,
      reimbursementAmount: 0,
      reimbursementSettled: true,
      pixWithdrawals: 'joao@pix.com',
      pixPayments: '000.000.000-01',
      notes: '',
      assignmentHistory: [],
    },
  ];

  const csv = generateEntradasCsv(dummyEntries, dummyAccounts, dummyPartnerships, {
    delimiter: ';',
    decimalSeparator: ',',
    includeBom: true,
  });

  assert.ok(csv.startsWith('\uFEFF'), 'CSV must contain BOM for Excel compatibility');
  assert.ok(csv.includes('ID Operação;Data/Hora;Modo'));
  assert.ok(csv.includes('e1;11/10/2026 14:00;Modo Rápido;AO VIVO;Pinnacle, Bet365'));
  assert.ok(csv.includes('5000,00'));
  assert.ok(csv.includes('250,00')); // Lucro Líquido
});

test('generateSaquesCsv exports withdrawals with lifecycle and issues', () => {
  const dummyWithdrawals: Withdrawal[] = [
    {
      id: 'w1',
      houseAccountId: 'acc1',
      partnershipId: 'p1',
      destinationBankId: 'b1',
      amount: 2000,
      receivedAmount: null,
      feeAmount: 0,
      facialCosts: [8, 8],
      noCostConfirmed: false,
      stage: 'em_transito',
      issueType: 'nenhum',
      issueNotes: '',
      priority: 'alta',
      requestedAt: '11/10/2026 10:15',
      houseCompletedAt: '11/10/2026 11:00',
      bankReceivedAt: null,
      hoursElapsed: 1,
      operatorId: 'op_a',
    },
  ];

  const dummyAccounts: HouseAccount[] = [
    {
      id: 'acc1',
      partnershipId: 'p1',
      houseName: 'Bet365',
      cloneGroup: 'Grupo 1',
      label: 'Bet365 · Maria',
      status: 'em_uso',
      login: 'maria.bet',
      passwordSecret: 'pass123',
      availableBalance: 4120,
      informedRealBalance: 4120,
      lastReconciledAt: '11/10/2026',
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const dummyBanks: BankAccount[] = [
    {
      id: 'b1',
      partnershipId: 'p1',
      bankName: 'Inter',
      label: 'Inter · Maria',
      status: 'ativo',
      phoneDevice: 'A22',
      login: '000.000.000-00',
      passwordSecret: 'secret',
      pixKey: 'maria@pix.com',
      balance: 6000,
      informedRealBalance: 6000,
      lastReconciledAt: '11/10/2026',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const dummyPartnerships: Partnership[] = [
    {
      id: 'p1',
      code: 'PARC-02',
      titularName: 'Maria Silva',
      shortName: 'Maria',
      cpf: '000.000.000-02',
      birthDate: '01/01/1992',
      address: 'Rua 2',
      emailOperation: 'maria@op.com',
      emailPersonal: 'maria@gmail.com',
      phones: '11988888888',
      chipLocation: 'Gaveta 2',
      referral: '',
      period: 'Mensal',
      status: 'ativa',
      origin: 'estoque',
      createdAt: '01/10/2026',
      operatorId: 'op_a',
      paidByOperatorId: 'op_a',
      creationCost: 150,
      creationCostCharged: true,
      reimbursementDueToOperatorId: null,
      reimbursementAmount: 0,
      reimbursementSettled: true,
      pixWithdrawals: 'maria@pix.com',
      pixPayments: '000.000.000-02',
      notes: '',
      assignmentHistory: [],
    },
  ];

  const csv = generateSaquesCsv(dummyWithdrawals, dummyAccounts, dummyBanks, dummyPartnerships, {
    delimiter: ';',
    decimalSeparator: ',',
    includeBom: true,
  });

  assert.ok(csv.includes('w1;11/10/2026 10:15;Bet365;Maria;Bet365 · Maria;Inter (Inter · Maria)'));
  assert.ok(csv.includes('2000,00'));
  assert.ok(csv.includes('16,00')); // faciais total
  assert.ok(csv.includes('3. Em trânsito'));
});

test('generateParceriasCsv exports partnerships with aggregated accounts and bank info', () => {
  const dummyPartnerships: Partnership[] = [
    {
      id: 'p1',
      code: 'PARC-01',
      titularName: 'João da Silva',
      shortName: 'João',
      cpf: '000.000.000-01',
      birthDate: '01/01/1990',
      address: 'Rua Teste, 100',
      emailOperation: 'joao@op.com',
      emailPersonal: 'joao@gmail.com',
      phones: '11999999999',
      chipLocation: 'Celular A14',
      referral: 'Carlos',
      period: '21/09 a 21/10',
      status: 'ativa',
      origin: 'estoque',
      createdAt: '01/10/2026',
      operatorId: 'op_a',
      paidByOperatorId: 'op_a',
      creationCost: 150,
      creationCostCharged: true,
      reimbursementDueToOperatorId: null,
      reimbursementAmount: 0,
      reimbursementSettled: true,
      pixWithdrawals: 'joao@pix.com',
      pixPayments: '000.000.000-01',
      notes: 'Sem restrições',
      assignmentHistory: [],
    },
  ];

  const dummyAccounts: HouseAccount[] = [
    {
      id: 'acc1',
      partnershipId: 'p1',
      houseName: 'Pinnacle',
      cloneGroup: 'Principal',
      label: 'Pinnacle · João',
      status: 'em_uso',
      login: 'joao.pin',
      passwordSecret: 'secret',
      availableBalance: 5480,
      informedRealBalance: 5480,
      lastReconciledAt: '11/10/2026',
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const dummyBanks: BankAccount[] = [
    {
      id: 'b1',
      partnershipId: 'p1',
      bankName: 'PGBank',
      label: 'PGBank · João',
      status: 'ativo',
      phoneDevice: 'A31',
      login: '000.000.000-01',
      passwordSecret: 'secret',
      pixKey: 'joao@pix.com',
      balance: 3200,
      informedRealBalance: 3200,
      lastReconciledAt: '11/10/2026',
      authorizedOperatorIds: ['op_a'],
    },
  ];

  const csv = generateParceriasCsv(dummyPartnerships, dummyAccounts, dummyBanks, {
    delimiter: ';',
    decimalSeparator: ',',
    includeBom: true,
  });

  assert.ok(csv.includes('PARC-01;João da Silva;João;000.000.000-01'));
  assert.ok(csv.includes('5480,00'));
  assert.ok(csv.includes('3200,00'));
});
