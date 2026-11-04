import { evaluateBetEntry, roundCurrency } from './ledger.ts';
import type {
  BankAccount,
  BetEntry,
  CostRecord,
  HouseAccount,
  LedgerMovement,
  Partnership,
  Withdrawal,
} from './types.ts';

export interface CsvExportOptions {
  delimiter: ';' | ',';
  decimalSeparator: ',' | '.';
  includeBom?: boolean;
  periodFilter?: 'todos' | 'mes_atual' | 'ultimos_30_dias';
  operatorIdFilter?: string | null;
}

export const DEFAULT_CSV_OPTIONS: CsvExportOptions = {
  delimiter: ';',
  decimalSeparator: ',',
  includeBom: true,
  periodFilter: 'todos',
  operatorIdFilter: null,
};

/**
 * Escapa uma célula CSV para conformidade RFC 4180 e compatibilidade com Microsoft Excel / Google Sheets.
 */
export function escapeCsvCell(
  val: string | number | boolean | null | undefined,
  delimiter: ';' | ',' = ';'
): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formata números com separador decimal configurável.
 */
export function formatCsvNumber(
  value: number | null | undefined,
  decimalSeparator: ',' | '.' = ','
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = roundCurrency(value);
  if (decimalSeparator === ',') {
    return rounded.toFixed(2).replace('.', ',');
  }
  return rounded.toFixed(2);
}

/**
 * Converte array de linhas e colunas em string CSV com suporte a BOM UTF-8.
 */
export function buildCsvString(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const delimiter = options.delimiter;
  const headerLine = headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter);
  const bodyLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell, delimiter)).join(delimiter)
  );

  const fullContent = [headerLine, ...bodyLines].join('\r\n');
  return options.includeBom ? `\uFEFF${fullContent}` : fullContent;
}

/**
 * Gera CSV de Entradas e Operações.
 */
export function generateEntradasCsv(
  entries: BetEntry[],
  houseAccounts: HouseAccount[],
  partnerships: Partnership[],
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const pMap = new Map(partnerships.map((p) => [p.id, p]));
  const accMap = new Map(houseAccounts.map((a) => [a.id, a]));

  const headers = [
    'ID Operação',
    'Data/Hora',
    'Modo',
    'Tipo de Operação',
    'Casas Envolvidas',
    'Evento',
    'Mercado',
    'Capital Investido (R$)',
    'Retorno Bruto (R$)',
    'Lucro Líquido (R$)',
    'ROI (%)',
    'Situação Resultado',
    'Situação Conciliação',
    'Qtd Pernas',
    'Detalhamento das Pernas',
    'Operador Responsável',
    'Origem',
    'Observações',
  ];

  let filtered = entries;
  if (options.operatorIdFilter) {
    filtered = filtered.filter((e) => e.operatorId === options.operatorIdFilter);
  }

  const rows = filtered.map((entry) => {
    const ev = evaluateBetEntry(entry);
    const legsDetail = entry.legs
      .map((l, idx) => {
        const acc = l.accountId ? accMap.get(l.accountId) : null;
        const p = l.partnershipId ? pMap.get(l.partnershipId) : null;
        const pName = p ? p.shortName : '';
        const stakeStr = l.stake !== null ? formatCsvNumber(l.stake, options.decimalSeparator) : 'N/D';
        const oddStr = l.odd !== null ? formatCsvNumber(l.odd, options.decimalSeparator) : 'N/D';
        const returnStr =
          l.grossReturn !== null ? formatCsvNumber(l.grossReturn, options.decimalSeparator) : 'N/D';
        return `Perna ${idx + 1}: ${l.houseName} (${pName || acc?.label || 'Sem conta'}) - Sel: ${l.selection || 'N/D'} - Odd: ${oddStr} - Stake: R$ ${stakeStr} - Res: ${l.result.toUpperCase()} - Ret: R$ ${returnStr}`;
      })
      .join(' | ');

    const roiStr =
      ev.roiPercent !== null
        ? formatCsvNumber(ev.roiPercent, options.decimalSeparator) + '%'
        : '';

    return [
      entry.id,
      entry.createdAt,
      entry.mode === 'rapido' ? 'Modo Rápido' : 'Modo Detalhado',
      entry.operationType.replace('_', ' ').toUpperCase(),
      entry.houses.join(', '),
      entry.event || '',
      entry.market || '',
      formatCsvNumber(ev.totalStake, options.decimalSeparator),
      formatCsvNumber(ev.totalReturn, options.decimalSeparator),
      ev.netProfit !== null ? formatCsvNumber(ev.netProfit, options.decimalSeparator) : '',
      roiStr,
      entry.resultStatus.replace('_', ' ').toUpperCase(),
      entry.reconciliationStatus.replace(/_/g, ' ').toUpperCase(),
      entry.legs.length,
      legsDetail,
      entry.operatorId,
      entry.origin,
      entry.notes || '',
    ];
  });

  return buildCsvString(headers, rows, options);
}

