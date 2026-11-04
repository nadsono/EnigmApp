export type UserRole = 'admin' | 'operador' | 'socio';

export type UserAccountStatus = 'ativo' | 'pendente' | 'bloqueado';

export interface UserProfile {
  id: string;
  name: string;
  shortName: string;
  login: string;
  email: string;
  password?: string;
  passwordHash?: string;
  passwordUpdatedAt?: string | null;
  mustChangePassword?: boolean;
  status: UserAccountStatus;
  role: UserRole;
  companyId: string;
  profitSharePercent: number;
  initialMonthlyBalance: number;
  phone?: string;
  registrationNotes?: string;
  createdAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  lastLoginAt?: string | null;
  preferredExchange?: string;
}

export type AppSystemVersionId =
  | 'v1_bancos_pix'
  | 'v1_5_hibrido'
  | 'v2_cripto_offshore';

export type HouseAccountCurrency = 'USDT' | 'EUR' | 'BRL';

export interface UserPersistenceSnapshot {
  schemaVersion: number;
  driver: 'localStorage+sql';
  storageKey: string;
  updatedAt: string;
  checksum: string;
  totalRecords: number;
  activeCount: number;
  pendingCount: number;
  blockedCount: number;
  users: UserProfile[];
}

export interface ExportRequestRecord {
  id: string;
  userId: string;
  userName: string;
  userLogin: string;
  userRole: UserRole;
  periodLabel: string;
  requestedAt: string;
  status: 'pendente' | 'atendida';
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export type CatalogEntityType = 'casa' | 'banco';

export type CatalogFieldType = 'texto' | 'numero' | 'moeda' | 'selecao';

export interface CatalogCustomCriterion {
  id: string;
  target: CatalogEntityType;
  key: string;
  label: string;
  fieldType: CatalogFieldType;
  options?: string[];
  defaultValue: string;
  description?: string;
  required: boolean;
  createdAt: string;
}

export interface HouseCatalogItem {
  id: string;
  name: string;
  code: string;
  active: boolean;
  cloneGroup: string;
  category: string;
  verificationPolicy: string;
  defaultMinStake: number;
  withdrawLeadTime: string;
  notes: string;
  customValues: Record<string, string>;
  updatedAt: string;
  color?: string;
}

export interface BankCatalogItem {
  id: string;
  name: string;
  code: string;
  compeCode: string;
  active: boolean;
  accountType: string;
  pixKeyTypes: string;
  dailyPixLimit: number;
  transferFeeDefault: number;
  devicePolicy: string;
  notes: string;
  customValues: Record<string, string>;
  updatedAt: string;
}

export interface CatalogPersistenceSnapshot {
  schemaVersion: number;
  driver: 'localStorage+sql';
  storageKey: string;
  updatedAt: string;
  checksum: string;
  housesCount: number;
  activeHousesCount: number;
  banksCount: number;
  activeBanksCount: number;
  customCriteriaCount: number;
  houses: HouseCatalogItem[];
  banks: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
}

export type PartnershipStatus = 'estoque' | 'ativa' | 'fila' | 'arquivada';

export interface PartnershipAssignmentEvent {
  id: string;
  date: string;
  action:
    | 'criada_estoque'
    | 'criada_atendimento'
    | 'puxada_estoque'
    | 'devolvida_estoque'
    | 'transferida'
    | 'arquivada'
    | 'ressarcimento_quitado';
  fromOperatorId: string | null;
  toOperatorId: string | null;
  authorName: string;
  note: string;
}

export interface Partnership {
  id: string;
  code: string;
  titularName: string;
  shortName: string;
  cpf: string;
  birthDate: string;
  address: string;
  emailOperation: string;
  emailPersonal: string;
  phones: string;
  chipLocation: string;
  referral: string;
  period: string;
  status: PartnershipStatus;
  origin: 'estoque' | 'atendimento';
  createdAt: string;
  operatorId: string | null;
  paidByOperatorId: string;
  creationCost: number;
  creationCostCharged: boolean;
  reimbursementDueToOperatorId: string | null;
  reimbursementAmount: number;
  reimbursementSettled: boolean;
  pixWithdrawals: string;
  pixPayments: string;
  notes: string;
  assignmentHistory: PartnershipAssignmentEvent[];
}

export interface BankAccount {
  id: string;
  partnershipId: string | null;
  bankName: string;
  label: string;
  status: 'ativo' | 'sem_status' | 'bloqueado';
  phoneDevice: string;
  login: string;
  passwordSecret: string;
  pixKey: string;
  balance: number;
  informedRealBalance: number | null;
  lastReconciledAt: string | null;
  authorizedOperatorIds: string[];
}

export type HouseAccountStatus =
  | 'pronta'
  | 'verificar'
  | 'em_uso'
  | 'limitada'
  | 'aguardando_saque'
  | 'aguardando_deposito'
  | 'em_conferencia';

export interface HouseAccount {
  id: string;
  partnershipId: string;
  houseName: string;
  cloneGroup: string;
  label: string;
  status: HouseAccountStatus;
  login: string;
  passwordSecret: string;
  availableBalance: number;
  informedRealBalance: number | null;
  lastReconciledAt: string | null;
  weeklyFacialDue: string | null;
  weeklyFacialPending: boolean;
  notes: string;
  authorizedOperatorIds: string[];
  pendingStatusChangeTo?: HouseAccountStatus | null;
  accountCurrency?: HouseAccountCurrency;
  color?: string;
}

export type OperationType =
  | 'ao_vivo'
  | 'pre_jogo'
  | 'cashout'
  | 'bonus'
  | 'delay'
  | 'extracao';

export type LegResult =
  | 'pendente'
  | 'green'
  | 'red'
  | 'void'
  | 'cashout'
  | 'parcial';

export interface BetLeg {
  id: string;
  label: string;
  houseName: string;
  partnershipId: string | null;
  accountId: string | null;
  selection: string;
  odd: number | null;
  stake: number | null;
  result: LegResult;
  grossReturn: number | null;
  createdAt: string;
}

export type EntryResultStatus =
  | 'aberta'
  | 'aguardando_detalhamento'
  | 'concluida'
  | 'parcial';

export type EntryReconciliationStatus =
  | 'pendente_apuracao'
  | 'pronta_para_concluir'
  | 'conciliada';

export interface BetEntry {
  id: string;
  mode: 'rapido' | 'detalhado';
  operationType: OperationType;
  houses: string[];
  event: string;
  market: string;
  createdAt: string;
  concludedAt: string | null;
  operatorId: string;
  origin: 'Manual' | 'GreenSureBet';
  totalInvestedCapital: number | null;
  resultStatus: EntryResultStatus;
  reconciliationStatus: EntryReconciliationStatus;
  simpleResultHint: LegResult | null;
  legs: BetLeg[];
  notes: string;
}

export type WithdrawalStage =
  | 'solicitado'
  | 'concluido_casa'
  | 'em_transito'
  | 'recebido_banco'
  | 'devolvido_casa';

export type WithdrawalIssueType =
  | 'nenhum'
  | 'atraso'
  | 'recebimento_parcial'
  | 'falha_devolvido'
  | 'erro_destino'
  | 'em_investigacao';

export interface Withdrawal {
  id: string;
  houseAccountId: string;
  partnershipId: string;
  destinationBankId: string;
  amount: number;
  receivedAmount: number | null;
  feeAmount: number;
  facialCosts: number[];
  noCostConfirmed: boolean;
  stage: WithdrawalStage;
  issueType: WithdrawalIssueType;
  issueNotes: string;
  priority: 'alta' | 'media' | 'baixa';
  requestedAt: string;
  houseCompletedAt: string | null;
  bankReceivedAt: string | null;
  hoursElapsed: number;
  operatorId: string;
}

export interface DepositTransfer {
  id: string;
  type: 'deposito_casa' | 'transferencia_bancos';
  originBankId: string;
  destinationHouseAccountId: string | null;
  destinationBankId: string | null;
  partnershipId: string | null;
  amount: number;
  feeAmount: number;
  status: 'pretendido' | 'enviado' | 'confirmado' | 'cancelado';
  createdAt: string;
  confirmedAt: string | null;
  operatorId: string;
  originTag: 'Manual' | 'Identificada na conferência' | 'Extrato importado';
  notes: string;
}

export type DivergenceClassification =
  | 'nao_classificada'
  | 'saque_em_transito'
  | 'falhou_voltou_casa'
  | 'pix_chave_errada'
  | 'transferencia_outra_conta'
  | 'tarifa_custo'
  | 'entrada_nao_lancada'
  | 'deposito_pendente'
  | 'outro';

export interface DivergenceHistoryEntry {
  id: string;
  timestamp: string;
  author: string;
  classification: DivergenceClassification;
  note: string;
  status: 'aberta' | 'em_acompanhamento' | 'em_investigacao' | 'resolvida';
}

export interface ReconciliationDivergence {
  id: string;
  targetType: 'casa' | 'banco';
  targetId: string;
  targetLabel: string;
  partnershipId: string | null;
  operatorId: string;
  expectedBalance: number;
  realBalance: number;
  difference: number;
  status: 'aberta' | 'em_acompanhamento' | 'em_investigacao' | 'resolvida';
  classification: DivergenceClassification;
  justification: string;
  responsibleName: string;
  updatedAt: string;
  contextHint: string;
  history: DivergenceHistoryEntry[];
}

export type CostCategory =
  | 'Saques'
  | 'Criação de conta'
  | 'Novas parcerias'
  | 'Fintech'
  | 'Custos de operação'
  | 'Software'
  | 'Ressarcimento de parceria';

export interface CostRecord {
  id: string;
  category: CostCategory;
  detail: string;
  amount: number;
  date: string;
  operatorId: string;
  paidByOperatorId: string;
  origin:
    | 'Automático (saque)'
    | 'Automático (facial)'
    | 'Automático (tarifa)'
    | 'Automático (estoque)'
    | 'Manual';
  partnershipId: string | null;
  houseAccountId: string | null;
  withdrawalId: string | null;
  reversed: boolean;
  reversalReason: string | null;
}

export type LedgerMovementType =
  | 'entrada_reserva_stake'
  | 'entrada_liquidacao_retorno'
  | 'entrada_devolucao_void'
  | 'saque_solicitado'
  | 'saque_concluido_casa'
  | 'saque_recebido_banco'
  | 'saque_devolvido_casa'
  | 'deposito_casa'
  | 'transferencia_bancaria'
  | 'custo_operacional'
  | 'ajuste_justificado'
  | 'estorno';

export interface LedgerMovement {
  id: string;
  type: LedgerMovementType;
  origin: string;
  destination: string;
  houseName: string | null;
  partnershipId: string | null;
  houseAccountId: string | null;
  bankAccountId: string | null;
  amount: number;
  timestamp: string;
  operatorId: string;
  authorName: string;
  status: 'pendente' | 'em_transito' | 'conciliado' | 'estornado';
  referenceId: string;
  notes: string;
  reversedByMovementId?: string | null;
}

export interface CredentialAccessLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  partnershipId: string;
  targetType: 'banco' | 'casa';
  targetLabel: string;
}

