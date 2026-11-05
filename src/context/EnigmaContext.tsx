import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { buildDashboardReport } from '../domain/reporting.ts';
import type { CryptoRouteMetadata } from '../domain/cryptoNetworks.ts';
import {
  AVAILABLE_HOUSES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_COSTS,
  INITIAL_CREDENTIAL_LOGS,
  INITIAL_DEPOSITS_TRANSFERS,
  INITIAL_DIVERGENCES,
  INITIAL_ENTRIES,
  INITIAL_GREENSUREBET_CANDIDATES,
  INITIAL_HOUSE_ACCOUNTS,
  INITIAL_LEDGER_MOVEMENTS,
  INITIAL_PARTNERSHIPS,
  INITIAL_USERS,
  INITIAL_WITHDRAWALS,
} from '../domain/seed.ts';
import {
  canAccountStartNewOperation,
  canUserAccessCredentials,
  computeGlobalSummary,
  evaluateBetEntry,
  filterByUserPermission,
  formatCurrencyBRL,
  formatIsoDateBR,
  formatPeriodRangeLabel,
  getCurrencyDisplayMode,
  getCurrentMonthPeriod,
  getEurUsdtRate,
  getMonthYearPeriod,
  getUsdtBrlRate,
  isDateWithinRange,
  isLikelyCryptoWalletAddress,
  isWithdrawalInTransit,
  normalizePeriodBounds,
  parseOperationalMonthYear,
  roundCurrency,
  setCurrencyDisplayModeGlobal,
  setEurUsdtRateGlobal,
  setUsdtBrlRateGlobal,
  type CurrencyDisplayMode,
} from '../domain/ledger.ts';
import {
  buildVersionPresetData,
  SYSTEM_VERSIONS,
  type SystemVersionMetadata,
} from '../domain/versionPresets.ts';
import type {
  AppSystemVersionId,
  BankAccount,
  BankCatalogItem,
  BetEntry,
  BetLeg,
  CatalogCustomCriterion,
  CatalogPersistenceSnapshot,
  CostCategory,
  CostRecord,
  CredentialAccessLog,
  DateRangeFilter,
  DateRangePreset,
  DepositTransfer,
  DivergenceClassification,
  ExportRequestRecord,
  GreenSureBetCandidate,
  HouseAccount,
  HouseAccountCurrency,
  HouseAccountStatus,
  HouseCatalogItem,
  LedgerMovement,
  LegResult,
  OperationType,
  Partnership,
  ReconciliationDivergence,
  ScreenId,
  StatementImportCandidate,
  UserAccountStatus,
  UserPersistenceSnapshot,
  UserProfile,
  UserRole,
  Withdrawal,
  WithdrawalIssueType,
  WithdrawalStage,
} from '../domain/types.ts';
import {
  approveUserRegistrationPure,
  authenticateUser,
  computePasswordHash,
  createAdminUserPure,
  createRegistrationRequest,
  deleteAdminUserPure,
  updateAdminUserPure,
  updateUserCredentialsPure,
  type AuthAttemptResult,
  type RegistrationInput,
  type UserCrudResult,
} from '../domain/auth.ts';
import {
  addCatalogCriterionPure,
  deleteCatalogCriterionPure,
  getActiveBankNames,
  getActiveHouseNames,
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
  removeBankCatalogItemPure,
  removeHouseCatalogItemPure,
  toggleBankCatalogActivePure,
  toggleHouseCatalogActivePure,
  upsertBankCatalogItemPure,
  upsertHouseCatalogItemPure,
  type AddCatalogCriterionInput,
  type UpsertBankCatalogInput,
  type UpsertHouseCatalogInput,
} from '../domain/catalog.ts';
import {
  buildUserPersistenceSnapshot,
  deserializeUsersPersistenceJson,
  EXPORT_REQUESTS_STORAGE_KEY,
  LEGACY_USERS_STORAGE_KEY,
  loadExportRequestsFromRepository,
  loadUsersFromRepository,
  saveExportRequestsToRepository,
  saveUsersToRepository,
  USERS_REPOSITORY_STORAGE_KEY,
} from '../database/userRepository.ts';
import {
  CATALOG_REPOSITORY_STORAGE_KEY,
  loadCatalogFromRepository,
  saveCatalogToRepository,
} from '../database/catalogRepository.ts';
import {
  buildCleanProductionState,
  PRODUCTION_BASE_MODE_STORAGE_KEY,
  PROJECT_DATABASE_BOOT_MODE,
} from '../database/systemMaintenance.ts';
import {
  syncCatalogToSupabasePostgres,
  syncUsersToSupabasePostgres,
} from '../lib/supabase.ts';

interface NavigationFocus {
  entryId?: string;
  withdrawalId?: string;
  divergenceId?: string;
  partnershipId?: string;
  houseAccountId?: string;
}

interface EnigmaContextValue {
  // Active screen & user profile (RBAC)
  activeScreen: ScreenId;
  setActiveScreen: (screen: ScreenId, focus?: NavigationFocus) => void;
  navFocus: NavigationFocus;
  clearNavFocus: () => void;