/**
 * Gera CSV de Saques e Transferências.
 */
export function generateSaquesCsv(
  withdrawals: Withdrawal[],
  houseAccounts: HouseAccount[],
  bankAccounts: BankAccount[],
  partnerships: Partnership[],
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const pMap = new Map(partnerships.map((p) => [p.id, p]));
  const accMap = new Map(houseAccounts.map((a) => [a.id, a]));
  const bankMap = new Map(bankAccounts.map((b) => [b.id, b]));

  const headers = [
    'ID Saque',
    'Data Solicitação',
    'Casa de Origem',
    'Titular / Parceria',
    'Conta Casa',
    'Banco de Destino',
    'Chave PIX',
    'Valor Solicitado (R$)',
    'Valor Recebido no Banco (R$)',
    'Tarifa Cobrada (R$)',
    'Custo Faciais (R$)',
    'Estágio Atual',
    'Horas Decorridas',
    'Prioridade',
    'Alerta / Pendência',
    'Notas do Alerta',
    'Operador Responsável',
    'Data Conclusão na Casa',
    'Data Crédito no Banco',
  ];

  let filtered = withdrawals;
  if (options.operatorIdFilter) {
    filtered = filtered.filter((w) => w.operatorId === options.operatorIdFilter);
  }

  const rows = filtered.map((w) => {
    const acc = accMap.get(w.houseAccountId);
    const p = pMap.get(w.partnershipId);
    const bank = bankMap.get(w.destinationBankId);
    const faciaisTotal = w.facialCosts.reduce((sum, c) => sum + c, 0);

    const stageLabel =
      w.stage === 'solicitado'
        ? '1. Solicitado na casa'
        : w.stage === 'concluido_casa'
        ? '2. Concluído na casa'
        : w.stage === 'em_transito'
        ? '3. Em trânsito'
        : w.stage === 'recebido_banco'
        ? '4. Recebido no banco'
        : 'Devolvido à casa';

    return [
      w.id,
      w.requestedAt,
      acc?.houseName || '',
      p?.shortName || p?.titularName || '',
      acc?.label || '',
      bank ? `${bank.bankName} (${bank.label})` : '',
      bank?.pixKey || p?.pixWithdrawals || '',
      formatCsvNumber(w.amount, options.decimalSeparator),
      w.receivedAmount !== null ? formatCsvNumber(w.receivedAmount, options.decimalSeparator) : '',
      formatCsvNumber(w.feeAmount, options.decimalSeparator),
      formatCsvNumber(faciaisTotal, options.decimalSeparator),
      stageLabel,
      w.hoursElapsed,
      w.priority.toUpperCase(),
      w.issueType.replace('_', ' ').toUpperCase(),
      w.issueNotes || '',
      w.operatorId,
      w.houseCompletedAt || '',
      w.bankReceivedAt || '',
    ];
  });

  return buildCsvString(headers, rows, options);
}

/**
 * Gera CSV de Parcerias e Contas.
 */