export interface GreenSureBetCandidate {
  id: string;
  datetime: string;
  platforms: string[];
  stake: number;
  pl: number;
  status: 'nova' | 'existente' | 'duplicada_provavel';
  selected: boolean;
  reason?: string;
}

export interface StatementImportCandidate {
  id: string;
  date: string;
  bankId: string;
  bankLabel: string;
  description: string;
  amount: number;
  direction: 'credito' | 'debito';
  status: 'novo' | 'duplicado' | 'conciliavel_saque';
  matchedWithdrawalId?: string | null;
  selected: boolean;
}

export type ScreenId =
  | 'visao_geral'
  | 'entradas'
  | 'saques'
  | 'conferencia'
  | 'pendencias'
  | 'saldos'
  | 'parcerias'
  | 'equipe'
  | 'custos'
  | 'minha_performance'
  | 'estoque'
  | 'configuracoes';

export type DateRangePreset =
  | 'todo_periodo'
  | 'hoje'
  | 'ultimos_3_dias'
  | 'primeira_dezena'
  | 'mes_atual'
  | 'mes_anterior'
  | 'mes_outubro'
  | 'mes_setembro'
  | 'mes_agosto'
  | 'personalizado';

export interface DateRangeFilter {
  preset: DateRangePreset;
  periodStart: string; // YYYY-MM-DD ou ''
  periodEnd: string;   // YYYY-MM-DD ou ''
  startDate: string;   // alias para periodStart (YYYY-MM-DD ou '')
  endDate: string;     // alias para periodEnd (YYYY-MM-DD ou '')
}

