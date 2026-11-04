import {
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
} from '../domain/catalog.ts';
import { INITIAL_USERS } from '../domain/seed.ts';
import type {
  BankAccount,
  BankCatalogItem,
  BetEntry,
  CatalogCustomCriterion,
  CostRecord,
  CredentialAccessLog,
  DepositTransfer,
  ExportRequestRecord,
  HouseAccount,
  HouseCatalogItem,
  LedgerMovement,
  Partnership,
  ReconciliationDivergence,
  UserProfile,
  Withdrawal,
} from '../domain/types.ts';

/**
 * ============================================================================
 * CONTROLE DIRETO NO PROJETO — MODO DA BASE DE DADOS (LINHA ESPECÍFICA)
 * ============================================================================
 * Para evitar qualquer botão perigoso de zeramento exposto na interface normal
 * (mesmo para o perfil Administrador), o controle de Base Limpa de Produção ou
 * Restauração de Sementes fica isolado exclusivamente neste arquivo de domínio
 * (`src/database/systemMaintenance.ts`) ou no domínio isolado de manutenção
 * (`/?domain=sys_maintenance`).
 *
 * Opções para `PROJECT_DATABASE_BOOT_MODE`:
 * - 'default'                -> Carrega o estado persistido normalmente.
 * - 'force_production_clean' -> Inicia a aplicação em Modo Base Limpa de Produção
 *                               (zera parcerias, contas, entradas, saques, custos e
 *                               operadores fictícios, preservando apenas o login
 *                               Administrador e o Catálogo de Casas & Bancos).
 * - 'force_demo_seed'        -> Restaura os dados iniciais de demonstração.
 */
export const PROJECT_DATABASE_BOOT_MODE:
  | 'default'
  | 'force_production_clean'
  | 'force_demo_seed' = 'default';

export const ISOLATED_MAINTENANCE_DOMAIN_PARAM = 'sys_maintenance';

export const PRODUCTION_BASE_MODE_STORAGE_KEY = 'enigma_production_base_mode_v1';

export interface CleanProductionStateBundle {
  mode: 'production_clean';
  executedAt: string;
  users: UserProfile[];
  partnerships: Partnership[];
  houseAccounts: HouseAccount[];
  bankAccounts: BankAccount[];
  entries: BetEntry[];
  withdrawals: Withdrawal[];
  deposits: DepositTransfer[];
  costs: CostRecord[];
  divergences: ReconciliationDivergence[];
  ledgerMovements: LedgerMovement[];
  credentialLogs: CredentialAccessLog[];
  exportRequests: ExportRequestRecord[];
  houseCatalog: HouseCatalogItem[];
  bankCatalog: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
}

/**
 * Constrói o estado limpo de produção:
 * - Mantém exclusivamente a(s) conta(s) de Administrador ativa(s) (com capital zerado pronto para operação real)
 * - Preserva integralmente o Catálogo de Casas, Catálogo de Bancos e Critérios Adicionais configurados
 * - Zera todas as parcerias fictícias, contas de exemplo, entradas, saques, depósitos, divergências e custos
 */
export function buildCleanProductionState(params?: {
  currentUsers?: UserProfile[];
  currentHouseCatalog?: HouseCatalogItem[];
  currentBankCatalog?: BankCatalogItem[];
  currentCustomCriteria?: CatalogCustomCriterion[];
  nowText?: string;
}): CleanProductionStateBundle {
  const nowText = params?.nowText || '21/10/2026 16:30';
  const sourceUsers =
    params?.currentUsers && params.currentUsers.length > 0
      ? params.currentUsers
      : INITIAL_USERS;

  const adminUsers = sourceUsers
    .filter((u) => u.role === 'admin' && u.status === 'ativo')
    .map((admin) => ({
      ...admin,
      initialMonthlyBalance: 0,
      lastLoginAt: nowText,
    }));

  const fallbackAdmin: UserProfile = {
    ...INITIAL_USERS[0],
    initialMonthlyBalance: 0,
    lastLoginAt: nowText,
  };

  return {
    mode: 'production_clean',
    executedAt: nowText,
    users: adminUsers.length > 0 ? adminUsers : [fallbackAdmin],
    partnerships: [],
    houseAccounts: [],
    bankAccounts: [],
    entries: [],
    withdrawals: [],
    deposits: [],
    costs: [],
    divergences: [],
    ledgerMovements: [],
    credentialLogs: [],
    exportRequests: [],
    houseCatalog:
      params?.currentHouseCatalog && params.currentHouseCatalog.length > 0
        ? params.currentHouseCatalog
        : INITIAL_HOUSE_CATALOG,
    bankCatalog:
      params?.currentBankCatalog && params.currentBankCatalog.length > 0
        ? params.currentBankCatalog
        : INITIAL_BANK_CATALOG,
    customCriteria:
      params?.currentCustomCriteria && params.currentCustomCriteria.length > 0
        ? params.currentCustomCriteria
        : INITIAL_CUSTOM_CRITERIA,
  };
}

/**
 * Verifica se o navegador está acessando o domínio/rota isolada de manutenção de projeto
 * (`/?domain=sys_maintenance`), que fica fora do fluxo normal da aplicação.
 */
export function isIsolatedMaintenanceDomainActive(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('domain') === ISOLATED_MAINTENANCE_DOMAIN_PARAM ||
      window.location.hash === `#${ISOLATED_MAINTENANCE_DOMAIN_PARAM}`
    );
  } catch {
    return false;
  }
}