export function generateParceriasCsv(
  partnerships: Partnership[],
  houseAccounts: HouseAccount[],
  bankAccounts: BankAccount[],
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const headers = [
    'ID Parceria',
    'Código',
    'Nome Titular',
    'Nome Curto',
    'CPF',
    'Data de Nascimento',
    'Telefones',
    'E-mail Operação',
    'E-mail Pessoal',
    'Endereço',
    'Local do Chip',
    'Indicação',
    'Período / Ciclo',
    'Status Parceria',
    'Origem Cadastro',
    'Operador Responsável',
    'Quem Pagou Criação',
    'Custo de Criação (R$)',
    'Ressarcimento Quitado',
    'PIX Saques',
    'PIX Pagamentos',
    'Qtd Contas Casas',
    'Resumo Contas Casas',
    'Saldo Total Disponível Casas (R$)',
    'Resumo Bancos Vinculados',
    'Saldo Total Bancos (R$)',
    'Data de Cadastro',
    'Observações',
  ];

  let filtered = partnerships;
  if (options.operatorIdFilter) {
    filtered = filtered.filter(
      (p) => p.operatorId === options.operatorIdFilter || p.paidByOperatorId === options.operatorIdFilter
    );
  }

  const rows = filtered.map((p) => {
    const pAccs = houseAccounts.filter((a) => a.partnershipId === p.id);
    const pBanks = bankAccounts.filter((b) => b.partnershipId === p.id);

    const totalAvailableHouses = pAccs.reduce((sum, a) => sum + a.availableBalance, 0);
    const totalBanks = pBanks.reduce((sum, b) => sum + b.balance, 0);

    const accountsDetail = pAccs
      .map(
        (a) =>
          `${a.houseName} (${a.cloneGroup}) - Status: ${a.status} - Saldo: R$ ${formatCsvNumber(
            a.availableBalance,
            options.decimalSeparator
          )}`
      )
      .join(' | ');

    const banksDetail = pBanks
      .map(
        (b) =>
          `${b.bankName} - Saldo: R$ ${formatCsvNumber(b.balance, options.decimalSeparator)} - Status: ${b.status}`
      )
      .join(' | ');

    return [
      p.id,
      p.code,
      p.titularName,
      p.shortName,
      p.cpf,
      p.birthDate,
      p.phones,
      p.emailOperation,
      p.emailPersonal,
      p.address,
      p.chipLocation,
      p.referral,
      p.period,
      p.status.toUpperCase(),
      p.origin === 'estoque' ? 'Estoque' : 'Atendimento',
      p.operatorId || 'Sem operador (Estoque)',
      p.paidByOperatorId,
      formatCsvNumber(p.creationCost, options.decimalSeparator),
      p.reimbursementSettled ? 'Sim' : 'Não',
      p.pixWithdrawals,
      p.pixPayments,
      pAccs.length,
      accountsDetail,
      formatCsvNumber(totalAvailableHouses, options.decimalSeparator),
      banksDetail,
      formatCsvNumber(totalBanks, options.decimalSeparator),
      p.createdAt,
      p.notes || '',
    ];
  });

  return buildCsvString(headers, rows, options);
}

/**
 * Gera CSV de Custos e Despesas.
 */
export function generateCustosCsv(
  costs: CostRecord[],
  partnerships: Partnership[],
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const pMap = new Map(partnerships.map((p) => [p.id, p]));

  const headers = [
    'ID Custo',
    'Data',
    'Categoria',
    'Detalhe',
    'Operador Responsável',
    'Parceria Vinculada',
    'Valor (R$)',
    'Origem',
    'Situação',
    'Motivo Estorno',
  ];

  let filtered = costs;
  if (options.operatorIdFilter) {
    filtered = filtered.filter((c) => c.operatorId === options.operatorIdFilter);
  }

  const rows = filtered.map((c) => {
    const p = c.partnershipId ? pMap.get(c.partnershipId) : null;
    return [
      c.id,
      c.date,
      c.category,
      c.detail,
      c.operatorId,
      p ? p.shortName : 'Geral',
      formatCsvNumber(c.amount, options.decimalSeparator),
      c.origin,
      c.reversed ? 'ESTORNADO' : 'ATIVO',
      c.reversalReason || '',
    ];
  });

  return buildCsvString(headers, rows, options);
}

/**
 * Gera CSV da Trilha Única / Livro Caixa Consolidado.
 */
export function generateTrilhaCsv(
  movements: LedgerMovement[],
  options: CsvExportOptions = DEFAULT_CSV_OPTIONS
): string {
  const headers = [
    'ID Movimento',
    'Data/Hora',
    'Tipo de Movimento',
    'Origem',
    'Destino',
    'Casa Envolvida',
    'ID Parceria',
    'Conta Casa',
    'Conta Bancária',
    'Valor (R$)',
    'Operador',
    'Autor do Registro',
    'Situação',
    'ID Referência',
    'Observações',
  ];

  let filtered = movements;
  if (options.operatorIdFilter) {
    filtered = filtered.filter((m) => m.operatorId === options.operatorIdFilter);
  }

  const rows = filtered.map((m) => [
    m.id,
    m.timestamp,
    m.type.replace(/_/g, ' ').toUpperCase(),
    m.origin,
    m.destination,
    m.houseName || '',
    m.partnershipId || '',
    m.houseAccountId || '',
    m.bankAccountId || '',
    formatCsvNumber(m.amount, options.decimalSeparator),
    m.operatorId,
    m.authorName,
    m.status.toUpperCase(),
    m.referenceId,
    m.notes || '',
  ]);

  return buildCsvString(headers, rows, options);
}

/**
 * Dispara o download de um arquivo no navegador de forma limpa.
 */
export function triggerFileDownload(
  filename: string,
  content: string,
  mimeType = 'text/csv;charset=utf-8;'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