  users: UserProfile[];
  pendingUsers: UserProfile[];
  pendingUsersCount: number;
  userPersistenceSnapshot: UserPersistenceSnapshot;
  currentUser: UserProfile;
  setCurrentUserId: (id: string) => void;
  isAuthenticated: boolean;
  loginWithCredentials: (identifier: string, passwordInput: string) => AuthAttemptResult;
  logoutUser: () => void;
  registerUserRequest: (input: RegistrationInput) => UserCrudResult;
  approveUserRegistration: (
    userId: string,
    overrides?: {
      role?: UserRole;
      profitSharePercent?: number;
      initialMonthlyBalance?: number;
      shortName?: string;
    }
  ) => UserCrudResult;
  rejectUserRegistration: (userId: string) => UserCrudResult;
  createAdminUser: (payload: {
    name: string;
    shortName: string;
    login: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserAccountStatus;
    profitSharePercent: number;
    initialMonthlyBalance: number;
    phone?: string;
    registrationNotes?: string;
  }) => UserCrudResult;
  updateAdminUser: (userId: string, patch: Partial<UserProfile>) => UserCrudResult;
  updateAdminUserCredentials: (
    userId: string,
    payload: {
      login?: string;
      email?: string;
      newPassword?: string;
      mustChangePassword?: boolean;
    }
  ) => UserCrudResult;
  deleteAdminUser: (userId: string) => UserCrudResult;
  syncUsersRepositoryNow: () => void;
  importUsersFromJsonSnapshot: (rawJson: string) => { ok: boolean; message: string };
  exportRequests: ExportRequestRecord[];
  requestAdminExport: () => { ok: boolean; message: string; request?: ExportRequestRecord };
  fulfillExportRequest: (requestId: string) => void;
  updateOwnProfileSecurity: (patch: {
    name?: string;
    shortName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => { ok: boolean; message: string };

  // Filtered data by current user RBAC + Global Date Filter
  partnerships: Partnership[];
  houseAccounts: HouseAccount[];
  bankAccounts: BankAccount[];
  entries: BetEntry[];
  settledEntries: BetEntry[];
  settlementUndatedCount: number;
  operationalSnapshot: {
    entries: BetEntry[];
    withdrawals: Withdrawal[];
    deposits: DepositTransfer[];
    divergences: ReconciliationDivergence[];
  };
  withdrawals: Withdrawal[];
  deposits: DepositTransfer[];
  costs: CostRecord[];
  divergences: ReconciliationDivergence[];

  // Authorized aggregations filtered by Global Date Filter
  allPartnerships: Partnership[];
  allHouseAccounts: HouseAccount[];
  allBankAccounts: BankAccount[];
  allEntries: BetEntry[];
  allWithdrawals: Withdrawal[];
  allCosts: CostRecord[];
  ledgerMovements: LedgerMovement[];
  credentialLogs: CredentialAccessLog[];
  gsbCandidates: GreenSureBetCandidate[];
  availableHouses: string[];
  availableBanks: string[];
  houseCatalog: HouseCatalogItem[];
  bankCatalog: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
  catalogPersistenceSnapshot: CatalogPersistenceSnapshot;
  upsertHouseCatalogItem: (input: UpsertHouseCatalogInput) => { ok: boolean; message: string };
  toggleHouseCatalogActive: (houseId: string) => { ok: boolean; message: string };
  removeHouseCatalogItem: (houseId: string) => { ok: boolean; message: string };
  upsertBankCatalogItem: (input: UpsertBankCatalogInput) => { ok: boolean; message: string };
  toggleBankCatalogActive: (bankId: string) => { ok: boolean; message: string };
  removeBankCatalogItem: (bankId: string) => { ok: boolean; message: string };
  addCatalogCriterion: (input: AddCatalogCriterionInput) => { ok: boolean; message: string };
  deleteCatalogCriterion: (criterionId: string) => { ok: boolean; message: string };

  // Período Operacional global ('operationalMonth' e 'operationalYear', além de 'periodStart' e 'periodEnd' derivados)
  operationalMonth: number;
  operationalYear: number;
  operationalMonthYearLabel: string;
  setOperationalMonth: (month: number) => void;
  setOperationalYear: (year: number) => void;
  setOperationalMonthYear: (month: number, year: number) => void;
  periodStart: string;
  periodEnd: string;
  setPeriodStart: (periodStart: string) => void;
  setPeriodEnd: (periodEnd: string) => void;
  setPeriodRange: (
    periodStart: string,
    periodEnd: string,
    preset?: DateRangePreset
  ) => void;
  resetPeriodToCurrentMonth: () => void;
  startDate: string;
  endDate: string;
  setStartDate: (startDate: string) => void;
  setEndDate: (endDate: string) => void;
  activePeriodLabel: string;
  dateFilter: DateRangeFilter;
  isDateFilterActive: boolean;
  setDateFilterRange: (
    startDate: string,
    endDate: string,
    preset?: DateRangePreset
  ) => void;
  applyDatePreset: (preset: DateRangePreset) => void;
  clearDateFilter: () => void;

  // Preferências de Dicas / Orientações na interface (removíveis individualmente ou nas Configurações)
  showTips: boolean;
  setShowTips: (show: boolean) => void;
  dismissedTips: string[];
  dismissTip: (tipId: string) => void;
  restoreAllTips: () => void;
  isTipVisible: (tipId: string) => boolean;

  // Cotação USDT / BRL, EUR / USDT, Corretora do Operador e Versionamento do Sistema
  usdtBrlRate: number;
  setUsdtBrlRate: (rate: number) => void;
  eurUsdtRate: number;
  setEurUsdtRate: (rate: number) => void;
  currencyDisplayMode: CurrencyDisplayMode;
  setCurrencyDisplayMode: (mode: CurrencyDisplayMode) => void;
  operatorPreferredExchange: string;
  setOperatorPreferredExchange: (exchangeName: string) => void;
  systemVersion: AppSystemVersionId;
  systemVersionsList: SystemVersionMetadata[];
  switchSystemVersion: (versionId: AppSystemVersionId) => void;

  // Derived summaries
  globalSummary: ReturnType<typeof computeGlobalSummary>;
  lastSyncedText: string;
  triggerSyncNow: () => void;
  resetDemoData: () => void;
  activateCleanProductionBase: () => void;
  isProductionCleanMode: boolean;
  feedbackBanner: { tone: 'success' | 'warning' | 'error'; message: string } | null;
  clearFeedback: () => void;
  notify: (tone: 'success' | 'warning' | 'error', message: string) => void;

  // Actions: Entradas (Modo Rápido & Detalhado)
  saveBetEntry: (entryInput: Omit<BetEntry, 'id' | 'createdAt' | 'operatorId'>, existingId?: string, wantConclude?: boolean) => boolean;
  concludeBetEntry: (entryId: string) => boolean;
  addLegToEntry: (entryId: string, leg: Omit<BetLeg, 'id' | 'createdAt'>) => void;
  toggleGsbCandidate: (id: string) => void;
  importSelectedGsbCandidates: () => void;

  // Actions: Saques, Depósitos e Faciais
  createWithdrawal: (params: {
    houseAccountId: string;
    destinationBankId: string;
    amount: number;
    requestedAt: string;
    facialCosts: number[];
    noCostConfirmed: boolean;
    initialStage: 'solicitado' | 'concluido_casa';
    cryptoRoute?: CryptoRouteMetadata;
  }) => boolean;
  advanceWithdrawalStage: (
    withdrawalId: string,
    nextStage: WithdrawalStage,
    options?: {
      receivedAmount?: number;
      feeAmount?: number;
      issueType?: WithdrawalIssueType;
      issueNotes?: string;
    }
  ) => void;
  registerStandaloneFacial: (params: {
    houseAccountId: string;
    amount: number;
    kind: 'Semanal' | 'Avulsa';
  }) => void;
  createDepositOrTransfer: (params: {
    type: 'deposito_casa' | 'transferencia_bancos';
    originBankId: string;
    destinationHouseAccountId?: string | null;
    destinationBankId?: string | null;
    amount: number;
    feeAmount?: number;
    status: 'pretendido' | 'enviado' | 'confirmado';
    notes: string;
    cryptoRoute?: CryptoRouteMetadata;
  }) => boolean;
  confirmPendingDeposit: (depositId: string) => void;

  // Actions: Conferência e Divergências
  updateInformedRealBalance: (targetType: 'casa' | 'banco', targetId: string, realBalance: number | null) => void;
  classifyDivergence: (params: {
    divergenceId: string;
    classification: DivergenceClassification;
    justification: string;
    markResolved?: boolean;
    targetTransferAccountLabel?: string;
  }) => void;
  confirmImportStatementCandidates: (candidates: StatementImportCandidate[]) => void;

  // Actions: Saldos e Caixa Operacional (Ações Rápidas)
  updateHouseAccountOperationalStatus: (
    accountId: string,
    nextStatus: HouseAccountStatus,
    realBalanceConfirmation?: number,
    justificationIfDiff?: string
  ) => boolean;
  adjustAccountBalanceWithJustification: (
    targetType: 'casa' | 'banco',
    targetId: string,
    newBalance: number,
    reason: string
  ) => void;
  reverseLedgerMovement: (movementId: string, reason: string) => void;

  // Actions: Parcerias, Estoque e Credenciais
  pullPartnershipFromStock: (partnershipId: string, targetOperatorId?: string) => void;
  returnPartnershipToStock: (partnershipId: string, reason: string) => void;
  settlePartnershipReimbursement: (partnershipId: string) => void;
  createDirectPartnership: (params: {
    titularName: string;
    cpf: string;
    birthDate: string;
    phones: string;
    referral: string;
    bankName: string;
    emailOperation: string;
    chipLocation: string;
    selectedHouses: string[];
    creationCost: number;
    address?: string;
    notes?: string;
  }) => string;
  addHouseToPartnership: (params: {
    partnershipId: string;
    houseName: string;
    cloneGroup: string;
    login: string;
    passwordSecret: string;
    accountCurrency?: HouseAccountCurrency;
  }) => void;
  addBankToPartnership: (params: {
    partnershipId: string;
    bankName: string;
    phoneDevice: string;
    login: string;
    passwordSecret: string;
    pixKey: string;
  }) => void;
  updateBankInPartnership: (
    bankId: string,
    updates: Partial<Pick<BankAccount, 'bankName' | 'phoneDevice' | 'login' | 'passwordSecret' | 'pixKey' | 'status'>>,
    options?: { destinationChangeConfirmed?: boolean }
  ) => boolean;
  removeBankFromPartnership: (bankId: string) => void;
  updatePartnershipDetails: (
    partnershipId: string,
    updates: Partial<
      Pick<
        Partnership,
        | 'shortName'
        | 'address'
        | 'emailOperation'
        | 'emailPersonal'
        | 'phones'
        | 'chipLocation'
        | 'referral'
        | 'pixWithdrawals'
        | 'withdrawalNetwork'
        | 'pixPayments'
        | 'notes'
      >
    >,
    options?: { confirmDestinationChange?: boolean }
  ) => boolean;
  logCredentialReveal: (partnershipId: string, targetType: 'banco' | 'casa', targetLabel: string) => boolean;

  // Actions: Custos
  addManualCost: (params: {
    category: CostCategory;
    operatorId: string;
    amount: number;
    date: string;
    detail: string;
    partnershipId?: string | null;
  }) => void;
  reverseCostRecord: (costId: string, reason: string) => void;
}

const STORAGE_KEY = 'enigma_gestao_state_crypto_v2_2';
const SYSTEM_VERSION_STORAGE_KEY = 'enigma_active_system_version_v1';
const OPERATOR_EXCHANGE_STORAGE_KEY = 'enigma_operator_preferred_exchange_v1';
const PERIOD_STORAGE_KEY = 'enigma_period_filter_v2';

interface PersistedPeriodState {
  operationalMonth: number;
  operationalYear: number;
  preset: DateRangePreset;
  periodStart: string;
  periodEnd: string;
}

function loadPersistedPeriodState(): PersistedPeriodState {
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1;
  const currentYearNum = now.getFullYear();
  const defaultCurrentMonth = getCurrentMonthPeriod(now);
  try {
    const rawPeriod = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (rawPeriod) {
      const parsed = JSON.parse(rawPeriod);
      if (
        typeof parsed.operationalMonth === 'number' &&
        typeof parsed.operationalYear === 'number'
      ) {
        const bounds = getMonthYearPeriod(parsed.operationalMonth, parsed.operationalYear);
        return {
          operationalMonth: parsed.operationalMonth,
          operationalYear: parsed.operationalYear,
          preset: parsed.preset || 'personalizado',
          periodStart: bounds.periodStart,
          periodEnd: bounds.periodEnd,
        };
      }
      const { periodStart, periodEnd } = normalizePeriodBounds(
        parsed.periodStart ?? parsed.startDate ?? defaultCurrentMonth.periodStart,
        parsed.periodEnd ?? parsed.endDate ?? defaultCurrentMonth.periodEnd
      );
      const parsedMy = parseOperationalMonthYear(periodStart, periodEnd);
      return {
        operationalMonth: parsedMy.month,
        operationalYear: parsedMy.year,
        preset:
          parsed.preset ||
          (periodStart === defaultCurrentMonth.periodStart &&
          periodEnd === defaultCurrentMonth.periodEnd
            ? 'mes_atual'
            : 'personalizado'),
        periodStart: periodStart || defaultCurrentMonth.periodStart,
        periodEnd: periodEnd || defaultCurrentMonth.periodEnd,
      };
    }
  } catch {
    // ignore storage read errors
  }
  return {
    operationalMonth: currentMonthNum,
    operationalYear: currentYearNum,
    preset: 'mes_atual',
    periodStart: defaultCurrentMonth.periodStart,
    periodEnd: defaultCurrentMonth.periodEnd,
  };
}

const AUTH_SESSION_KEY = 'enigma_auth_session_v2';

const EnigmaContext = createContext<EnigmaContextValue | null>(null);

export const EnigmaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('entradas');
  const [navFocus, setNavFocus] = useState<NavigationFocus>({});
  const [usdtBrlRate, setUsdtBrlRateState] = useState<number>(() => getUsdtBrlRate());
  const [eurUsdtRate, setEurUsdtRateState] = useState<number>(() => getEurUsdtRate());
  const [currencyDisplayMode, setCurrencyDisplayModeState] = useState<CurrencyDisplayMode>(() =>
    getCurrencyDisplayMode()
  );
  const [systemVersion, setSystemVersionState] = useState<AppSystemVersionId>(() => {
    try {
      const saved = localStorage.getItem(SYSTEM_VERSION_STORAGE_KEY) as AppSystemVersionId | null;
      if (
        saved === 'v1_bancos_pix' ||
        saved === 'v1_5_hibrido' ||
        saved === 'v2_cripto_offshore'
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'v2_cripto_offshore';
  });
  const [operatorPreferredExchange, setOperatorPreferredExchangeState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(OPERATOR_EXCHANGE_STORAGE_KEY);
      if (saved && saved.trim()) return saved;
    } catch {
      // ignore
    }
    return 'OKX';
  });

  const setUsdtBrlRate = (rate: number) => {
    const clean = setUsdtBrlRateGlobal(rate);
    setUsdtBrlRateState(clean);
  };

  const setEurUsdtRate = (rate: number) => {
    const clean = setEurUsdtRateGlobal(rate);
    setEurUsdtRateState(clean);
  };

  // Busca automática da cotação real USDT/BRL e EUR/USDT na inicialização (quando em v2.0 ou v1.5)
  useEffect(() => {
    if (systemVersion === 'v1_bancos_pix') return;
    let cancelled = false;
    (async () => {
      try {
        const [usdtRes, eurRes] = await Promise.allSettled([
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT'),
        ]);
        if (cancelled) return;
        let updatedUsdt = false;
        if (usdtRes.status === 'fulfilled' && usdtRes.value.ok) {
          const data = await usdtRes.value.json();
          const price = Number(data?.price);
          if (Number.isFinite(price) && price > 3 && price < 10) {
            setUsdtBrlRate(price);
            updatedUsdt = true;
          }
        }
        if (eurRes.status === 'fulfilled' && eurRes.value.ok) {
          const data = await eurRes.value.json();
          const price = Number(data?.price);
          if (Number.isFinite(price) && price > 0.7 && price < 2) {
            setEurUsdtRate(price);
          }
        }
        if (!updatedUsdt) {
          const fallbackRes = await fetch(
            'https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-USD'
          );
          if (!cancelled && fallbackRes.ok) {
            const fb = await fallbackRes.json();
            const usdBid = Number(fb?.USDBRL?.bid);
            const eurBid = Number(fb?.EURUSD?.bid);
            if (Number.isFinite(usdBid) && usdBid > 3) setUsdtBrlRate(usdBid);
            if (Number.isFinite(eurBid) && eurBid > 0.7) setEurUsdtRate(eurBid);
          }
        }
      } catch {
        // Offline / bloqueado: mantém a cotação salva localmente (5,48 padrão)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [systemVersion]);

  const setCurrencyDisplayMode = (mode: CurrencyDisplayMode) => {
    const clean = setCurrencyDisplayModeGlobal(mode);
    setCurrencyDisplayModeState(clean);
  };

  const setOperatorPreferredExchange = (exchangeName: string) => {
    const clean = exchangeName.trim() || 'OKX';
    setOperatorPreferredExchangeState(clean);
    try {
      localStorage.setItem(OPERATOR_EXCHANGE_STORAGE_KEY, clean);
    } catch {
      // ignore
    }
  };
  const initialUsersRepo = useMemo(() => loadUsersFromRepository(), []);
  const initialCatalogRepo = useMemo(() => loadCatalogFromRepository(), []);

  const [isProductionCleanMode, setIsProductionCleanMode] = useState<boolean>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return true;
    if (PROJECT_DATABASE_BOOT_MODE === 'force_demo_seed') return false;
    try {
      return localStorage.getItem(PRODUCTION_BASE_MODE_STORAGE_KEY) === 'production_clean';
    } catch {
      return false;
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') {
      return buildCleanProductionState({ currentUsers: initialUsersRepo.users }).users;
    }
    return initialUsersRepo.users;
  });
  const [userPersistenceSnapshot, setUserPersistenceSnapshot] =
    useState<UserPersistenceSnapshot>(initialUsersRepo.snapshot);

  const [houseCatalog, setHouseCatalog] = useState<HouseCatalogItem[]>(
    initialCatalogRepo.houses
  );
  const [bankCatalog, setBankCatalog] = useState<BankCatalogItem[]>(
    initialCatalogRepo.banks
  );
  const [customCriteria, setCustomCriteria] = useState<CatalogCustomCriterion[]>(
    initialCatalogRepo.customCriteria
  );
  const [catalogPersistenceSnapshot, setCatalogPersistenceSnapshot] =
    useState<CatalogPersistenceSnapshot>(initialCatalogRepo.snapshot);

  const [exportRequests, setExportRequests] = useState<ExportRequestRecord[]>(() =>
    loadExportRequestsFromRepository()
  );

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed.userId) return parsed.userId;
      }
    } catch {
      // ignore
    }
    return 'admin';
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
        return true;
      }
      const rawSession = localStorage.getItem(AUTH_SESSION_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        return Boolean(parsed.isAuthenticated);
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [lastSyncedText, setLastSyncedText] = useState<string>('Última atualização há 2 min');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    tone: 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const snap = saveUsersToRepository(users);
    setUserPersistenceSnapshot(snap);
    void syncUsersToSupabasePostgres(users);
  }, [users]);

  useEffect(() => {
    const snap = saveCatalogToRepository(houseCatalog, bankCatalog, customCriteria);
    setCatalogPersistenceSnapshot(snap);
    void syncCatalogToSupabasePostgres({
      houses: houseCatalog,
      banks: bankCatalog,
      customCriteria,
    });
  }, [houseCatalog, bankCatalog, customCriteria]);

  useEffect(() => {
    saveExportRequestsToRepository(exportRequests);
  }, [exportRequests]);

  const availableHouses = useMemo(
    () => getActiveHouseNames(houseCatalog),
    [houseCatalog]
  );

  const availableBanks = useMemo(
    () => getActiveBankNames(bankCatalog),
    [bankCatalog]
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({ isAuthenticated, userId: currentUserId })
      );
    } catch {
      // ignore
    }
  }, [isAuthenticated, currentUserId]);
  const [allPartnerships, setAllPartnerships] = useState<Partnership[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).partnerships ?? INITIAL_PARTNERSHIPS;
    } catch {
      // ignore
    }
    return INITIAL_PARTNERSHIPS;
  });

  const [allHouseAccounts, setAllHouseAccounts] = useState<HouseAccount[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).houseAccounts ?? INITIAL_HOUSE_ACCOUNTS;
    } catch {
      // ignore
    }
    return INITIAL_HOUSE_ACCOUNTS;
  });

  const [allBankAccounts, setAllBankAccounts] = useState<BankAccount[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).bankAccounts ?? INITIAL_BANK_ACCOUNTS;
    } catch {
      // ignore
    }
    return INITIAL_BANK_ACCOUNTS;
  });

  const [allEntries, setAllEntries] = useState<BetEntry[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).entries ?? INITIAL_ENTRIES;
    } catch {
      // ignore
    }
    return INITIAL_ENTRIES;
  });

  const [allWithdrawals, setAllWithdrawals] = useState<Withdrawal[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).withdrawals ?? INITIAL_WITHDRAWALS;
    } catch {
      // ignore
    }
    return INITIAL_WITHDRAWALS;
  });

  const [allDeposits, setAllDeposits] = useState<DepositTransfer[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).deposits ?? INITIAL_DEPOSITS_TRANSFERS;
    } catch {
      // ignore
    }
    return INITIAL_DEPOSITS_TRANSFERS;
  });

  const [allCosts, setAllCosts] = useState<CostRecord[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).costs ?? INITIAL_COSTS;
    } catch {
      // ignore
    }
    return INITIAL_COSTS;
  });

  const [allDivergences, setAllDivergences] = useState<ReconciliationDivergence[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).divergences ?? INITIAL_DIVERGENCES;
    } catch {
      // ignore
    }
    return INITIAL_DIVERGENCES;
  });

  const [ledgerMovements, setLedgerMovements] = useState<LedgerMovement[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).ledgerMovements ?? INITIAL_LEDGER_MOVEMENTS;
    } catch {
      // ignore
    }
    return INITIAL_LEDGER_MOVEMENTS;
  });

  const [credentialLogs, setCredentialLogs] = useState<CredentialAccessLog[]>(() => {
    if (PROJECT_DATABASE_BOOT_MODE === 'force_production_clean') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).credentialLogs ?? INITIAL_CREDENTIAL_LOGS;
    } catch {
      // ignore
    }
    return INITIAL_CREDENTIAL_LOGS;
  });

  const [gsbCandidates, setGsbCandidates] = useState<GreenSureBetCandidate[]>(
    INITIAL_GREENSUREBET_CANDIDATES
  );

  // Estados globais do Período Operacional ('operationalMonth', 'operationalYear', 'periodStart' e 'periodEnd')
  const initialPeriod = useMemo(() => loadPersistedPeriodState(), []);
  const [operationalMonth, setOperationalMonthState] = useState<number>(
    initialPeriod.operationalMonth
  );
  const [operationalYear, setOperationalYearState] = useState<number>(
    initialPeriod.operationalYear
  );
  const [periodStart, setPeriodStartState] = useState<string>(initialPeriod.periodStart);
  const [periodEnd, setPeriodEndState] = useState<string>(initialPeriod.periodEnd);
  const [periodPreset, setPeriodPresetState] = useState<DateRangePreset>(initialPeriod.preset);

  useEffect(() => {
    try {
      localStorage.setItem(
        PERIOD_STORAGE_KEY,
        JSON.stringify({
          operationalMonth,
          operationalYear,
          preset: periodPreset,
          periodStart,
          periodEnd,
          startDate: periodStart,
          endDate: periodEnd,
        })
      );
      localStorage.setItem('operationalMonth', String(operationalMonth));
      localStorage.setItem('operationalYear', String(operationalYear));
      localStorage.setItem('periodStart', periodStart);
      localStorage.setItem('periodEnd', periodEnd);
    } catch {
      // ignore quota errors
    }
  }, [operationalMonth, operationalYear, periodStart, periodEnd, periodPreset]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          partnerships: allPartnerships,
          houseAccounts: allHouseAccounts,
          bankAccounts: allBankAccounts,
          entries: allEntries,
          withdrawals: allWithdrawals,
          deposits: allDeposits,
          costs: allCosts,
          divergences: allDivergences,
          ledgerMovements,
          credentialLogs,
          periodStart,
          periodEnd,
          periodPreset,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    allPartnerships,
    allHouseAccounts,
    allBankAccounts,
    allEntries,
    allWithdrawals,
    allDeposits,
    allCosts,
    allDivergences,
    ledgerMovements,
    credentialLogs,
    periodStart,
    periodEnd,
    periodPreset,
  ]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || users[0],
    [users, currentUserId]
  );

  const pendingUsers = useMemo(
    () => users.filter((u) => u.status === 'pendente'),
    [users]
  );

  const pendingUsersCount = pendingUsers.length;

  const handleSetCurrentUserId = (id: string) => {
    const nextUser = users.find((u) => u.id === id && u.status === 'ativo');
    if (!nextUser) return;
    setCurrentUserId(id);
    if (nextUser.role === 'operador' && activeScreen === 'equipe') {
      setActiveScreenState('minha_performance');
    } else if (nextUser.role === 'admin' && activeScreen === 'minha_performance') {
      setActiveScreenState('equipe');
    }
  };

  const setActiveScreen = (screen: ScreenId, focus?: NavigationFocus) => {
    setActiveScreenState(screen);
    if (focus) {
      setNavFocus(focus);
    }
  };

  const clearNavFocus = () => setNavFocus({});

  const notify = (tone: 'success' | 'warning' | 'error', message: string) => {
    setFeedbackBanner({ tone, message });
  };

  const clearFeedback = () => setFeedbackBanner(null);

  const startDate = periodStart;
  const endDate = periodEnd;

  const dateFilter = useMemo<DateRangeFilter>(
    () => ({
      preset: periodPreset,
      periodStart,
      periodEnd,
      startDate: periodStart,
      endDate: periodEnd,
    }),
    [periodPreset, periodStart, periodEnd]
  );

  const isDateFilterActive = Boolean(periodStart.trim() || periodEnd.trim());

  const activePeriodLabel = useMemo(
    () => formatPeriodRangeLabel(periodStart, periodEnd),
    [periodStart, periodEnd]
  );

  const setPeriodRange = (
    nextPeriodStart: string,
    nextPeriodEnd: string,
    preset: DateRangePreset = 'personalizado'
  ) => {
    const normalized = normalizePeriodBounds(nextPeriodStart, nextPeriodEnd);
    if (!normalized.periodStart && !normalized.periodEnd) {
      setPeriodPresetState('todo_periodo');
      setPeriodStartState('');
      setPeriodEndState('');
      return;
    }
    const currentMonth = getCurrentMonthPeriod();
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthPeriod = getCurrentMonthPeriod(prevMonthDate);
    let resolvedPreset: DateRangePreset = preset;
    if (preset === 'personalizado') {
      if (
        normalized.periodStart === currentMonth.periodStart &&
        normalized.periodEnd === currentMonth.periodEnd
      ) {
        resolvedPreset = 'mes_atual';
      } else if (
        normalized.periodStart === prevMonthPeriod.periodStart &&
        normalized.periodEnd === prevMonthPeriod.periodEnd
      ) {
        resolvedPreset = 'mes_anterior';
      } else if (
        normalized.periodStart === '2026-10-01' &&
        normalized.periodEnd === '2026-10-31'
      ) {
        resolvedPreset = 'mes_outubro';
      } else if (
        normalized.periodStart === '2026-09-01' &&
        normalized.periodEnd === '2026-09-30'
      ) {
        resolvedPreset = 'mes_setembro';
      } else if (
        normalized.periodStart === '2026-08-01' &&
        normalized.periodEnd === '2026-08-31'
      ) {
        resolvedPreset = 'mes_agosto';
      }
    }
    setPeriodPresetState(resolvedPreset);
    setPeriodStartState(normalized.periodStart);
    setPeriodEndState(normalized.periodEnd);
    const parsedMy = parseOperationalMonthYear(normalized.periodStart, normalized.periodEnd);
    setOperationalMonthState(parsedMy.month);
    setOperationalYearState(parsedMy.year);
  };

  const setPeriodStart = (nextPeriodStart: string) => {
    setPeriodRange(nextPeriodStart, periodEnd, 'personalizado');
  };

  const setPeriodEnd = (nextPeriodEnd: string) => {
    setPeriodRange(periodStart, nextPeriodEnd, 'personalizado');
  };

  const setOperationalMonthYear = (month: number, year: number) => {
    const bounds = getMonthYearPeriod(month, year);
    let preset: DateRangePreset = 'personalizado';
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();
    const prevDate = new Date(currentY, currentM - 2, 1);
    if (year === currentY && month === currentM) {
      preset = 'mes_atual';
    } else if (year === prevDate.getFullYear() && month === prevDate.getMonth() + 1) {
      preset = 'mes_anterior';
    } else if (year === 2026 && month === 10) preset = 'mes_outubro';
    else if (year === 2026 && month === 9) preset = 'mes_setembro';
    else if (year === 2026 && month === 8) preset = 'mes_agosto';
    setOperationalMonthState(bounds.month);
    setOperationalYearState(bounds.year);
    setPeriodPresetState(preset);
    setPeriodStartState(bounds.periodStart);
    setPeriodEndState(bounds.periodEnd);
  };

  const setOperationalMonth = (month: number) => {
    setOperationalMonthYear(month, operationalYear);
  };

  const setOperationalYear = (year: number) => {
    setOperationalMonthYear(operationalMonth, year);
  };

  const resetPeriodToCurrentMonth = () => {
    const now = new Date();
    setOperationalMonthYear(now.getMonth() + 1, now.getFullYear());
  };

  const operationalMonthYearLabel = useMemo(() => {
    return getMonthYearPeriod(operationalMonth, operationalYear).monthYearLabel;
  }, [operationalMonth, operationalYear]);

  const setDateFilterRange = setPeriodRange;
  const setStartDate = setPeriodStart;
  const setEndDate = setPeriodEnd;

  const applyDatePreset = (preset: DateRangePreset) => {
    if (preset === 'mes_atual') {
      const now = new Date();
      setOperationalMonthYear(now.getMonth() + 1, now.getFullYear());
    } else if (preset === 'mes_anterior') {
      const now = new Date();
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      setOperationalMonthYear(prev.getMonth() + 1, prev.getFullYear());
    } else if (preset === 'mes_outubro') {
      setOperationalMonthYear(10, 2026);
    } else if (preset === 'mes_setembro') {
      setOperationalMonthYear(9, 2026);
    } else if (preset === 'mes_agosto') {
      setOperationalMonthYear(8, 2026);
    } else if (preset === 'todo_periodo') {
      setPeriodRange('', '', 'todo_periodo');
    } else if (preset === 'hoje') {
      const todayIso = new Date().toISOString().slice(0, 10);
      setPeriodRange(todayIso, todayIso, 'hoje');
    } else if (preset === 'ultimos_3_dias') {
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 2);
      setPeriodRange(threeDaysAgo.toISOString().slice(0, 10), now.toISOString().slice(0, 10), 'ultimos_3_dias');
    } else if (preset === 'primeira_dezena') {
      const mm = String(operationalMonth).padStart(2, '0');
      setPeriodRange(`${operationalYear}-${mm}-01`, `${operationalYear}-${mm}-10`, 'primeira_dezena');
    }
  };

  const clearDateFilter = () => {
    const now = new Date();
    setOperationalMonthYear(now.getMonth() + 1, now.getFullYear());
  };

  // Preferências de exibição de dicas e orientações
  const [showTips, setShowTipsState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('enigma_show_tips_v1');
      if (raw !== null) return JSON.parse(raw) === true;
    } catch {
      // ignore
    }
    return true;
  });

  const [dismissedTips, setDismissedTipsState] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('enigma_dismissed_tips_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const setShowTips = (show: boolean) => {
    setShowTipsState(show);
    try {
      localStorage.setItem('enigma_show_tips_v1', JSON.stringify(show));
    } catch {
      // ignore
    }
  };

  const dismissTip = (tipId: string) => {
    setDismissedTipsState((prev) => {
      const next = prev.includes(tipId) ? prev : [...prev, tipId];
      try {
        localStorage.setItem('enigma_dismissed_tips_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const restoreAllTips = () => {
    setShowTipsState(true);
    setDismissedTipsState([]);
    try {
      localStorage.setItem('enigma_show_tips_v1', JSON.stringify(true));
      localStorage.removeItem('enigma_dismissed_tips_v1');
    } catch {
      // ignore
    }
  };

  const isTipVisible = (tipId: string) => {
    return showTips && !dismissedTips.includes(tipId);
  };

  const filteredData = useMemo(() => {
    const rbac = filterByUserPermission(currentUser, {
      partnerships: allPartnerships,
      houseAccounts: allHouseAccounts,
      bankAccounts: allBankAccounts,
      entries: allEntries,
      withdrawals: allWithdrawals,
      deposits: allDeposits,
      costs: allCosts.filter((c) => !c.reversed),
      divergences: allDivergences,
    });

    if (!periodStart && !periodEnd) {
      return rbac;
    }

    return {
      ...rbac,
      entries: rbac.entries.filter((e) =>
        isDateWithinRange(e.createdAt, periodStart, periodEnd)
      ),
      withdrawals: rbac.withdrawals.filter((w) =>
        isDateWithinRange(w.requestedAt, periodStart, periodEnd)
      ),
      deposits: rbac.deposits.filter((d) =>
        isDateWithinRange(d.createdAt, periodStart, periodEnd)
      ),
      costs: rbac.costs.filter((c) =>
        isDateWithinRange(c.date, periodStart, periodEnd)
      ),
      divergences: rbac.divergences.filter((d) =>
        isDateWithinRange(d.updatedAt, periodStart, periodEnd)
      ),
    };
  }, [
    currentUser,
    allPartnerships,
    allHouseAccounts,
    allBankAccounts,
    allEntries,
    allWithdrawals,
    allDeposits,
    allCosts,
    allDivergences,
    periodStart,
    periodEnd,
  ]);

  const filteredAllEntries = useMemo(() => {
    if (!periodStart && !periodEnd) return allEntries;
    return allEntries.filter((e) =>
      isDateWithinRange(e.createdAt, periodStart, periodEnd)
    );
  }, [allEntries, periodStart, periodEnd]);

  const filteredAllWithdrawals = useMemo(() => {
    if (!periodStart && !periodEnd) return allWithdrawals;
    return allWithdrawals.filter((w) =>
      isDateWithinRange(w.requestedAt, periodStart, periodEnd)
    );
  }, [allWithdrawals, periodStart, periodEnd]);

  const filteredAllCosts = useMemo(() => {
    const activeCosts = allCosts.filter((c) => !c.reversed);
    if (!periodStart && !periodEnd) return activeCosts;
    return activeCosts.filter((c) =>
      isDateWithinRange(c.date, periodStart, periodEnd)
    );
  }, [allCosts, periodStart, periodEnd]);

  const filteredLedgerMovements = useMemo(() => {
    if (!periodStart && !periodEnd) return ledgerMovements;
    return ledgerMovements.filter((m) =>
      isDateWithinRange(m.timestamp, periodStart, periodEnd)
    );
  }, [ledgerMovements, periodStart, periodEnd]);

  const filteredCredentialLogs = useMemo(() => {
    if (!periodStart && !periodEnd) return credentialLogs;
    return credentialLogs.filter((l) =>
      isDateWithinRange(l.timestamp, periodStart, periodEnd)
    );
  }, [credentialLogs, periodStart, periodEnd]);

  const dashboardReport = useMemo(() => buildDashboardReport(
    filterByUserPermission(currentUser, {
      partnerships: allPartnerships, houseAccounts: allHouseAccounts, bankAccounts: allBankAccounts,
      entries: allEntries, withdrawals: allWithdrawals, deposits: allDeposits,
      costs: allCosts.filter((cost) => !cost.reversed), divergences: allDivergences,
    }),
    periodStart, periodEnd,
  ), [currentUser, allPartnerships, allHouseAccounts, allBankAccounts, allEntries,
    allWithdrawals, allDeposits, allCosts, allDivergences, periodStart, periodEnd]);
  const globalSummary = dashboardReport.summary;

  const nowFormatted = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  };

  const appendMovement = (mov: Omit<LedgerMovement, 'id' | 'timestamp' | 'authorName'>) => {
    const newMov: LedgerMovement = {
      ...mov,
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowFormatted(),
      authorName: currentUser.name,
    };
    setLedgerMovements((prev) => [newMov, ...prev]);
    return newMov.id;
  };

  const triggerSyncNow = () => {
    setLastSyncedText('Sincronizada agora mesmo');
    notify('success', 'Trilha única de movimentações e saldos sincronizada.');
  };

  const resetDemoData = () => {
    const currentMonth = getCurrentMonthPeriod();
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PERIOD_STORAGE_KEY);
    localStorage.removeItem(USERS_REPOSITORY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_USERS_STORAGE_KEY);
    localStorage.removeItem(EXPORT_REQUESTS_STORAGE_KEY);
    localStorage.removeItem(CATALOG_REPOSITORY_STORAGE_KEY);
    localStorage.removeItem(PRODUCTION_BASE_MODE_STORAGE_KEY);
    localStorage.removeItem('operationalMonth');
    localStorage.removeItem('operationalYear');
    localStorage.removeItem('periodStart');
    localStorage.removeItem('periodEnd');
    setIsProductionCleanMode(false);
    const resetSnap = buildUserPersistenceSnapshot(INITIAL_USERS, nowFormatted());
    setUsers(resetSnap.users);
    setUserPersistenceSnapshot(resetSnap);
    setHouseCatalog(INITIAL_HOUSE_CATALOG);
    setBankCatalog(INITIAL_BANK_CATALOG);
    setCustomCriteria(INITIAL_CUSTOM_CRITERIA);
    setExportRequests([]);
    const now = new Date();
    const currentM = now.getMonth() + 1;
    const currentY = now.getFullYear();
    setOperationalMonthState(currentM);
    setOperationalYearState(currentY);
    setPeriodPresetState('mes_atual');
    setPeriodStartState(currentMonth.periodStart);
    setPeriodEndState(currentMonth.periodEnd);
    setAllPartnerships(INITIAL_PARTNERSHIPS);
    setAllHouseAccounts(INITIAL_HOUSE_ACCOUNTS);
    setAllBankAccounts(INITIAL_BANK_ACCOUNTS);
    setAllEntries(INITIAL_ENTRIES);
    setAllWithdrawals(INITIAL_WITHDRAWALS);
    setAllDeposits(INITIAL_DEPOSITS_TRANSFERS);
    setAllCosts(INITIAL_COSTS);
    setAllDivergences(INITIAL_DIVERGENCES);
    setLedgerMovements(INITIAL_LEDGER_MOVEMENTS);
    setCredentialLogs(INITIAL_CREDENTIAL_LOGS);
    setGsbCandidates(INITIAL_GREENSUREBET_CANDIDATES);
    notify('success', 'Dados de demonstração originais restaurados com sucesso.');
  };

  const activateCleanProductionBase = () => {
    const cleanBundle = buildCleanProductionState({
      currentUsers: users,
      currentHouseCatalog: houseCatalog,
      currentBankCatalog: bankCatalog,
      currentCustomCriteria: customCriteria,
      nowText: nowFormatted(),
    });
    try {
      localStorage.setItem(PRODUCTION_BASE_MODE_STORAGE_KEY, 'production_clean');
    } catch {
      // ignore
    }
    setIsProductionCleanMode(true);
    setUsers(cleanBundle.users);
    setCurrentUserId(cleanBundle.users[0]?.id || 'admin');
    setExportRequests([]);
    setAllPartnerships([]);
    setAllHouseAccounts([]);
    setAllBankAccounts([]);
    setAllEntries([]);
    setAllWithdrawals([]);
    setAllDeposits([]);
    setAllCosts([]);
    setAllDivergences([]);
    setLedgerMovements([]);
    setCredentialLogs([]);
    setGsbCandidates([]);
    notify(
      'success',
      'Modo Base Limpa de Produção ativado: dados fictícios zerados, conta Admin e Catálogo de Casas/Bancos preservados.'
    );
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        (window as unknown as Record<string, unknown>).__ENIGMA_PROJECT_MAINTENANCE__ = {
          bootMode: PROJECT_DATABASE_BOOT_MODE,
          activateCleanProductionBase,
          restoreDemoSeed: resetDemoData,
        };
      }
    } catch {
      // ignore
    }
  }, [users, houseCatalog, bankCatalog, customCriteria]);

  const saveBetEntry = (
    entryInput: Omit<BetEntry, 'id' | 'createdAt' | 'operatorId'>,
    existingId?: string,
    wantConclude?: boolean
  ): boolean => {
    // Valida se alguma conta vinculada está limitada para novas operações ou pertence a parceria no estoque
    if (!existingId) {
      for (const leg of entryInput.legs) {
        if (leg.accountId) {
          const acc = allHouseAccounts.find((a) => a.id === leg.accountId);
          if (acc) {
            const check = canAccountStartNewOperation(acc);
            if (!check.allowed) {
              notify('error', `${acc.label}: ${check.reason}`);
              return false;
            }
            const part = allPartnerships.find((p) => p.id === acc.partnershipId);
            if (part && part.status !== 'ativa') {
              notify(
                'error',
                `A conta ${acc.label} pertence à parceria "${part.titularName}", que está no ${
                  part.status === 'estoque' ? 'estoque' : part.status
                }. Puxe a parceria para a operação ativa antes de lançar entradas.`
              );
              return false;
            }
          }
        }
      }
    }

    const tempEntry: BetEntry = {
      ...entryInput,
      id: existingId || `entry_${Date.now()}`,
      createdAt: existingId
        ? allEntries.find((e) => e.id === existingId)?.createdAt || '11/10 12:00'
        : '11/10 12:00',
      operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
    };

    const evaluation = evaluateBetEntry(tempEntry);

    if (wantConclude && !evaluation.canConclude) {
      notify(
        'warning',
        `Para concluir financeiramente, preencha: ${evaluation.missingFields.join(', ')}. Salvo como pendente.`
      );
    }

    const willConclude = Boolean(wantConclude && evaluation.canConclude);
    const finalEntry: BetEntry = {
      ...tempEntry,
      concludedAt: willConclude ? nowFormatted() : null,
      resultStatus: willConclude
        ? 'concluida'
        : evaluation.canConclude
        ? 'aberta'
        : 'aguardando_detalhamento',
      reconciliationStatus: willConclude
        ? 'conciliada'
        : evaluation.canConclude
        ? 'pronta_para_concluir'
        : 'pendente_apuracao',
      notes: willConclude
        ? 'Concluída e conciliada'
        : evaluation.canConclude
        ? 'pronta para concluir'
        : `falta: ${evaluation.missingFields.slice(0, 2).join(', ')}`,
    };

    // Reserva stakes ou liquida saldos nas contas das casas sem contar duas vezes!
    const previousEntry = existingId ? allEntries.find((e) => e.id === existingId) : null;

    setAllHouseAccounts((prevAccounts) => {
      const next = prevAccounts.map((a) => ({ ...a }));

      // Se é uma nova entrada ainda aberta, reserva o stake do disponível da conta
      if (!previousEntry && !willConclude) {
        for (const leg of finalEntry.legs) {
          if (leg.accountId && leg.stake && leg.stake > 0) {
            const target = next.find((a) => a.id === leg.accountId);
            if (target) {
              target.availableBalance = roundCurrency(
                Math.max(0, target.availableBalance - leg.stake)
              );
              if (target.status === 'pronta') target.status = 'em_uso';
            }
          }
        }
      }

      // Se está concluindo agora:
      if (willConclude && (!previousEntry || previousEntry.resultStatus !== 'concluida')) {
        for (const leg of finalEntry.legs) {
          if (!leg.accountId || !leg.stake) continue;
          const target = next.find((a) => a.id === leg.accountId);
          if (!target) continue;

          // Se era entrada nova concluída direto, desconta a stake primeiro
          if (!previousEntry) {
            target.availableBalance = roundCurrency(
              Math.max(0, target.availableBalance - leg.stake)
            );
          }

          // Aplica o retorno conforme resultado da perna (sem contar duas vezes)
          if (leg.result === 'green' || leg.result === 'cashout' || leg.result === 'parcial') {
            const ret = leg.grossReturn || 0;
            target.availableBalance = roundCurrency(target.availableBalance + ret);
            target.informedRealBalance = target.availableBalance;
          } else if (leg.result === 'void') {
            const ret = leg.grossReturn !== null ? leg.grossReturn : leg.stake;
            target.availableBalance = roundCurrency(target.availableBalance + ret);
            target.informedRealBalance = target.availableBalance;
          }
          if (target.status === 'pronta') target.status = 'em_uso';
        }
      }

      return next;
    });

    if (existingId) {
      setAllEntries((prev) => prev.map((e) => (e.id === existingId ? finalEntry : e)));
    } else {
      setAllEntries((prev) => [finalEntry, ...prev]);
    }

    appendMovement({
      type: willConclude ? 'entrada_liquidacao_retorno' : 'entrada_reserva_stake',
      origin: finalEntry.houses.join(', ') || 'Operação',
      destination: willConclude ? 'Saldo das contas conciliado' : 'Reserva em apostas abertas',
      houseName: finalEntry.houses[0] || null,
      partnershipId: finalEntry.legs[0]?.partnershipId || null,
      houseAccountId: finalEntry.legs[0]?.accountId || null,
      bankAccountId: null,
      amount: evaluation.totalStake,
      operatorId: finalEntry.operatorId,
      status: willConclude ? 'conciliado' : 'pendente',
      referenceId: finalEntry.id,
      notes: willConclude
        ? `Entrada concluída com P/L líquido de ${formatCurrencyBRL(evaluation.netProfit || 0)}`
        : `Entrada registrada (${finalEntry.notes})`,
    });

    notify(
      'success',
      willConclude
        ? `Entrada concluída! Lucro líquido: ${formatCurrencyBRL(evaluation.netProfit || 0)}.`
        : 'Entrada salva na fila de acompanhamento.'
    );
    return true;
  };

  const concludeBetEntry = (entryId: string): boolean => {
    const entry = allEntries.find((e) => e.id === entryId);
    if (!entry) return false;
    const evaluation = evaluateBetEntry(entry);
    if (!evaluation.canConclude) {
      notify(
        'warning',
        `Ainda faltam dados obrigatórios para concluir: ${evaluation.missingFields.join(', ')}.`
      );
      return false;
    }
    return saveBetEntry(
      {
        mode: entry.mode,
        operationType: entry.operationType,
        houses: entry.houses,
        event: entry.event,
        market: entry.market,
        concludedAt: nowFormatted(),
        origin: entry.origin,
        totalInvestedCapital: evaluation.totalStake,
        resultStatus: 'concluida',
        reconciliationStatus: 'conciliada',
        simpleResultHint: entry.simpleResultHint,
        legs: entry.legs,
        notes: 'Concluída e conciliada',
      },
      entry.id,
      true
    );
  };

  const addLegToEntry = (entryId: string, leg: Omit<BetLeg, 'id' | 'createdAt'>) => {
    const entry = allEntries.find((e) => e.id === entryId);
    if (!entry) return;
    if (leg.accountId) {
      const acc = allHouseAccounts.find((a) => a.id === leg.accountId);
      if (acc) {
        const check = canAccountStartNewOperation(acc);
        if (!check.allowed) {
          notify('error', `${acc.label}: ${check.reason}`);
          return;
        }
        const part = allPartnerships.find((p) => p.id === acc.partnershipId);
        if (part && part.status !== 'ativa') {
          notify(
            'error',
            `A conta ${acc.label} pertence à parceria "${part.titularName}", que está no ${
              part.status === 'estoque' ? 'estoque' : part.status
            }. Puxe a parceria para a operação ativa antes de adicionar pernas.`
          );
          return;
        }
      }
    }

    const newLeg: BetLeg = {
      ...leg,
      id: `leg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      createdAt: nowFormatted(),
    };

    const nextLegs = [...entry.legs, newLeg];
    const nextHouses = Array.from(new Set([...entry.houses, leg.houseName].filter(Boolean)));
    const nextTotalStake = nextLegs.reduce((sum, l) => sum + (l.stake || 0), 0);

    // Reserva o stake da nova perna na conta da casa correspondente
    if (leg.accountId && leg.stake && leg.stake > 0) {
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === leg.accountId
            ? {
                ...a,
                availableBalance: roundCurrency(Math.max(0, a.availableBalance - leg.stake!)),
              }
            : a
        )
      );
    }

    const updated: BetEntry = {
      ...entry,
      houses: nextHouses,
      legs: nextLegs,
      totalInvestedCapital: nextTotalStake,
    };
    const ev = evaluateBetEntry(updated);
    updated.reconciliationStatus = ev.canConclude ? 'pronta_para_concluir' : 'pendente_apuracao';
    updated.notes = ev.canConclude
      ? 'pronta para concluir'
      : `falta: ${ev.missingFields.slice(0, 2).join(', ')}`;

    setAllEntries((prev) => prev.map((e) => (e.id === entryId ? updated : e)));
    notify('success', `Perna "${leg.label}" adicionada à operação.`);
  };

  const toggleGsbCandidate = (id: string) => {
    setGsbCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const importSelectedGsbCandidates = () => {
    const selected = gsbCandidates.filter((c) => c.selected);
    if (selected.length === 0) {
      notify('warning', 'Selecione ao menos uma entrada na prévia para importar.');
      return;
    }

    const newEntries: BetEntry[] = selected.map((c, idx) => ({
      id: `entry_gsb_${Date.now()}_${idx}`,
      mode: 'detalhado',
      operationType: 'ao_vivo',
      houses: c.platforms,
      event: `Operação GreenSureBet (${c.platforms.join(' x ')})`,
      market: 'Surebet Automatizada',
      createdAt: c.datetime,
      concludedAt: c.datetime,
      operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
      origin: 'GreenSureBet',
      totalInvestedCapital: c.stake,
      resultStatus: 'concluida',
      reconciliationStatus: 'conciliada',
      simpleResultHint: null,
      notes: 'Importada do GreenSureBet',
      legs: [
        {
          id: `leg_gsb_${Date.now()}_${idx}_1`,
          label: 'Perna Vencedora',
          houseName: c.platforms[0] || 'Pinnacle',
          partnershipId: 'parc_joao',
          accountId: 'acc_pin_joao',
          selection: 'Linha Principal',
          odd: 2.02,
          stake: roundCurrency(c.stake / 2),
          result: 'green',
          grossReturn: roundCurrency(c.stake + c.pl),
          createdAt: c.datetime,
        },
        {
          id: `leg_gsb_${Date.now()}_${idx}_2`,
          label: 'Perna Cobertura',
          houseName: c.platforms[1] || '7games',
          partnershipId: 'parc_maria',
          accountId: 'acc_kto_maria',
          selection: 'Linha Oposta',
          odd: 2.04,
          stake: roundCurrency(c.stake / 2),
          result: 'red',
          grossReturn: 0,
          createdAt: c.datetime,
        },
      ],
    }));

    const totalNetAdded = roundCurrency(selected.reduce((s, c) => s + c.pl, 0));

    setAllEntries((prev) => [...newEntries, ...prev]);
    setAllHouseAccounts((prev) =>
      prev.map((a) =>
        a.id === 'acc_pin_joao'
          ? {
              ...a,
              availableBalance: roundCurrency(a.availableBalance + totalNetAdded),
              informedRealBalance: roundCurrency(a.availableBalance + totalNetAdded),
            }
          : a
      )
    );
    setGsbCandidates((prev) => prev.filter((c) => !c.selected));
    notify(
      'success',
      `${selected.length} entrada(s) importada(s) do GreenSureBet (+${formatCurrencyBRL(
        totalNetAdded
      )} no líquido).`
    );
  };

  const createWithdrawal = (params: {
    houseAccountId: string;
    destinationBankId: string;
    amount: number;
    requestedAt: string;
    facialCosts: number[];
    noCostConfirmed: boolean;
    initialStage: 'solicitado' | 'concluido_casa';
    cryptoRoute?: CryptoRouteMetadata;
  }): boolean => {
    const acc = allHouseAccounts.find((a) => a.id === params.houseAccountId);
    const bank = allBankAccounts.find((b) => b.id === params.destinationBankId);
    if (!acc || !bank) {
      notify('error', 'Selecione uma conta de origem e o banco da parceria.');
      return false;
    }
    const part = allPartnerships.find((p) => p.id === acc.partnershipId);
    if (part && part.status !== 'ativa') {
      notify(
        'error',
        `A conta ${acc.label} pertence à parceria "${part.titularName}", que está no ${
          part.status === 'estoque' ? 'estoque' : part.status
        }. Puxe a parceria para a operação ativa antes de solicitar saques.`
      );
      return false;
    }
    if (params.amount <= 0 || params.amount > acc.availableBalance) {
      notify(
        'error',
        `Valor inválido ou superior ao saldo disponível na casa (${formatCurrencyBRL(
          acc.availableBalance
        )}).`
      );
      return false;
    }

    const newW: Withdrawal = {
      id: `wd_${Date.now()}`,
      houseAccountId: acc.id,
      partnershipId: acc.partnershipId,
      destinationBankId: bank.id,
      amount: roundCurrency(params.amount),
      receivedAmount: null,
      feeAmount: 0,
      facialCosts: params.facialCosts.filter((v) => v > 0),
      noCostConfirmed: params.noCostConfirmed,
      stage: params.initialStage,
      issueType: 'nenhum',
      issueNotes:
        params.initialStage === 'concluido_casa'
          ? 'Concluído na casa · aguardando crédito no banco'
          : '',
      priority: params.amount >= 2000 ? 'alta' : 'media',
      requestedAt: params.requestedAt || nowFormatted(),
      houseCompletedAt: params.initialStage === 'concluido_casa' ? nowFormatted() : null,
      bankReceivedAt: null,
      hoursElapsed: 0,
      operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
      cryptoRoute: params.cryptoRoute ? { ...params.cryptoRoute } : undefined,
    };

    // Desconta saldo disponível da casa e passa para Em trânsito (saques)
    setAllHouseAccounts((prev) =>
      prev.map((a) =>
        a.id === acc.id
          ? {
              ...a,
              availableBalance: roundCurrency(a.availableBalance - newW.amount),
              informedRealBalance: roundCurrency(a.availableBalance - newW.amount),
              status: a.status === 'limitada' ? 'limitada' : 'aguardando_saque',
            }
          : a
      )
    );

    setAllWithdrawals((prev) => [newW, ...prev]);

    // Lança custos automáticos das faciais usadas no saque
    if (newW.facialCosts.length > 0 && !newW.noCostConfirmed) {
      const newCosts: CostRecord[] = newW.facialCosts.map((val, idx) => ({
        id: `cost_wd_${Date.now()}_${idx}`,
        category: 'Saques',
        detail: `Facial ${idx + 1} · ${acc.label}`,
        amount: roundCurrency(val),
        date: '11/10',
        operatorId: newW.operatorId,
        paidByOperatorId: newW.operatorId,
        origin: 'Automático (saque)',
        partnershipId: acc.partnershipId,
        houseAccountId: acc.id,
        withdrawalId: newW.id,
        reversed: false,
        reversalReason: null,
      }));
      setAllCosts((prev) => [...newCosts, ...prev]);
    }

    appendMovement({
      type:
        params.initialStage === 'concluido_casa' ? 'saque_concluido_casa' : 'saque_solicitado',
      origin: acc.label,
      destination: bank.label,
      houseName: acc.houseName,
      partnershipId: acc.partnershipId,
      houseAccountId: acc.id,
      bankAccountId: bank.id,
      amount: newW.amount,
      operatorId: newW.operatorId,
      status: 'em_transito',
      referenceId: newW.id,
      notes: `Saque ${
        params.initialStage === 'concluido_casa' ? 'concluído na casa (em trânsito)' : 'solicitado'
      }`,
    });

    if (
      params.initialStage === 'concluido_casa' &&
      newW.facialCosts.length === 0 &&
      !newW.noCostConfirmed
    ) {
      notify(
        'warning',
        'Saque concluído na casa (em trânsito até o banco), mas ficou com pendência de facial não informada!'
      );
    } else {
      notify(
        'success',
        `Saque de ${formatCurrencyBRL(newW.amount)} registrado em trânsito até confirmação no banco.`
      );
    }
    return true;
  };

  const advanceWithdrawalStage = (
    withdrawalId: string,
    nextStage: WithdrawalStage,
    options?: {
      receivedAmount?: number;
      feeAmount?: number;
      issueType?: WithdrawalIssueType;
      issueNotes?: string;
    }
  ) => {
    const w = allWithdrawals.find((item) => item.id === withdrawalId);
    if (!w) return;

    const acc = allHouseAccounts.find((a) => a.id === w.houseAccountId);
    const bank = allBankAccounts.find((b) => b.id === w.destinationBankId);

    const fee = roundCurrency(options?.feeAmount || 0);
    const netReceived =
      options?.receivedAmount !== undefined
        ? roundCurrency(options.receivedAmount)
        : roundCurrency(w.amount - fee);

    setAllWithdrawals((prev) =>
      prev.map((item) => {
        if (item.id !== withdrawalId) return item;
        return {
          ...item,
          stage: nextStage,
          receivedAmount: nextStage === 'recebido_banco' ? netReceived : item.receivedAmount,
          feeAmount: fee > 0 ? fee : item.feeAmount,
          issueType: options?.issueType ?? (nextStage === 'recebido_banco' ? 'nenhum' : item.issueType),
          issueNotes: options?.issueNotes ?? item.issueNotes,
          houseCompletedAt:
            nextStage === 'concluido_casa' && !item.houseCompletedAt
              ? nowFormatted()
              : item.houseCompletedAt,
          bankReceivedAt: nextStage === 'recebido_banco' ? nowFormatted() : item.bankReceivedAt,
        };
      })
    );

    if (nextStage === 'recebido_banco' && isWithdrawalInTransit(w)) {
      // Credita no banco de destino!
      setAllBankAccounts((prev) =>
        prev.map((b) =>
          b.id === w.destinationBankId
            ? {
                ...b,
                balance: roundCurrency(b.balance + netReceived),
                informedRealBalance: roundCurrency((b.informedRealBalance ?? b.balance) + netReceived),
                lastReconciledAt: nowFormatted(),
              }
            : b
        )
      );

      // Se houve tarifa efetivamente cobrada, registra como custo (apenas a tarifa é custo!)
      if (fee > 0) {
        const feeCost: CostRecord = {
          id: `cost_fee_${Date.now()}`,
          category: 'Saques',
          detail: `Tarifa de saque · ${acc?.label || 'Casa'}`,
          amount: fee,
          date: '11/10',
          operatorId: w.operatorId,
          paidByOperatorId: w.operatorId,
          origin: 'Automático (tarifa)',
          partnershipId: w.partnershipId,
          houseAccountId: w.houseAccountId,
          withdrawalId: w.id,
          reversed: false,
          reversalReason: null,
        };
        setAllCosts((prev) => [feeCost, ...prev]);
      }

      // Atualiza status da conta da casa se estava aguardando saque
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === w.houseAccountId && a.status === 'aguardando_saque'
            ? { ...a, status: a.availableBalance > 0 ? 'em_uso' : 'pronta' }
            : a
        )
      );

      appendMovement({
        type: 'saque_recebido_banco',
        origin: acc?.label || 'Conta Casa',
        destination: bank?.label || 'Banco Parceria',
        houseName: acc?.houseName || null,
        partnershipId: w.partnershipId,
        houseAccountId: w.houseAccountId,
        bankAccountId: w.destinationBankId,
        amount: netReceived,
        operatorId: w.operatorId,
        status: 'conciliado',
        referenceId: w.id,
        notes:
          fee > 0
            ? `Saque recebido e conciliado no banco (${formatCurrencyBRL(
                netReceived
              )}, tarifa de ${formatCurrencyBRL(fee)} lançada em Custos).`
            : `Saque de ${formatCurrencyBRL(netReceived)} confirmado no banco e conciliado.`,
      });

      notify(
        'success',
        `Saque confirmado no banco (${bank?.label}): +${formatCurrencyBRL(netReceived)} conciliado.`
      );
    } else if (nextStage === 'devolvido_casa' && isWithdrawalInTransit(w)) {
      // Estorna o valor de volta para a conta da casa
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === w.houseAccountId
            ? {
                ...a,
                availableBalance: roundCurrency(a.availableBalance + w.amount),
                informedRealBalance: roundCurrency(a.availableBalance + w.amount),
              }
            : a
        )
      );

      appendMovement({
        type: 'saque_devolvido_casa',
        origin: 'Trânsito de Saque',
        destination: acc?.label || 'Conta Casa',
        houseName: acc?.houseName || null,
        partnershipId: w.partnershipId,
        houseAccountId: w.houseAccountId,
        bankAccountId: w.destinationBankId,
        amount: w.amount,
        operatorId: w.operatorId,
        status: 'conciliado',
        referenceId: w.id,
        notes: `Saque falhou e retornou ao saldo disponível da casa (${options?.issueNotes || ''}).`,
      });

      notify('warning', `Saque devolvido: ${formatCurrencyBRL(w.amount)} retornou para ${acc?.label}.`);
    } else {
      notify('success', `Situação do saque atualizada para: ${nextStage.replace('_', ' ')}.`);
    }
  };

  const registerStandaloneFacial = (params: {
    houseAccountId: string;
    amount: number;
    kind: 'Semanal' | 'Avulsa';
  }) => {
    const acc = allHouseAccounts.find((a) => a.id === params.houseAccountId);
    if (!acc || params.amount <= 0) {
      notify('error', 'Informe uma conta válida e o valor da facial.');
      return;
    }

    const newCost: CostRecord = {
      id: `cost_facial_${Date.now()}`,
      category: 'Saques',
      detail: `Facial ${params.kind.toLowerCase()} · ${acc.label}`,
      amount: roundCurrency(params.amount),
      date: '11/10',
      operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
      paidByOperatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
      origin: 'Automático (facial)',
      partnershipId: acc.partnershipId,
      houseAccountId: acc.id,
      withdrawalId: null,
      reversed: false,
      reversalReason: null,
    };

    setAllCosts((prev) => [newCost, ...prev]);
    setAllHouseAccounts((prev) =>
      prev.map((a) =>
        a.id === acc.id
          ? {
              ...a,
              weeklyFacialPending: false,
              weeklyFacialDue: 'Concluída nesta semana',
              notes: a.notes.includes('facial') ? 'Facial semanal em dia' : a.notes,
            }
          : a
      )
    );

    // Se havia saque sem facial para essa parceria/conta, marca como resolvido
    setAllWithdrawals((prev) =>
      prev.map((w) =>
        w.houseAccountId === acc.id && w.facialCosts.length === 0
          ? { ...w, facialCosts: [roundCurrency(params.amount)] }
          : w
      )
    );

    notify(
      'success',
      `Custo de ${formatCurrencyBRL(params.amount)} lançado e facial marcada como feita em ${acc.label}.`
    );
  };

  const createDepositOrTransfer = (params: {
    type: 'deposito_casa' | 'transferencia_bancos';
    originBankId: string;
    destinationHouseAccountId?: string | null;
    destinationBankId?: string | null;
    amount: number;
    feeAmount?: number;
    status: 'pretendido' | 'enviado' | 'confirmado';
    notes: string;
    cryptoRoute?: CryptoRouteMetadata;
  }): boolean => {
    const originBank = allBankAccounts.find((b) => b.id === params.originBankId);
    if (!originBank || params.amount <= 0) {
      notify('error', 'Informe o banco de origem e um valor válido.');
      return false;
    }

    if (params.type === 'deposito_casa' && params.destinationHouseAccountId) {
      const destAcc = allHouseAccounts.find((a) => a.id === params.destinationHouseAccountId);
      if (!destAcc) {
        notify('error', 'Selecione a conta da casa de destino.');
        return false;
      }
      const check = canAccountStartNewOperation(destAcc);
      if (!check.allowed) {
        notify('error', `${destAcc.label}: ${check.reason}`);
        return false;
      }
      const part = allPartnerships.find((p) => p.id === destAcc.partnershipId);
      if (part && part.status !== 'ativa') {
        notify(
          'error',
          `A conta de destino pertence à parceria "${part.titularName}", que está no ${
            part.status === 'estoque' ? 'estoque' : part.status
          }. Puxe a parceria para a operação ativa antes de realizar depósitos.`
        );
        return false;
      }
    }

    const fee = roundCurrency(params.feeAmount || 0);
    const dep: DepositTransfer = {
      id: `dep_${Date.now()}`,
      type: params.type,
      originBankId: originBank.id,
      destinationHouseAccountId: params.destinationHouseAccountId || null,
      destinationBankId: params.destinationBankId || null,
      partnershipId: originBank.partnershipId,
      amount: roundCurrency(params.amount),
      feeAmount: fee,
      status: params.status,
      cryptoRoute: params.cryptoRoute ? { ...params.cryptoRoute } : undefined,
      createdAt: nowFormatted(),
      confirmedAt: params.status === 'confirmado' ? nowFormatted() : null,
      operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
      originTag: 'Manual',
      notes: params.notes,
    };

    setAllDeposits((prev) => [dep, ...prev]);

    if (params.status === 'confirmado') {
      // Atualiza banco de origem e casa/banco de destino (transferência NÃO é lucro nem custo, exceto tarifa real)
      setAllBankAccounts((prev) =>
        prev.map((b) => {
          if (b.id === originBank.id) {
            const nextBal = roundCurrency(Math.max(0, b.balance - dep.amount - fee));
            return { ...b, balance: nextBal, informedRealBalance: nextBal };
          }
          if (params.type === 'transferencia_bancos' && b.id === params.destinationBankId) {
            const nextBal = roundCurrency(b.balance + dep.amount);
            return { ...b, balance: nextBal, informedRealBalance: nextBal };
          }
          return b;
        })
      );

      if (params.type === 'deposito_casa' && params.destinationHouseAccountId) {
        setAllHouseAccounts((prev) =>
          prev.map((a) =>
            a.id === params.destinationHouseAccountId
              ? {
                  ...a,
                  availableBalance: roundCurrency(a.availableBalance + dep.amount),
                  informedRealBalance: roundCurrency(a.availableBalance + dep.amount),
                  status: 'em_uso',
                }
              : a
          )
        );
      }

      if (fee > 0) {
        setAllCosts((prev) => [
          {
            id: `cost_dep_fee_${Date.now()}`,
            category: 'Fintech',
            detail: `Tarifa bancária de transferência · ${originBank.label}`,
            amount: fee,
            date: '11/10',
            operatorId: dep.operatorId,
            paidByOperatorId: dep.operatorId,
            origin: 'Automático (tarifa)',
            partnershipId: dep.partnershipId,
            houseAccountId: dep.destinationHouseAccountId,
            withdrawalId: null,
            reversed: false,
            reversalReason: null,
          },
          ...prev,
        ]);
      }

      appendMovement({
        type: params.type === 'deposito_casa' ? 'deposito_casa' : 'transferencia_bancaria',
        origin: originBank.label,
        destination:
          params.type === 'deposito_casa'
            ? allHouseAccounts.find((a) => a.id === params.destinationHouseAccountId)?.label ||
              'Conta Casa'
            : allBankAccounts.find((b) => b.id === params.destinationBankId)?.label || 'Banco',
        houseName:
          allHouseAccounts.find((a) => a.id === params.destinationHouseAccountId)?.houseName ||
          null,
        partnershipId: dep.partnershipId,
        houseAccountId: dep.destinationHouseAccountId,
        bankAccountId: originBank.id,
        amount: dep.amount,
        operatorId: dep.operatorId,
        status: 'conciliado',
        referenceId: dep.id,
        notes: `Movimentação confirmada (${params.notes || 'Transferência de capital'}).`,
      });
    }

    notify(
      'success',
      params.status === 'confirmado'
        ? `Depósito/transferência de ${formatCurrencyBRL(dep.amount)} confirmado e saldos atualizados.`
        : `Depósito pretendido de ${formatCurrencyBRL(dep.amount)} registrado em Pendências.`
    );
    return true;
  };

  const confirmPendingDeposit = (depositId: string) => {
    const dep = allDeposits.find((d) => d.id === depositId);
    if (!dep || dep.status === 'confirmado') return;

    setAllDeposits((prev) =>
      prev.map((d) =>
        d.id === depositId ? { ...d, status: 'confirmado', confirmedAt: nowFormatted() } : d
      )
    );

    setAllBankAccounts((prev) =>
      prev.map((b) =>
        b.id === dep.originBankId
          ? {
              ...b,
              balance: roundCurrency(Math.max(0, b.balance - dep.amount)),
              informedRealBalance: roundCurrency(Math.max(0, b.balance - dep.amount)),
            }
          : b
      )
    );

    if (dep.destinationHouseAccountId) {
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === dep.destinationHouseAccountId
            ? {
                ...a,
                availableBalance: roundCurrency(a.availableBalance + dep.amount),
                informedRealBalance: roundCurrency(a.availableBalance + dep.amount),
                status: 'em_uso',
                notes: 'Depósito confirmado',
              }
            : a
        )
      );
    }

    const originBank = allBankAccounts.find((b) => b.id === dep.originBankId);
    const destHouse = allHouseAccounts.find((a) => a.id === dep.destinationHouseAccountId);

    appendMovement({
      type: 'deposito_casa',
      origin: originBank?.label || 'Banco',
      destination: destHouse?.label || 'Casa',
      houseName: destHouse?.houseName || null,
      partnershipId: dep.partnershipId,
      houseAccountId: dep.destinationHouseAccountId,
      bankAccountId: dep.originBankId,
      amount: dep.amount,
      operatorId: dep.operatorId,
      status: 'conciliado',
      referenceId: dep.id,
      notes: `Depósito confirmado na casa (${dep.notes}).`,
    });

    notify(
      'success',
      `Depósito de ${formatCurrencyBRL(dep.amount)} confirmado em ${destHouse?.label || 'casa'}!`
    );
  };

  const updateInformedRealBalance = (
    targetType: 'casa' | 'banco',
    targetId: string,
    realBalance: number | null
  ) => {
    // Regra: NÃO alterar automaticamente o saldo previsto para forçar a conferência a bater!
    if (targetType === 'banco') {
      const bank = allBankAccounts.find((b) => b.id === targetId);
      if (!bank) return;
      setAllBankAccounts((prev) =>
        prev.map((b) =>
          b.id === targetId
            ? { ...b, informedRealBalance: realBalance, lastReconciledAt: nowFormatted() }
            : b
        )
      );

      if (realBalance !== null) {
        const diff = roundCurrency(realBalance - bank.balance);
        if (Math.abs(diff) >= 0.01) {
          setAllDivergences((prev) => {
            const existing = prev.find((d) => d.targetId === targetId && d.targetType === 'banco');
            if (existing) {
              return prev.map((d) =>
                d.id === existing.id
                  ? {
                      ...d,
                      realBalance,
                      difference: diff,
                      status: 'aberta',
                      updatedAt: nowFormatted(),
                    }
                  : d
              );
            }
            const newDiv: ReconciliationDivergence = {
              id: `div_${Date.now()}`,
              targetType: 'banco',
              targetId,
              targetLabel: `${bank.label} (banco)`,
              partnershipId: bank.partnershipId,
              operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
              expectedBalance: bank.balance,
              realBalance,
              difference: diff,
              status: 'aberta',
              classification: 'nao_classificada',
              justification: 'Diferença apurada na conferência de saldo bancário.',
              responsibleName: currentUser.name,
              updatedAt: nowFormatted(),
              contextHint: `Saldo previsto: ${formatCurrencyBRL(
                bank.balance
              )}. Saldo real digitado: ${formatCurrencyBRL(realBalance)}.`,
              history: [
                {
                  id: `dh_${Date.now()}`,
                  timestamp: nowFormatted(),
                  author: currentUser.name,
                  classification: 'nao_classificada',
                  note: `Informado saldo real de ${formatCurrencyBRL(realBalance)} (diferença ${formatCurrencyBRL(
                    diff
                  )}).`,
                  status: 'aberta',
                },
              ],
            };
            return [newDiv, ...prev];
          });
        } else {
          // Se bateu com o saldo previsto, marca divergência aberta como resolvida preservando o histórico
          setAllDivergences((prev) =>
            prev.map((d) =>
              d.targetId === targetId && d.targetType === 'banco' && d.status !== 'resolvida'
                ? {
                    ...d,
                    realBalance,
                    difference: 0,
                    status: 'resolvida',
                    updatedAt: nowFormatted(),
                    history: [
                      ...d.history,
                      {
                        id: `dh_${Date.now()}`,
                        timestamp: nowFormatted(),
                        author: currentUser.name,
                        classification: d.classification,
                        note: 'Saldo real conferido e igual ao saldo previsto.',
                        status: 'resolvida',
                      },
                    ],
                  }
                : d
            )
          );
        }
      }
    } else {
      const acc = allHouseAccounts.find((a) => a.id === targetId);
      if (!acc) return;
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === targetId
            ? { ...a, informedRealBalance: realBalance, lastReconciledAt: nowFormatted() }
            : a
        )
      );

      if (realBalance !== null) {
        const diff = roundCurrency(realBalance - acc.availableBalance);
        if (Math.abs(diff) >= 0.01) {
          setAllDivergences((prev) => {
            const existing = prev.find((d) => d.targetId === targetId && d.targetType === 'casa');
            if (existing) {
              return prev.map((d) =>
                d.id === existing.id
                  ? {
                      ...d,
                      realBalance,
                      difference: diff,
                      status: 'aberta',
                      updatedAt: nowFormatted(),
                    }
                  : d
              );
            }
            const newDiv: ReconciliationDivergence = {
              id: `div_${Date.now()}`,
              targetType: 'casa',
              targetId,
              targetLabel: `${acc.label} (casa)`,
              partnershipId: acc.partnershipId,
              operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
              expectedBalance: acc.availableBalance,
              realBalance,
              difference: diff,
              status: 'aberta',
              classification: 'nao_classificada',
              justification: 'Diferença apurada na conferência de saldo da casa.',
              responsibleName: currentUser.name,
              updatedAt: nowFormatted(),
              contextHint: `Saldo previsto: ${formatCurrencyBRL(
                acc.availableBalance
              )}. Saldo real digitado: ${formatCurrencyBRL(realBalance)}.`,
              history: [
                {
                  id: `dh_${Date.now()}`,
                  timestamp: nowFormatted(),
                  author: currentUser.name,
                  classification: 'nao_classificada',
                  note: `Informado saldo real de ${formatCurrencyBRL(realBalance)} (diferença ${formatCurrencyBRL(
                    diff
                  )}).`,
                  status: 'aberta',
                },
              ],
            };
            return [newDiv, ...prev];
          });
        } else {
          setAllDivergences((prev) =>
            prev.map((d) =>
              d.targetId === targetId && d.targetType === 'casa' && d.status !== 'resolvida'
                ? {
                    ...d,
                    realBalance,
                    difference: 0,
                    status: 'resolvida',
                    updatedAt: nowFormatted(),
                    history: [
                      ...d.history,
                      {
                        id: `dh_${Date.now()}`,
                        timestamp: nowFormatted(),
                        author: currentUser.name,
                        classification: d.classification,
                        note: 'Saldo real conferido e igual ao saldo previsto.',
                        status: 'resolvida',
                      },
                    ],
                  }
                : d
            )
          );
        }
      }
    }
  };

  const classifyDivergence = (params: {
    divergenceId: string;
    classification: DivergenceClassification;
    justification: string;
    markResolved?: boolean;
    targetTransferAccountLabel?: string;
  }) => {
    const div = allDivergences.find((d) => d.id === params.divergenceId);
    if (!div) return;

    const nextStatus: ReconciliationDivergence['status'] = params.markResolved
      ? 'resolvida'
      : params.classification === 'pix_chave_errada'
      ? 'em_investigacao'
      : 'em_acompanhamento';

    const noteText =
      params.justification.trim() ||
      `Classificada como: ${params.classification.replace(/_/g, ' ')}${
        params.targetTransferAccountLabel ? ` (${params.targetTransferAccountLabel})` : ''
      }`;

    // Uma divergência NÃO é apagada ao ser classificada. Mantém justificativa, responsável, data/hora e histórico!
    setAllDivergences((prev) =>
      prev.map((d) =>
        d.id === params.divergenceId
          ? {
              ...d,
              classification: params.classification,
              justification: noteText,
              responsibleName: currentUser.name,
              status: nextStatus,
              updatedAt: nowFormatted(),
              history: [
                ...d.history,
                {
                  id: `dh_${Date.now()}`,
                  timestamp: nowFormatted(),
                  author: currentUser.name,
                  classification: params.classification,
                  note: noteText,
                  status: nextStatus,
                },
              ],
            }
          : d
      )
    );

    // Se a causa for "falhou_voltou_casa" para o saque de Carlos, permite devolver o saque para a casa
    if (params.classification === 'falhou_voltou_casa') {
      const relatedW = allWithdrawals.find(
        (w) =>
          isWithdrawalInTransit(w) &&
          (w.destinationBankId === div.targetId || w.houseAccountId === div.targetId)
      );
      if (relatedW) {
        advanceWithdrawalStage(relatedW.id, 'devolvido_casa', {
          issueType: 'falha_devolvido',
          issueNotes: noteText,
        });
      }
    } else if (params.classification === 'tarifa_custo' && Math.abs(div.difference) > 0) {
      // Se o usuário classificou como tarifa ou custo e resolveu, registra o custo mantendo histórico
      const tariffAmount = Math.abs(div.difference);
      setAllCosts((prev) => [
        {
          id: `cost_div_${Date.now()}`,
          category: 'Custos de operação',
          detail: `Tarifa/custo identificado na conferência · ${div.targetLabel}`,
          amount: tariffAmount,
          date: '11/10',
          operatorId: div.operatorId,
          paidByOperatorId: div.operatorId,
          origin: 'Automático (tarifa)',
          partnershipId: div.partnershipId,
          houseAccountId: div.targetType === 'casa' ? div.targetId : null,
          withdrawalId: null,
          reversed: false,
          reversalReason: null,
        },
        ...prev,
      ]);
    }

    notify(
      'success',
      `Divergência em ${div.targetLabel} registrada (${nextStatus.replace(
        '_',
        ' '
      )}) com histórico preservado.`
    );
  };

  const confirmImportStatementCandidates = (candidates: StatementImportCandidate[]) => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      notify('warning', 'Nenhum lançamento selecionado na prévia do extrato.');
      return;
    }

    let reconciledCount = 0;
    let newTransfersCount = 0;

    for (const item of selected) {
      if (item.status === 'conciliavel_saque' && item.matchedWithdrawalId) {
        advanceWithdrawalStage(item.matchedWithdrawalId, 'recebido_banco', {
          receivedAmount: item.amount,
          issueNotes: `Conciliado via extrato importado (${item.description})`,
        });
        reconciledCount++;
      } else {
        const newTrf: DepositTransfer = {
          id: `trf_stmt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          type: 'transferencia_bancos',
          originBankId: item.direction === 'debito' ? item.bankId : 'bank_enigma',
          destinationHouseAccountId: null,
          destinationBankId: item.direction === 'credito' ? item.bankId : 'bank_enigma',
          partnershipId: null,
          amount: item.amount,
          feeAmount: 0,
          status: 'confirmado',
          createdAt: item.date,
          confirmedAt: nowFormatted(),
          operatorId: currentUser.id === 'admin' ? 'op_a' : currentUser.id,
          originTag: 'Extrato importado',
          notes: item.description,
        };
        setAllDeposits((prev) => [newTrf, ...prev]);
        newTransfersCount++;
      }
    }

    notify(
      'success',
      `Extrato processado: ${reconciledCount} saque(s) conciliado(s) e ${newTransfersCount} movimentação(ões) registrada(s).`
    );
  };

  const updateHouseAccountOperationalStatus = (
    accountId: string,
    nextStatus: HouseAccountStatus,
    realBalanceConfirmation?: number,
    justificationIfDiff?: string
  ): boolean => {
    const acc = allHouseAccounts.find((a) => a.id === accountId);
    if (!acc) return false;

    const confirmedBalance =
      realBalanceConfirmation !== undefined ? realBalanceConfirmation : acc.availableBalance;
    const diff = roundCurrency(confirmedBalance - acc.availableBalance);

    if (Math.abs(diff) >= 0.01 && !justificationIfDiff?.trim()) {
      notify(
        'error',
        `Diferença de ${formatCurrencyBRL(
          Math.abs(diff)
        )} entre o previsto e o real: informe o motivo antes de mudar o status.`
      );
      return false;
    }

    setAllHouseAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              status: nextStatus,
              informedRealBalance: confirmedBalance,
              lastReconciledAt: nowFormatted(),
              pendingStatusChangeTo: null,
              notes: justificationIfDiff
                ? `${a.notes ? a.notes + ' · ' : ''}${justificationIfDiff}`
                : a.notes,
            }
          : a
      )
    );

    if (Math.abs(diff) >= 0.01 && justificationIfDiff) {
      // Registra ou atualiza a divergência com a justificativa informada
      setAllDivergences((prev) => {
        const existing = prev.find((d) => d.targetId === accountId && d.targetType === 'casa');
        if (existing) {
          return prev.map((d) =>
            d.id === existing.id
              ? {
                  ...d,
                  realBalance: confirmedBalance,
                  difference: diff,
                  justification: justificationIfDiff,
                  status: 'em_acompanhamento',
                  updatedAt: nowFormatted(),
                  history: [
                    ...d.history,
                    {
                      id: `dh_${Date.now()}`,
                      timestamp: nowFormatted(),
                      author: currentUser.name,
                      classification: 'outro',
                      note: `Status alterado para ${nextStatus} com justificativa: ${justificationIfDiff}`,
                      status: 'em_acompanhamento',
                    },
                  ],
                }
              : d
          );
        }
        return prev;
      });
    }

    appendMovement({
      type: 'ajuste_justificado',
      origin: acc.label,
      destination: `Status: ${nextStatus}`,
      houseName: acc.houseName,
      partnershipId: acc.partnershipId,
      houseAccountId: acc.id,
      bankAccountId: null,
      amount: confirmedBalance,
      operatorId: currentUser.id,
      status: 'conciliado',
      referenceId: acc.id,
      notes: `Status operacional atualizado para "${nextStatus}". ${justificationIfDiff || ''}`,
    });

    notify('success', `Status de ${acc.label} atualizado para "${nextStatus}".`);
    return true;
  };

  const adjustAccountBalanceWithJustification = (
    targetType: 'casa' | 'banco',
    targetId: string,
    newBalance: number,
    reason: string
  ) => {
    if (!reason.trim()) {
      notify('error', 'Informe uma justificativa obrigatória para registrar o ajuste.');
      return;
    }

    if (targetType === 'casa') {
      const acc = allHouseAccounts.find((a) => a.id === targetId);
      if (!acc) return;
      const delta = roundCurrency(newBalance - acc.availableBalance);
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.id === targetId
            ? {
                ...a,
                availableBalance: roundCurrency(newBalance),
                informedRealBalance: roundCurrency(newBalance),
                lastReconciledAt: nowFormatted(),
              }
            : a
        )
      );
      appendMovement({
        type: 'ajuste_justificado',
        origin: acc.label,
        destination: acc.label,
        houseName: acc.houseName,
        partnershipId: acc.partnershipId,
        houseAccountId: acc.id,
        bankAccountId: null,
        amount: delta,
        operatorId: currentUser.id,
        status: 'conciliado',
        referenceId: acc.id,
        notes: `Ajuste justificado (${formatCurrencyBRL(delta, true)}): ${reason}`,
      });
      notify('success', `Ajuste justificado aplicado em ${acc.label}. Histórico preservado.`);
    } else {
      const bank = allBankAccounts.find((b) => b.id === targetId);
      if (!bank) return;
      const delta = roundCurrency(newBalance - bank.balance);
      setAllBankAccounts((prev) =>
        prev.map((b) =>
          b.id === targetId
            ? {
                ...b,
                balance: roundCurrency(newBalance),
                informedRealBalance: roundCurrency(newBalance),
                lastReconciledAt: nowFormatted(),
              }
            : b
        )
      );
      appendMovement({
        type: 'ajuste_justificado',
        origin: bank.label,
        destination: bank.label,
        houseName: null,
        partnershipId: bank.partnershipId,
        houseAccountId: null,
        bankAccountId: bank.id,
        amount: delta,
        operatorId: currentUser.id,
        status: 'conciliado',
        referenceId: bank.id,
        notes: `Ajuste bancário justificado (${formatCurrencyBRL(delta, true)}): ${reason}`,
      });
      notify('success', `Ajuste bancário aplicado em ${bank.label}. Histórico preservado.`);
    }
  };

  const reverseLedgerMovement = (movementId: string, reason: string) => {
    const mov = ledgerMovements.find((m) => m.id === movementId);
    if (!mov || mov.status === 'estornado') return;
    if (!reason.trim()) {
      notify('error', 'Informe o motivo do estorno para preservar a auditoria.');
      return;
    }

    const reversalId = appendMovement({
      type: 'estorno',
      origin: mov.destination,
      destination: mov.origin,
      houseName: mov.houseName,
      partnershipId: mov.partnershipId,
      houseAccountId: mov.houseAccountId,
      bankAccountId: mov.bankAccountId,
      amount: mov.amount,
      operatorId: currentUser.id,
      status: 'conciliado',
      referenceId: mov.id,
      notes: `Estorno do movimento ${mov.id}: ${reason}`,
    });

    setLedgerMovements((prev) =>
      prev.map((m) =>
        m.id === movementId ? { ...m, status: 'estornado', reversedByMovementId: reversalId } : m
      )
    );

    notify('success', 'Movimento estornado com registro de auditoria preservado.');
  };

  const pullPartnershipFromStock = (partnershipId: string, targetOperatorId?: string) => {
    const p = allPartnerships.find((item) => item.id === partnershipId);
    if (!p || p.status !== 'estoque') return;

    const assignedOpId =
      targetOperatorId || (currentUser.role === 'operador' ? currentUser.id : 'op_a');
    const assignedUser = users.find((u) => u.id === assignedOpId) || currentUser;

    // Se outra pessoa pagou o custo de criação original, gera obrigação de ressarcimento sem cobrar duas vezes o custo de criação!
    const needsReimbursement =
      p.paidByOperatorId !== assignedOpId &&
      p.paidByOperatorId !== 'admin' &&
      p.creationCost > 0;

    setAllPartnerships((prev) =>
      prev.map((item) => {
        if (item.id !== partnershipId) return item;
        return {
          ...item,
          status: 'ativa',
          operatorId: assignedOpId,
          period: '11/10/2026 a 11/11/2026',
          reimbursementDueToOperatorId: needsReimbursement ? item.paidByOperatorId : null,
          reimbursementAmount: needsReimbursement ? item.creationCost : 0,
          reimbursementSettled: !needsReimbursement,
          assignmentHistory: [
            ...item.assignmentHistory,
            {
              id: `ah_${Date.now()}`,
              date: nowFormatted(),
              action: 'puxada_estoque',
              fromOperatorId: null,
              toOperatorId: assignedOpId,
              authorName: currentUser.name,
              note: needsReimbursement
                ? `Assumida por ${assignedUser.shortName}. Gerada obrigação de ressarcimento de ${formatCurrencyBRL(
                    item.creationCost
                  )} para quem pagou a criação.`
                : `Puxada do estoque para a planilha de ${assignedUser.shortName}.`,
            },
          ],
        };
      })
    );

    // Se ainda não existem contas criadas na memória para essa parceria do estoque, cria as casas padrão prontas
    const existingAccs = allHouseAccounts.filter((a) => a.partnershipId === partnershipId);
    if (existingAccs.length === 0) {
      const defaultHouses = ['Betano', 'Bet365', 'Superbet', 'Sportingbet', 'KTO', 'Blaze', 'Jonbet'];
      const newAccs: HouseAccount[] = defaultHouses.map((h, i) => ({
        id: `acc_${partnershipId}_${i}`,
        partnershipId,
        houseName: h,
        cloneGroup: h === 'KTO' ? 'KTO' : h === 'Blaze' || h === 'Jonbet' ? 'Blaze' : 'Sem clones',
        label: `${h} · ${p.shortName}`,
        status: i === 1 && p.id === 'est_014' ? 'verificar' : 'pronta',
        login: p.emailOperation.split('@')[0],
        passwordSecret: `${h}#${p.code}26`,
        availableBalance: 0,
        informedRealBalance: 0,
        lastReconciledAt: nowFormatted(),
        weeklyFacialDue: null,
        weeklyFacialPending: false,
        notes: i === 1 && p.id === 'est_014' ? 'Casas a verificar' : '',
        authorizedOperatorIds: [assignedOpId],
      }));
      setAllHouseAccounts((prev) => [...prev, ...newAccs]);

      if (p.pixWithdrawals !== 'Sem banco') {
        const newBank: BankAccount = {
          id: `bank_${partnershipId}`,
          partnershipId,
          bankName: p.pixWithdrawals.includes('PGBank') ? 'PGBank' : 'Inter',
          label: `${p.pixWithdrawals.includes('PGBank') ? 'PGBank' : 'Inter'} · ${p.shortName}`,
          status: 'ativo',
          phoneDevice: p.chipLocation.split(' ')[1] || 'M14',
          login: p.cpf,
          passwordSecret: `Banco#${p.code}`,
          pixKey: p.emailOperation,
          balance: 0,
          informedRealBalance: 0,
          lastReconciledAt: nowFormatted(),
          authorizedOperatorIds: [assignedOpId],
        };
        setAllBankAccounts((prev) => [...prev, newBank]);
      }
    } else {
      setAllHouseAccounts((prev) =>
        prev.map((a) =>
          a.partnershipId === partnershipId
            ? {
                ...a,
                authorizedOperatorIds: Array.from(new Set([...a.authorizedOperatorIds, assignedOpId])),
              }
            : a
        )
      );
    }

    notify(
      'success',
      `Parceria ${p.code} (${p.titularName}) puxada para a planilha de ${assignedUser.shortName}!`
    );
    setActiveScreen('parcerias', { partnershipId });
  };

  const returnPartnershipToStock = (partnershipId: string, reason: string) => {
    const p = allPartnerships.find((item) => item.id === partnershipId);
    if (!p) return;

    setAllPartnerships((prev) =>
      prev.map((item) =>
        item.id === partnershipId
          ? {
              ...item,
              status: 'estoque',
              operatorId: null,
              assignmentHistory: [
                ...item.assignmentHistory,
                {
                  id: `ah_${Date.now()}`,
                  date: nowFormatted(),
                  action: 'devolvida_estoque',
                  fromOperatorId: item.operatorId,
                  toOperatorId: null,
                  authorName: currentUser.name,
                  note: reason || 'Devolvida ao estoque preservando saldos e status das contas.',
                },
              ],
            }
          : item
      )
    );

    notify(
      'success',
      `Parceria ${p.shortName} devolvida ao estoque com histórico e status das contas preservados.`
    );
  };

  const settlePartnershipReimbursement = (partnershipId: string) => {
    const p = allPartnerships.find((item) => item.id === partnershipId);
    if (!p || p.reimbursementSettled || !p.reimbursementDueToOperatorId) return;

    const creditor = users.find((u) => u.id === p.reimbursementDueToOperatorId);

    setAllPartnerships((prev) =>
      prev.map((item) =>
        item.id === partnershipId
          ? {
              ...item,
              reimbursementSettled: true,
              assignmentHistory: [
                ...item.assignmentHistory,
                {
                  id: `ah_${Date.now()}`,
                  date: nowFormatted(),
                  action: 'ressarcimento_quitado',
                  fromOperatorId: item.operatorId,
                  toOperatorId: item.reimbursementDueToOperatorId,
                  authorName: currentUser.name,
                  note: `Ressarcimento de ${formatCurrencyBRL(
                    item.reimbursementAmount
                  )} quitado para ${creditor?.shortName || 'operador original'} (sem duplicar custo de criação).`,
                },
              ],
            }
          : item
      )
    );

    notify(
      'success',
      `Ressarcimento de ${formatCurrencyBRL(p.reimbursementAmount)} para ${
        creditor?.shortName || 'operador'
      } registrado como quitado!`
    );
  };

  const createDirectPartnership = (params: {
    titularName: string;
    cpf: string;
    birthDate: string;
    phones: string;
    referral: string;
    bankName: string;
    emailOperation: string;
    chipLocation: string;
    selectedHouses: string[];
    creationCost: number;
    address?: string;
    notes?: string;
  }): string => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'operador') {
      notify('error', 'Seu perfil não tem autorização para cadastrar uma parceria diretamente.');
      return '';
    }

    const assignedOpId = currentUser.role === 'operador' ? currentUser.id : 'op_a';
    const newId = `parc_${Date.now()}`;
    const shortName = params.titularName.trim().split(' ')[0] || 'Novo Titular';
    const code = `PAR-${String(allPartnerships.length + 1).padStart(3, '0')}`;

    const newPartnership: Partnership = {
      id: newId,
      code,
      titularName: params.titularName.trim(),
      shortName,
      cpf: params.cpf.trim() || '000.000.000-99',
      birthDate: params.birthDate.trim() || '01/01/1999',
      address: params.address?.trim() || 'Endereço cadastrado no atendimento',
      emailOperation: params.emailOperation.trim() || `${shortName.toLowerCase()}.op@gmail.com`,
      emailPersonal: `${shortName.toLowerCase()}.pessoal@gmail.com`,
      phones: params.phones.trim() || '(00) 90000-0000',
      chipLocation: params.chipLocation.trim() || 'Celular A14 (gaveta 1)',
      referral: params.referral.trim() || 'Direto',
      period: '11/10/2026 a 11/11/2026',
      status: 'ativa',
      origin: 'atendimento',
      createdAt: '11/10/2026',
      operatorId: assignedOpId,
      paidByOperatorId: assignedOpId,
      creationCost: roundCurrency(params.creationCost),
      creationCostCharged: params.creationCost > 0,
      reimbursementDueToOperatorId: null,
      reimbursementAmount: 0,
      reimbursementSettled: true,
      pixWithdrawals: `${params.emailOperation.trim() || 'pix@op.com'} (${
        params.bankName || 'Inter'
      })`,
      pixPayments: params.cpf.trim() || '000.000.000-99',
      notes: params.notes?.trim() || 'Cadastrada diretamente no atendimento.',
      assignmentHistory: [
        {
          id: `ah_${Date.now()}`,
          date: nowFormatted(),
          action: 'criada_atendimento',
          fromOperatorId: null,
          toOperatorId: assignedOpId,
          authorName: currentUser.name,
          note: `Criada no atendimento com ${params.selectedHouses.length} casa(s).`,
        },
      ],
    };

    const housesToCreate =
      params.selectedHouses.length > 0
        ? params.selectedHouses
        : ['Betano', 'Bet365', 'Superbet', 'KTO'];

    const newAccounts: HouseAccount[] = housesToCreate.map((houseName, idx) => ({
      id: `acc_${newId}_${idx}`,
      partnershipId: newId,
      houseName,
      cloneGroup:
        houseName === 'KTO' || houseName === 'Stake'
          ? 'KTO'
          : houseName === 'Blaze' || houseName === 'Jonbet'
          ? 'Blaze'
          : 'Sem clones',
      label: `${houseName} · ${shortName}`,
      status: 'pronta',
      login: (params.emailOperation.trim() || `${shortName.toLowerCase()}.operacao`).split('@')[0],
      passwordSecret: `${houseName}#${shortName}2026`,
      availableBalance: 0,
      informedRealBalance: 0,
      lastReconciledAt: nowFormatted(),
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes: '',
      authorizedOperatorIds: [assignedOpId],
    }));

    const newBank: BankAccount = {
      id: `bank_${newId}`,
      partnershipId: newId,
      bankName: params.bankName.trim() || 'Inter',
      label: `${params.bankName.trim() || 'Inter'} · ${shortName}`,
      status: 'ativo',
      phoneDevice: params.chipLocation.trim() || 'A14',
      login: newPartnership.cpf,
      passwordSecret: `Banco#${shortName}26`,
      pixKey: newPartnership.emailOperation,
      balance: 0,
      informedRealBalance: 0,
      lastReconciledAt: nowFormatted(),
      authorizedOperatorIds: [assignedOpId],
    };

    setAllPartnerships((prev) => [newPartnership, ...prev]);
    setAllHouseAccounts((prev) => [...prev, ...newAccounts]);
    setAllBankAccounts((prev) => [...prev, newBank]);

    if (params.creationCost > 0) {
      setAllCosts((prev) => [
        {
          id: `cost_create_${Date.now()}`,
          category: 'Novas parcerias',
          detail: `Cadastro parceria ${ newPartnership.titularName } (${ housesToCreate.length } casas)`,
          amount: roundCurrency(params.creationCost),
          date: '11/10',
          operatorId: assignedOpId,
          paidByOperatorId: assignedOpId,
          origin: 'Manual',
          partnershipId: newId,
          houseAccountId: null,
          withdrawalId: null,
          reversed: false,
          reversalReason: null,
        },
        ...prev,
      ]);
    }

    notify(
      'success',
      `Parceria "${newPartnership.titularName}" e ${newAccounts.length} contas criadas com status "Pronta"!`
    );
    setActiveScreen('parcerias', { partnershipId: newId });
    return newId;
  };

  const addHouseToPartnership = (params: {
    partnershipId: string;
    houseName: string;
    cloneGroup: string;
    login: string;
    passwordSecret: string;
    accountCurrency?: HouseAccountCurrency;
  }) => {
    const p = allPartnerships.find((item) => item.id === params.partnershipId);
    if (!p) return;

    const cleanHouseName = params.houseName.trim();
    if (!cleanHouseName) {
      notify('error', 'Selecione ou informe o nome da casa para adicionar.');
      return;
    }

    const catalogItem = houseCatalog.find(
      (h) => h.name.toLowerCase() === cleanHouseName.toLowerCase()
    );

    const resolvedCurrency: HouseAccountCurrency =
      params.accountCurrency ||
      (catalogItem?.customValues?.rede_cripto_preferencial?.includes('EUR')
        ? 'EUR'
        : catalogItem?.customValues?.rede_cripto_preferencial?.includes('BRL')
        ? 'BRL'
        : 'USDT');

    const newAcc: HouseAccount = {
      id: `acc_${params.partnershipId}_${Date.now()}`,
      partnershipId: p.id,
      houseName: catalogItem ? catalogItem.name : cleanHouseName,
      cloneGroup: params.cloneGroup || catalogItem?.cloneGroup || 'Sem clones',
      label: `${catalogItem ? catalogItem.name : cleanHouseName}${
        resolvedCurrency === 'EUR' ? ' (Saldo EUR)' : ''
      } · ${p.shortName}`,
      status: 'pronta',
      login: params.login.trim() || p.emailOperation.split('@')[0],
      passwordSecret: params.passwordSecret.trim() || `${cleanHouseName}#2026`,
      availableBalance: 0,
      informedRealBalance: 0,
      lastReconciledAt: nowFormatted(),
      weeklyFacialDue: null,
      weeklyFacialPending: false,
      notes:
        resolvedCurrency === 'EUR'
          ? 'Depósito via USDT → Saldo interno na casa em EUR (€)'
          : '',
      authorizedOperatorIds: p.operatorId ? [p.operatorId] : ['op_a'],
      accountCurrency: resolvedCurrency,
      color: catalogItem?.color,
    };

    setAllHouseAccounts((prev) => [...prev, newAcc]);
    notify('success', `Conta ${newAcc.label} adicionada à ficha da parceria.`);
  };

  const addBankToPartnership = (params: {
    partnershipId: string;
    bankName: string;
    phoneDevice: string;
    login: string;
    passwordSecret: string;
    pixKey: string;
  }) => {
    const p = allPartnerships.find((item) => item.id === params.partnershipId);
    if (!p || !canUserAccessCredentials(currentUser, p)) {
      notify('error', 'Seu perfil não tem autorização para cadastrar contas nesta parceria.');
      return;
    }

    const cleanBankName = params.bankName.trim();
    if (!cleanBankName) {
      notify('error', 'Selecione ou informe o nome do banco.');
      return;
    }

    const newBank: BankAccount = {
      id: `bank_${params.partnershipId}_${Date.now()}`,
      partnershipId: p.id,
      bankName: cleanBankName,
      label: `${cleanBankName} · ${p.shortName}`,
      status: 'ativo',
      phoneDevice: params.phoneDevice.trim(),
      login: params.login.trim(),
      passwordSecret: params.passwordSecret.trim(),
      pixKey: params.pixKey.trim(),
      balance: 0,
      informedRealBalance: 0,
      lastReconciledAt: nowFormatted(),
      authorizedOperatorIds: p.operatorId ? [p.operatorId] : [],
    };

    setAllBankAccounts((prev) => [...prev, newBank]);
    notify('success', `Conta bancária ${newBank.label} adicionada à parceria.`);
  };

  const updateBankInPartnership = (
    bankId: string,
    updates: Partial<
      Pick<BankAccount, 'bankName' | 'phoneDevice' | 'login' | 'passwordSecret' | 'pixKey' | 'status'>
    >,
    options?: { destinationChangeConfirmed?: boolean }
  ): boolean => {
    const bank = allBankAccounts.find((item) => item.id === bankId);
    const partnership = bank && allPartnerships.find((item) => item.id === bank.partnershipId);
    if (!bank || !partnership || !canUserAccessCredentials(currentUser, partnership)) {
      notify('error', 'Seu perfil não tem autorização para editar esta conta.');
      return false;
    }
    const changedDestinations = (['pixKey', 'phoneDevice'] as const).filter(
      (field) => updates[field] !== undefined && updates[field] !== bank[field]
    );
    if (changedDestinations.length && !options?.destinationChangeConfirmed) {
      notify('error', 'Confira e confirme explicitamente o endereço e a rede antes de salvar.');
      return false;
    }
    if (updates.bankName !== undefined && !updates.bankName.trim()) {
      notify('error', 'Informe o nome da carteira ou corretora.');
      return false;
    }
    setAllBankAccounts((prev) =>
      prev.map((b) =>
        b.id === bankId
          ? {
              ...b,
              ...updates,
              label: updates.bankName
                ? `${updates.bankName} · ${b.label.split('·')[1]?.trim() || ''}`
                : b.label,
            }
          : b
      )
    );
    if (changedDestinations.length) {
      const event: Partnership['assignmentHistory'][number] = {
        id: 'wallet_destination_' + Date.now().toString(36),
        date: nowFormatted(), action: 'destino_financeiro_alterado',
        fromOperatorId: null, toOperatorId: null, authorName: currentUser.name,
        note: 'Endereço ou rede da conta financeira atualizado após confirmação explícita. Conta: ' + bank.id + '. Valores sensíveis não são incluídos no histórico.',
      };
      setAllPartnerships((prev) => prev.map((item) => item.id === partnership.id
        ? { ...item, assignmentHistory: [...item.assignmentHistory, event] } : item));
    }
    notify('success', 'Carteira / Corretora atualizada com sucesso.');
    return true;
  };

  const removeBankFromPartnership = (bankId: string) => {
    const bank = allBankAccounts.find((item) => item.id === bankId);
    const partnership = bank && allPartnerships.find((item) => item.id === bank.partnershipId);
    if (!partnership || !canUserAccessCredentials(currentUser, partnership)) {
      notify('error', 'Seu perfil não tem autorização para remover esta conta.');
      return;
    }
    setAllBankAccounts((prev) => prev.filter((b) => b.id !== bankId));
    notify('success', 'Carteira / Corretora removida da parceria.');
  };

  const updatePartnershipDetails = (
    partnershipId: string,
    updates: Partial<
      Pick<
        Partnership,
        | 'shortName'
        | 'address'
        | 'emailOperation'
        | 'emailPersonal'
        | 'phones'
        | 'chipLocation'
        | 'referral'
        | 'pixWithdrawals'
        | 'withdrawalNetwork'
        | 'pixPayments'
        | 'notes'
      >
    >,
    options?: { confirmDestinationChange?: boolean }
  ) => {
    const partnership = allPartnerships.find((item) => item.id === partnershipId);
    if (!partnership) {
      notify('error', 'A parceria selecionada não foi encontrada.');
      return false;
    }
    if (!canUserAccessCredentials(currentUser, partnership)) {
      notify('error', 'Seu perfil não tem autorização para editar os dados desta parceria.');
      return false;
    }

    const destinationFields = [
      'pixWithdrawals',
      'withdrawalNetwork',
      'pixPayments',
    ] as const;
    const changedDestinationFields = destinationFields.filter(
      (field) =>
        updates[field] !== undefined && (updates[field] ?? '') !== (partnership[field] ?? '')
    );
    const destinationChanged = changedDestinationFields.length > 0;

    if (destinationChanged && !options?.confirmDestinationChange) {
      notify('error', 'Confirme explicitamente a alteração do destino financeiro antes de salvar.');
      return false;
    }

    const nextWithdrawalAddress = updates.pixWithdrawals ?? partnership.pixWithdrawals;
    const nextWithdrawalNetwork = updates.withdrawalNetwork ?? partnership.withdrawalNetwork ?? '';
    const withdrawalDestinationChanged = changedDestinationFields.some(
      (field) => field === 'pixWithdrawals' || field === 'withdrawalNetwork'
    );
    if (
      withdrawalDestinationChanged &&
      isLikelyCryptoWalletAddress(nextWithdrawalAddress) &&
      !nextWithdrawalNetwork.trim()
    ) {
      notify('error', 'Informe a rede da carteira de saque antes de salvar o endereço.');
      return false;
    }

    const auditEvent: Partnership['assignmentHistory'][number] | null = destinationChanged
      ? {
          id: `dest_audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          date: nowFormatted(),
          action: 'destino_financeiro_alterado',
          fromOperatorId: null,
          toOperatorId: null,
          authorName: currentUser.name,
          note: `Destino atualizado (${changedDestinationFields.map((field) => ({
            pixWithdrawals: 'carteira de saque',
            withdrawalNetwork: 'rede de saque',
            pixPayments: 'rampa/chave de pagamento',
          }[field])).join(', ')}). Os valores não são gravados no histórico.`,
        }
      : null;

    setAllPartnerships((prev) =>
      prev.map((item) =>
        item.id === partnershipId
          ? {
              ...item,
              ...updates,
              ...(auditEvent ? { assignmentHistory: [...item.assignmentHistory, auditEvent] } : {}),
            }
          : item
      )
    );
    notify('success', 'Dados da ficha da parceria atualizados.');
    return true;
  };

  const logCredentialReveal = (
    partnershipId: string,
    targetType: 'banco' | 'casa',
    targetLabel: string
  ): boolean => {
    const p = allPartnerships.find((item) => item.id === partnershipId);
    if (!p) return false;
    if (!canUserAccessCredentials(currentUser, p)) {
      notify('error', 'Seu perfil não possui autorização para revelar credenciais desta parceria.');
      return false;
    }

    const logEntry: CredentialAccessLog = {
      id: `cred_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      timestamp: nowFormatted(),
      userId: currentUser.id,
      userName: currentUser.name,
      partnershipId,
      targetType,
      targetLabel,
    };

    setCredentialLogs((prev) => [logEntry, ...prev]);
    return true;
  };

  const addManualCost = (params: {
    category: CostCategory;
    operatorId: string;
    amount: number;
    date: string;
    detail: string;
    partnershipId?: string | null;
  }) => {
    if (params.amount <= 0) {
      notify('error', 'Informe um valor de custo maior que zero.');
      return;
    }

    // Evita cobrar duas vezes o mesmo custo de criação de parceria
    if (
      (params.category === 'Novas parcerias' || params.category === 'Criação de conta') &&
      params.partnershipId
    ) {
      const p = allPartnerships.find((item) => item.id === params.partnershipId);
      if (p && p.creationCostCharged && params.detail.toLowerCase().includes('criação')) {
        notify(
          'warning',
          `O custo de criação da parceria ${p.shortName} já foi cobrado anteriormente. Use "Ressarcimento" se houve troca de operador.`
        );
        return;
      }
    }

    const newCost: CostRecord = {
      id: `cost_${Date.now()}`,
      category: params.category,
      detail: params.detail.trim() || params.category,
      amount: roundCurrency(params.amount),
      date: params.date.slice(0, 5) || '11/10',
      operatorId: params.operatorId,
      paidByOperatorId: params.operatorId,
      origin: 'Manual',
      partnershipId: params.partnershipId || null,
      houseAccountId: null,
      withdrawalId: null,
      reversed: false,
      reversalReason: null,
    };

    setAllCosts((prev) => [newCost, ...prev]);
    appendMovement({
      type: 'custo_operacional',
      origin: currentUser.name,
      destination: params.category,
      houseName: null,
      partnershipId: params.partnershipId || null,
      houseAccountId: null,
      bankAccountId: null,
      amount: newCost.amount,
      operatorId: params.operatorId,
      status: 'conciliado',
      referenceId: newCost.id,
      notes: `Custo lançado (${params.category}): ${newCost.detail}`,
    });

    notify('success', `Custo de ${formatCurrencyBRL(newCost.amount)} lançado em ${params.category}.`);
  };

  const reverseCostRecord = (costId: string, reason: string) => {
    const cost = allCosts.find((c) => c.id === costId);
    if (!cost || cost.reversed) return;
    setAllCosts((prev) =>
      prev.map((c) =>
        c.id === costId ? { ...c, reversed: true, reversalReason: reason || 'Estorno manual' } : c
      )
    );
    notify('success', `Custo "${cost.detail}" estornado preservando histórico.`);
  };

  const loginWithCredentials = (
    identifier: string,
    passwordInput: string
  ): AuthAttemptResult => {
    const result = authenticateUser(users, identifier, passwordInput, nowFormatted());
    if (result.ok && result.user) {
      setUsers((prev) =>
        prev.map((u) => (u.id === result.user!.id ? result.user! : u))
      );
      setCurrentUserId(result.user.id);
      setIsAuthenticated(true);
      if (result.user.role === 'operador' && activeScreen === 'equipe') {
        setActiveScreenState('entradas');
      }
      notify('success', `Sessão iniciada como ${result.user.name}.`);
    }
    return result;
  };

  const logoutUser = () => {
    setIsAuthenticated(false);
    setFeedbackBanner(null);
  };

  const registerUserRequest = (input: RegistrationInput): UserCrudResult => {
    const res = createRegistrationRequest(users, input, nowFormatted());
    if (res.ok) {
      setUsers(res.users);
    }
    return res;
  };

  const approveUserRegistration = (
    userId: string,
    overrides?: {
      role?: UserRole;
      profitSharePercent?: number;
      initialMonthlyBalance?: number;
      shortName?: string;
    }
  ): UserCrudResult => {
    const res = approveUserRegistrationPure(
      users,
      userId,
      currentUser.shortName,
      overrides,
      nowFormatted()
    );
    if (res.ok) {
      setUsers(res.users);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const rejectUserRegistration = (userId: string): UserCrudResult => {
    const res = deleteAdminUserPure(users, userId, currentUser.id);
    if (res.ok) {
      setUsers(res.users);
      notify('warning', `Solicitação de cadastro de ${res.targetUser?.name} recusada e removida.`);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const createAdminUser = (payload: {
    name: string;
    shortName: string;
    login: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserAccountStatus;
    profitSharePercent: number;
    initialMonthlyBalance: number;
    phone?: string;
    registrationNotes?: string;
  }): UserCrudResult => {
    const res = createAdminUserPure(users, payload, currentUser.shortName, nowFormatted());
    if (res.ok) {
      setUsers(res.users);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const updateAdminUser = (userId: string, patch: Partial<UserProfile>): UserCrudResult => {
    const res = updateAdminUserPure(users, userId, patch);
    if (res.ok) {
      setUsers(res.users);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const updateAdminUserCredentials = (
    userId: string,
    payload: {
      login?: string;
      email?: string;
      newPassword?: string;
      mustChangePassword?: boolean;
    }
  ): UserCrudResult => {
    const res = updateUserCredentialsPure(users, userId, payload, nowFormatted());
    if (res.ok) {
      setUsers(res.users);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const deleteAdminUser = (userId: string): UserCrudResult => {
    const res = deleteAdminUserPure(users, userId, currentUser.id);
    if (res.ok) {
      setUsers(res.users);
      notify('warning', res.message);
    } else {
      notify('error', res.message);
    }
    return res;
  };

  const syncUsersRepositoryNow = () => {
    const snap = saveUsersToRepository(users, nowFormatted());
    setUserPersistenceSnapshot(snap);
    void syncUsersToSupabasePostgres(users);
    void syncCatalogToSupabasePostgres({
      houses: houseCatalog,
      banks: bankCatalog,
      customCriteria,
    });
    notify(
      'success',
      `Sincronizado com Supabase / PostgreSQL (${snap.totalRecords} usuários · Checksum ${snap.checksum.slice(0, 12)}).`
    );
  };

  const importUsersFromJsonSnapshot = (rawJson: string): { ok: boolean; message: string } => {
    const res = deserializeUsersPersistenceJson(rawJson);
    if (res.ok && res.users) {
      setUsers(res.users);
      const snap = saveUsersToRepository(res.users, nowFormatted());
      setUserPersistenceSnapshot(snap);
      notify('success', res.message);
      return { ok: true, message: res.message };
    }
    notify('error', res.message);
    return { ok: false, message: res.message };
  };

  const requestAdminExport = (): {
    ok: boolean;
    message: string;
    request?: ExportRequestRecord;
  } => {
    const existingPending = exportRequests.find(
      (r) =>
        r.userId === currentUser.id &&
        r.periodLabel === operationalMonthYearLabel &&
        r.status === 'pendente'
    );
    if (existingPending) {
      const msg = `Sua solicitação de exportação para ${operationalMonthYearLabel} já foi enviada e aguarda liberação do Administrador.`;
      notify('warning', msg);
      return { ok: true, message: msg, request: existingPending };
    }

    const newReq: ExportRequestRecord = {
      id: `expreq_${Date.now().toString(36)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userLogin: currentUser.login,
      userRole: currentUser.role,
      periodLabel: operationalMonthYearLabel,
      requestedAt: nowFormatted(),
      status: 'pendente',
      resolvedAt: null,
      resolvedBy: null,
    };

    setExportRequests((prev) => [newReq, ...prev]);
    const msg = `Solicitação de exportação (${operationalMonthYearLabel}) enviada ao Administrador com sucesso.`;
    notify('success', msg);
    return { ok: true, message: msg, request: newReq };
  };

  const fulfillExportRequest = (requestId: string) => {
    setExportRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'atendida',
              resolvedAt: nowFormatted(),
              resolvedBy: currentUser.shortName,
            }
          : r
      )
    );
    notify('success', 'Solicitação de exportação marcada como atendida pelo Administrador.');
  };

  const updateOwnProfileSecurity = (patch: {
    name?: string;
    shortName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }): { ok: boolean; message: string } => {
    if (patch.newPassword && patch.newPassword.trim().length > 0) {
      if ((currentUser.password || '') !== (patch.currentPassword || '')) {
        const msg = 'A senha atual informada está incorreta.';
        notify('error', msg);
        return { ok: false, message: msg };
      }
      if (patch.newPassword.trim().length < 4) {
        const msg = 'A nova senha deve conter pelo menos 4 caracteres.';
        notify('error', msg);
        return { ok: false, message: msg };
      }
    }

    const nextPass =
      patch.newPassword && patch.newPassword.trim().length >= 4
        ? patch.newPassword.trim()
        : currentUser.password || '';

    const updated: UserProfile = {
      ...currentUser,
      name: patch.name?.trim() || currentUser.name,
      shortName: patch.shortName?.trim() || currentUser.shortName,
      phone: patch.phone !== undefined ? patch.phone.trim() : currentUser.phone,
      password: nextPass,
      passwordHash: computePasswordHash(nextPass),
      passwordUpdatedAt:
        patch.newPassword && patch.newPassword.trim().length >= 4
          ? nowFormatted()
          : currentUser.passwordUpdatedAt,
      mustChangePassword: false,
    };

    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    const msg =
      patch.newPassword && patch.newPassword.trim().length >= 4
        ? 'Perfil e senha de acesso atualizados com sucesso!'
        : 'Dados do seu perfil atualizados com sucesso!';
    notify('success', msg);
    return { ok: true, message: msg };
  };

  const upsertHouseCatalogItem = (
    input: UpsertHouseCatalogInput
  ): { ok: boolean; message: string } => {
    const res = upsertHouseCatalogItemPure(houseCatalog, input, nowFormatted());
    if (res.ok) {
      setHouseCatalog(res.houses);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const toggleHouseCatalogActive = (
    houseId: string
  ): { ok: boolean; message: string } => {
    const res = toggleHouseCatalogActivePure(houseCatalog, houseId, nowFormatted());
    if (res.ok) {
      setHouseCatalog(res.houses);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const removeHouseCatalogItem = (
    houseId: string
  ): { ok: boolean; message: string } => {
    const res = removeHouseCatalogItemPure(houseCatalog, houseId);
    if (res.ok) {
      setHouseCatalog(res.houses);
      notify('warning', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const upsertBankCatalogItem = (
    input: UpsertBankCatalogInput
  ): { ok: boolean; message: string } => {
    const res = upsertBankCatalogItemPure(bankCatalog, input, nowFormatted());
    if (res.ok) {
      setBankCatalog(res.banks);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const toggleBankCatalogActive = (
    bankId: string
  ): { ok: boolean; message: string } => {
    const res = toggleBankCatalogActivePure(bankCatalog, bankId, nowFormatted());
    if (res.ok) {
      setBankCatalog(res.banks);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const removeBankCatalogItem = (
    bankId: string
  ): { ok: boolean; message: string } => {
    const res = removeBankCatalogItemPure(bankCatalog, bankId);
    if (res.ok) {
      setBankCatalog(res.banks);
      notify('warning', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const addCatalogCriterion = (
    input: AddCatalogCriterionInput
  ): { ok: boolean; message: string } => {
    const res = addCatalogCriterionPure(
      customCriteria,
      houseCatalog,
      bankCatalog,
      input,
      nowFormatted()
    );
    if (res.ok) {
      setCustomCriteria(res.criteria);
      setHouseCatalog(res.houses);
      setBankCatalog(res.banks);
      notify('success', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const deleteCatalogCriterion = (
    criterionId: string
  ): { ok: boolean; message: string } => {
    const res = deleteCatalogCriterionPure(customCriteria, criterionId);
    if (res.ok) {
      setCustomCriteria(res.criteria);
      notify('warning', res.message);
    } else {
      notify('error', res.message);
    }
    return { ok: res.ok, message: res.message };
  };

  const switchSystemVersion = (targetVersionId: AppSystemVersionId) => {
    // Salva um snapshot de backup da versão atual antes de alternar
    try {
      localStorage.setItem(
        `enigma_version_backup_${systemVersion}`,
        JSON.stringify({
          savedAt: nowFormatted(),
          versionId: systemVersion,
          houseCatalog,
          bankCatalog,
          customCriteria,
          allPartnerships,
          allBankAccounts,
          allHouseAccounts,
          usdtBrlRate,
          eurUsdtRate,
          currencyDisplayMode,
        })
      );
      localStorage.setItem(SYSTEM_VERSION_STORAGE_KEY, targetVersionId);
    } catch {
      // ignore
    }

    const preset = buildVersionPresetData(targetVersionId);
    setSystemVersionState(targetVersionId);
    setHouseCatalog(preset.houseCatalog);
    setBankCatalog(preset.bankCatalog);
    setCustomCriteria(preset.customCriteria);
    setAllPartnerships(preset.partnerships);
    setAllBankAccounts(preset.bankAccounts);
    setAllHouseAccounts(preset.houseAccounts);
    setCurrencyDisplayMode(preset.metadata.defaultCurrencyMode);
    setUsdtBrlRate(preset.metadata.defaultUsdtBrlRate);
    setEurUsdtRate(preset.metadata.defaultEurUsdtRate);

    notify(
      'success',
      `Versão alternada para "${preset.metadata.tag}": ${preset.metadata.subtitle}. (Backup da versão anterior salvo automaticamente).`
    );
  };

  return (
    <EnigmaContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        navFocus,
        clearNavFocus,
        users,
        pendingUsers,
        pendingUsersCount,
        userPersistenceSnapshot,
        currentUser,
        setCurrentUserId: handleSetCurrentUserId,
        isAuthenticated,
        loginWithCredentials,
        logoutUser,
        registerUserRequest,
        approveUserRegistration,
        rejectUserRegistration,
        createAdminUser,
        updateAdminUser,
        updateAdminUserCredentials,
        deleteAdminUser,
        syncUsersRepositoryNow,
        importUsersFromJsonSnapshot,
        exportRequests,
        requestAdminExport,
        fulfillExportRequest,
        updateOwnProfileSecurity,
        partnerships: filteredData.partnerships,
        houseAccounts: filteredData.houseAccounts,
        bankAccounts: filteredData.bankAccounts,
        entries: filteredData.entries,
        settledEntries: dashboardReport.settledEntries,
        settlementUndatedCount: dashboardReport.undatedCount,
        operationalSnapshot: dashboardReport.operationalSnapshot,
        withdrawals: filteredData.withdrawals,
        deposits: filteredData.deposits,
        costs: filteredData.costs,
        divergences: filteredData.divergences,
        allPartnerships,
        allHouseAccounts,
        allBankAccounts,
        allEntries: filteredAllEntries,
        allWithdrawals: filteredAllWithdrawals,
        allCosts: filteredAllCosts,
        ledgerMovements: filteredLedgerMovements,
        credentialLogs: filteredCredentialLogs,
        gsbCandidates,
        availableHouses,
        availableBanks,
        houseCatalog,
        bankCatalog,
        customCriteria,
        catalogPersistenceSnapshot,
        upsertHouseCatalogItem,
        toggleHouseCatalogActive,
        removeHouseCatalogItem,
        upsertBankCatalogItem,
        toggleBankCatalogActive,
        removeBankCatalogItem,
        addCatalogCriterion,
        deleteCatalogCriterion,
        periodStart,
        periodEnd,
        setPeriodStart,
        setPeriodEnd,
        setPeriodRange,
        resetPeriodToCurrentMonth,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        activePeriodLabel,
        operationalMonth,
        operationalYear,
        operationalMonthYearLabel,
        setOperationalMonth,
        setOperationalYear,
        setOperationalMonthYear,
        dateFilter,
        isDateFilterActive,
        setDateFilterRange,
        applyDatePreset,
        clearDateFilter,
        showTips,
        setShowTips,
        dismissedTips,
        dismissTip,
        restoreAllTips,
        isTipVisible,
        usdtBrlRate,
        setUsdtBrlRate,
        eurUsdtRate,
        setEurUsdtRate,
        currencyDisplayMode,
        setCurrencyDisplayMode,
        operatorPreferredExchange,
        setOperatorPreferredExchange,
        systemVersion,
        systemVersionsList: SYSTEM_VERSIONS,
        switchSystemVersion,
        globalSummary,
        lastSyncedText,
        triggerSyncNow,
        resetDemoData,
        activateCleanProductionBase,
        isProductionCleanMode,
        feedbackBanner,
        clearFeedback,
        notify,
        saveBetEntry,
        concludeBetEntry,
        addLegToEntry,
        toggleGsbCandidate,
        importSelectedGsbCandidates,
        createWithdrawal,
        advanceWithdrawalStage,
        registerStandaloneFacial,
        createDepositOrTransfer,
        confirmPendingDeposit,
        updateInformedRealBalance,
        classifyDivergence,
        confirmImportStatementCandidates,
        updateHouseAccountOperationalStatus,
        adjustAccountBalanceWithJustification,
        reverseLedgerMovement,
        pullPartnershipFromStock,
        returnPartnershipToStock,
        settlePartnershipReimbursement,
        createDirectPartnership,
        addHouseToPartnership,
        addBankToPartnership,
        updateBankInPartnership,
        removeBankFromPartnership,
        updatePartnershipDetails,
        logCredentialReveal,
        addManualCost,
        reverseCostRecord,
      }}
    >
      {children}
    </EnigmaContext.Provider>
  );
};

export function useEnigma() {
  const ctx = useContext(EnigmaContext);
  if (!ctx) {
    throw new Error('useEnigma must be used within EnigmaProvider');
  }
  return ctx;
}
