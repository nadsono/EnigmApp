import {
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
} from '../domain/catalog.ts';
import type {
  BankCatalogItem,
  CatalogCustomCriterion,
  HouseCatalogItem,
  UserProfile,
} from '../domain/types.ts';

export interface DatabaseMigrationItem {
  id: string;
  filename: string;
  title: string;
  description: string;
  tables: string[];
  sqlPreview: string;
}

export const ENIGMA_DATABASE_MIGRATIONS: DatabaseMigrationItem[] = [
  {
    id: '20261028000001_enigma_initial_schema',
    filename: 'supabase/migrations/20261028000001_enigma_initial_schema.sql',
    title: 'Supabase 001 · Schema Operacional Base (Parcerias, Contas, Entradas, Saques e Ledger)',
    description:
      'Cria as 12 tabelas operacionais no schema public do Supabase/PostgreSQL: empresas, parcerias, eventos de estoque, contas bancárias, contas em casas, entradas/pernas, saques, depósitos, custos, divergências e razão (ledger).',
    tables: [
      'companies',
      'partnerships',
      'partnership_assignment_events',
      'bank_accounts',
      'house_accounts',
      'bet_entries',
      'bet_legs',
      'withdrawals',
      'deposits_transfers',
      'cost_records',
      'reconciliation_divergences',
      'ledger_movements',
    ],
    sqlPreview: `-- supabase/migrations/20261028000001_enigma_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  operational_month INTEGER NOT NULL DEFAULT 10 CHECK (operational_month BETWEEN 1 AND 12),
  operational_year INTEGER NOT NULL DEFAULT 2026 CHECK (operational_year BETWEEN 2020 AND 2100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.partnerships (
  id VARCHAR(64) PRIMARY KEY,
  holder_name VARCHAR(160) NOT NULL,
  cpfMasked VARCHAR(32) NOT NULL,
  phone VARCHAR(48) NOT NULL,
  operator_id VARCHAR(64) NOT NULL,
  operator_label VARCHAR(120) NOT NULL,
  supplier VARCHAR(120) NOT NULL,
  acquisition_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  StartDate VARCHAR(32) NOT NULL,
  bank_name VARCHAR(120) NOT NULL,
  bank_status VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('ativa', 'atencao', 'encerrada')),
  lifecycle_stage VARCHAR(32) NOT NULL DEFAULT 'em_uso',
  allocated_at VARCHAR(32),
  replaced_by_partnership_id VARCHAR(64),
  contingency_reserve NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  observation TEXT,
  company_id VARCHAR(64) NOT NULL DEFAULT 'enigma_grupo' REFERENCES public.companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (...);
CREATE TABLE IF NOT EXISTS public.house_accounts (...);
CREATE TABLE IF NOT EXISTS public.bet_entries (...);
CREATE TABLE IF NOT EXISTS public.bet_legs (...);
CREATE TABLE IF NOT EXISTS public.withdrawals (...);
CREATE TABLE IF NOT EXISTS public.deposits_transfers (...);
CREATE TABLE IF NOT EXISTS public.cost_records (...);
CREATE TABLE IF NOT EXISTS public.reconciliation_divergences (...);
CREATE TABLE IF NOT EXISTS public.ledger_movements (...);`,
  },
  {
    id: '20261028000002_enigma_users_auth_and_rbac',
    filename: 'supabase/migrations/20261028000002_enigma_users_auth_and_rbac.sql',
    title: 'Supabase 002 · Usuários, Autenticação (Login/Senha), RBAC e Fila de Aprovação Admin',
    description:
      'Estrutura a tabela public.users com login, e-mail, hash SHA-256, vínculo UID, papel (admin, operador, socio), status (pendente, ativo, bloqueado), permissões granulares e logs de auditoria.',
    tables: [
      'users',
      'account_operator_permissions',
      'user_approval_audit_logs',
      'credential_access_logs',
    ],
    sqlPreview: `-- supabase/migrations/20261028000002_enigma_users_auth_and_rbac.sql
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  uid VARCHAR(128) UNIQUE,
  name VARCHAR(160) NOT NULL,
  short_name VARCHAR(80) NOT NULL,
  login VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  password_plain_fallback VARCHAR(120),
  password_updated_at VARCHAR(32),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(24) NOT NULL CHECK (role IN ('admin', 'operador', 'socio')),
  status VARCHAR(24) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'bloqueado')),
  company_id VARCHAR(64) NOT NULL DEFAULT 'enigma_grupo' REFERENCES public.companies(id) ON DELETE CASCADE,
  profit_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
  initial_monthly_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  phone VARCHAR(48),
  registration_notes TEXT,
  created_at VARCHAR(32) NOT NULL,
  approved_at VARCHAR(32),
  approved_by VARCHAR(120),
  last_login_at VARCHAR(32)
);

CREATE TABLE IF NOT EXISTS public.account_operator_permissions (...);
CREATE TABLE IF NOT EXISTS public.user_approval_audit_logs (...);
CREATE TABLE IF NOT EXISTS public.credential_access_logs (...);`,
  },
  {
    id: '20261028000003_enigma_catalog_houses_banks_criteria',
    filename: 'supabase/migrations/20261028000003_enigma_catalog_houses_banks_criteria.sql',
    title: 'Supabase 003 · Catálogo Dinâmico de Casas, Bancos e Critérios Adicionais',
    description:
      'Cria as tabelas public.catalog_houses, public.catalog_banks e public.catalog_custom_criteria (custom_values_json) para adicionar/remover casas, bancos e campos futuros no banco.',
    tables: [
      'catalog_houses',
      'catalog_banks',
      'catalog_custom_criteria',
    ],
    sqlPreview: `-- supabase/migrations/20261028000003_enigma_catalog_houses_banks_criteria.sql
CREATE TABLE IF NOT EXISTS public.catalog_houses (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  code VARCHAR(80) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  clone_group VARCHAR(80) NOT NULL DEFAULT 'Sem clones',
  category VARCHAR(80) NOT NULL DEFAULT 'Nacional',
  verification_policy VARCHAR(160) NOT NULL DEFAULT 'Facial no saque',
  default_min_stake NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
  withdraw_lead_time VARCHAR(80) NOT NULL DEFAULT 'PIX Imediato',
  notes TEXT,
  custom_values_json TEXT NOT NULL DEFAULT '{}',
  updated_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.catalog_banks (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  code VARCHAR(80) NOT NULL UNIQUE,
  compe_code VARCHAR(16) NOT NULL DEFAULT '000',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  account_type VARCHAR(80) NOT NULL DEFAULT 'Conta Digital PF',
  pix_key_types VARCHAR(180) NOT NULL,
  daily_pix_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000.00,
  transfer_fee_default NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  device_policy VARCHAR(180) NOT NULL,
  notes TEXT,
  custom_values_json TEXT NOT NULL DEFAULT '{}',
  updated_at VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.catalog_custom_criteria (
  id VARCHAR(64) PRIMARY KEY,
  target VARCHAR(16) NOT NULL CHECK (target IN ('casa', 'banco')),
  criterion_key VARCHAR(80) NOT NULL,
  label VARCHAR(120) NOT NULL,
  field_type VARCHAR(24) NOT NULL,
  options_json TEXT,
  default_value VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at VARCHAR(32) NOT NULL,
  UNIQUE (target, criterion_key)
);`,
  },
  {
    id: '20261028000004_enigma_supabase_rls_and_realtime',
    filename: 'supabase/migrations/20261028000004_enigma_supabase_rls_and_realtime.sql',
    title: 'Supabase 004 · Row Level Security (RLS), Políticas de Acesso e View de Patrimônio',
    description:
      'Habilita Row Level Security (RLS) nas 19 tabelas do Supabase e cria a View consolidada public.vw_partnership_patrimony (soma automática de bancos, casas e saques em trânsito).',
    tables: [
      'companies',
      'users',
      'partnerships',
      'bank_accounts',
      'house_accounts',
      'vw_partnership_patrimony',
    ],
    sqlPreview: `-- supabase/migrations/20261028000004_enigma_supabase_rls_and_realtime.sql
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bet_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_custom_criteria ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.vw_partnership_patrimony AS
SELECT
  p.id AS partnership_id,
  p.holder_name,
  p.cpfMasked,
  p.operator_id,
  COALESCE(b.total_bank_balance, 0)::NUMERIC(14,2) AS total_bank_balance,
  COALESCE(h.total_house_balance, 0)::NUMERIC(14,2) AS total_house_balance,
  COALESCE(h.total_in_transit, 0)::NUMERIC(14,2) AS total_in_transit
FROM public.partnerships p
LEFT JOIN (SELECT partnership_id, SUM(balance) AS total_bank_balance FROM public.bank_accounts GROUP BY partnership_id) b ON b.partnership_id = p.id
LEFT JOIN (SELECT partnership_id, SUM(balance) AS total_house_balance, SUM(in_transitWithdrawal) AS total_in_transit FROM public.house_accounts GROUP BY partnership_id) h ON h.partnership_id = p.id;`,
  },
  {
    id: 'supabase_seed_sql',
    filename: 'supabase/seed.sql',
    title: 'Supabase Seed · Empresa, Administrador, Equipe, 15 Casas e 8 Bancos',
    description:
      'Popula a empresa enigma_grupo, a conta mestre de Administrador, operadores, sócios, as 15 casas de apostas iniciais e os 8 bancos operacionais brasileiros.',
    tables: ['companies', 'users', 'catalog_houses', 'catalog_banks'],
    sqlPreview: `-- supabase/seed.sql
INSERT INTO public.companies (id, name, operational_month, operational_year)
VALUES ('enigma_grupo', 'Enigma Operações Esportivas', 10, 2026)
ON CONFLICT (id) DO UPDATE SET operational_month = EXCLUDED.operational_month, operational_year = EXCLUDED.operational_year;

INSERT INTO public.users (id, name, short_name, login, email, password_hash, role, status)
VALUES ('admin', 'Administrador Geral', 'Administrador', 'admin', 'admin@enigma.com', 'sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin', 'ativo')
ON CONFLICT (id) DO NOTHING;`,
  },
];

function escapeSqlLiteral(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generateLiveUsersSqlMigration(
  users: UserProfile[],
  operationalMonth: number,
  operationalYear: number,
  catalog?: {
    houses?: HouseCatalogItem[];
    banks?: BankCatalogItem[];
    customCriteria?: CatalogCustomCriterion[];
  }
): string {
  const houses = catalog?.houses || INITIAL_HOUSE_CATALOG;
  const banks = catalog?.banks || INITIAL_BANK_CATALOG;
  const criteria = catalog?.customCriteria || INITIAL_CUSTOM_CRITERIA;

  const lines: string[] = [
    '-- =============================================================================',
    '-- ENIGMA GESTÃO — SUPABASE / POSTGRESQL FULL MIGRATION & LIVE SEED BUNDLE',
    `-- Período Operacional Global: ${String(operationalMonth).padStart(2, '0')}/${operationalYear}`,
    '-- Arquivos consolidados:',
    '--   1. supabase/migrations/20261028000001_enigma_initial_schema.sql',
    '--   2. supabase/migrations/20261028000002_enigma_users_auth_and_rbac.sql',
    '--   3. supabase/migrations/20261028000003_enigma_catalog_houses_banks_criteria.sql',
    '--   4. supabase/migrations/20261028000004_enigma_supabase_rls_and_realtime.sql',
    '--   5. supabase/seed.sql (Estado ao vivo dos Usuários e Catálogo)',
    '-- =============================================================================',
    '',
    'BEGIN;',
    '',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
    '',
    'CREATE TABLE IF NOT EXISTS companies (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(160) NOT NULL,',
    '  operational_month INTEGER NOT NULL DEFAULT 10,',
    '  operational_year INTEGER NOT NULL DEFAULT 2026',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS users (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  uid VARCHAR(128) UNIQUE,',
    '  name VARCHAR(160) NOT NULL,',
    '  short_name VARCHAR(80) NOT NULL,',
    '  login VARCHAR(80) NOT NULL UNIQUE,',
    '  email VARCHAR(180) NOT NULL UNIQUE,',
    '  password_hash VARCHAR(255) NOT NULL,',
    "  role VARCHAR(24) NOT NULL CHECK (role IN ('admin', 'operador', 'socio')),",
    "  status VARCHAR(24) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'bloqueado')),",
    "  company_id VARCHAR(64) NOT NULL DEFAULT 'enigma_grupo',",
    '  profit_share_percent NUMERIC(5, 2) NOT NULL DEFAULT 50.00,',
    '  initial_monthly_balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,',
    '  phone VARCHAR(48),',
    '  registration_notes TEXT,',
    '  created_at VARCHAR(32) NOT NULL,',
    '  approved_at VARCHAR(32),',
    '  approved_by VARCHAR(120),',
    '  last_login_at VARCHAR(32)',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS catalog_houses (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(120) NOT NULL UNIQUE,',
    '  code VARCHAR(80) NOT NULL UNIQUE,',
    '  active BOOLEAN NOT NULL DEFAULT TRUE,',
    "  clone_group VARCHAR(80) NOT NULL DEFAULT 'Sem clones',",
    "  category VARCHAR(80) NOT NULL DEFAULT 'Nacional',",
    "  verification_policy VARCHAR(160) NOT NULL DEFAULT 'Facial no saque',",
    '  default_min_stake NUMERIC(12, 2) NOT NULL DEFAULT 10.00,',
    "  withdraw_lead_time VARCHAR(80) NOT NULL DEFAULT 'PIX Imediato',",
    '  notes TEXT,',
    "  custom_values_json TEXT NOT NULL DEFAULT '{}',",
    '  updated_at VARCHAR(32) NOT NULL',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS catalog_banks (',
    '  id VARCHAR(64) PRIMARY KEY,',
    '  name VARCHAR(120) NOT NULL UNIQUE,',
    '  code VARCHAR(80) NOT NULL UNIQUE,',
    "  compe_code VARCHAR(16) NOT NULL DEFAULT '000',",
    '  active BOOLEAN NOT NULL DEFAULT TRUE,',
    "  account_type VARCHAR(80) NOT NULL DEFAULT 'Conta Digital PF',",
    "  pix_key_types VARCHAR(180) NOT NULL DEFAULT 'CPF, E-mail, Celular, Aleatória',",
    '  daily_pix_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000.00,',
    '  transfer_fee_default NUMERIC(10, 2) NOT NULL DEFAULT 0.00,',
    "  device_policy VARCHAR(180) NOT NULL DEFAULT 'App no celular da parceria',",
    '  notes TEXT,',
    "  custom_values_json TEXT NOT NULL DEFAULT '{}',",
    '  updated_at VARCHAR(32) NOT NULL',
    ');',
    '',
    'CREATE TABLE IF NOT EXISTS catalog_custom_criteria (',
    '  id VARCHAR(64) PRIMARY KEY,',
    "  target VARCHAR(16) NOT NULL CHECK (target IN ('casa', 'banco')),",
    '  criterion_key VARCHAR(80) NOT NULL,',
    '  label VARCHAR(120) NOT NULL,',
    "  field_type VARCHAR(24) NOT NULL CHECK (field_type IN ('texto', 'numero', 'moeda', 'booleano', 'selecao')),",
    '  options_json TEXT,',
    "  default_value VARCHAR(255) NOT NULL DEFAULT '',",
    '  description TEXT,',
    '  required BOOLEAN NOT NULL DEFAULT FALSE,',
    '  created_at VARCHAR(32) NOT NULL,',
    '  UNIQUE (target, criterion_key)',
    ');',
    '',
    `INSERT INTO companies (id, name, operational_month, operational_year) VALUES ('enigma_grupo', 'Enigma Operações Esportivas', ${operationalMonth}, ${operationalYear}) ON CONFLICT (id) DO UPDATE SET operational_month = EXCLUDED.operational_month, operational_year = EXCLUDED.operational_year;`,
    '',
  ];

  for (const u of users) {
    lines.push(
      `INSERT INTO users (id, name, short_name, login, email, password_hash, role, status, company_id, profit_share_percent, initial_monthly_balance, phone, registration_notes, created_at, approved_at, approved_by, last_login_at) VALUES (${escapeSqlLiteral(
        u.id
      )}, ${escapeSqlLiteral(u.name)}, ${escapeSqlLiteral(u.shortName)}, ${escapeSqlLiteral(
        u.login
      )}, ${escapeSqlLiteral(u.email)}, ${escapeSqlLiteral(
        u.passwordHash || u.password || 'op123'
      )}, ${escapeSqlLiteral(u.role)}, ${escapeSqlLiteral(u.status)}, ${escapeSqlLiteral(
        u.companyId
      )}, ${u.profitSharePercent.toFixed(2)}, ${u.initialMonthlyBalance.toFixed(
        2
      )}, ${escapeSqlLiteral(u.phone || '')}, ${escapeSqlLiteral(
        u.registrationNotes || ''
      )}, ${escapeSqlLiteral(u.createdAt || '01/10/2026')}, ${escapeSqlLiteral(
        u.approvedAt
      )}, ${escapeSqlLiteral(u.approvedBy)}, ${escapeSqlLiteral(
        u.lastLoginAt
      )}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, short_name = EXCLUDED.short_name, login = EXCLUDED.login, email = EXCLUDED.email, role = EXCLUDED.role, status = EXCLUDED.status, profit_share_percent = EXCLUDED.profit_share_percent, initial_monthly_balance = EXCLUDED.initial_monthly_balance;`
    );
  }

  lines.push('', '-- >>> CATÁLOGO DE CRITÉRIOS ADICIONAIS (CASAS E BANCOS)');
  for (const c of criteria) {
    lines.push(
      `INSERT INTO catalog_custom_criteria (id, target, criterion_key, label, field_type, options_json, default_value, description, required, created_at) VALUES (${escapeSqlLiteral(
        c.id
      )}, ${escapeSqlLiteral(c.target)}, ${escapeSqlLiteral(c.key)}, ${escapeSqlLiteral(
        c.label
      )}, ${escapeSqlLiteral(c.fieldType)}, ${escapeSqlLiteral(
        c.options ? JSON.stringify(c.options) : null
      )}, ${escapeSqlLiteral(c.defaultValue)}, ${escapeSqlLiteral(
        c.description || ''
      )}, ${c.required ? 'TRUE' : 'FALSE'}, ${escapeSqlLiteral(
        c.createdAt
      )}) ON CONFLICT (target, criterion_key) DO UPDATE SET label = EXCLUDED.label, field_type = EXCLUDED.field_type, options_json = EXCLUDED.options_json, default_value = EXCLUDED.default_value, description = EXCLUDED.description;`
    );
  }

  lines.push('', '-- >>> CATÁLOGO DE CASAS DE APOSTAS');
  for (const h of houses) {
    lines.push(
      `INSERT INTO catalog_houses (id, name, code, active, clone_group, category, verification_policy, default_min_stake, withdraw_lead_time, notes, custom_values_json, updated_at) VALUES (${escapeSqlLiteral(
        h.id
      )}, ${escapeSqlLiteral(h.name)}, ${escapeSqlLiteral(h.code)}, ${
        h.active ? 'TRUE' : 'FALSE'
      }, ${escapeSqlLiteral(h.cloneGroup)}, ${escapeSqlLiteral(
        h.category
      )}, ${escapeSqlLiteral(h.verificationPolicy)}, ${h.defaultMinStake.toFixed(
        2
      )}, ${escapeSqlLiteral(h.withdrawLeadTime)}, ${escapeSqlLiteral(
        h.notes
      )}, ${escapeSqlLiteral(JSON.stringify(h.customValues || {}))}, ${escapeSqlLiteral(
        h.updatedAt
      )}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, active = EXCLUDED.active, clone_group = EXCLUDED.clone_group, category = EXCLUDED.category, verification_policy = EXCLUDED.verification_policy, default_min_stake = EXCLUDED.default_min_stake, withdraw_lead_time = EXCLUDED.withdraw_lead_time, notes = EXCLUDED.notes, custom_values_json = EXCLUDED.custom_values_json, updated_at = EXCLUDED.updated_at;`
    );
  }

  lines.push('', '-- >>> CATÁLOGO DE BANCOS OPERACIONAIS');
  for (const b of banks) {
    lines.push(
      `INSERT INTO catalog_banks (id, name, code, compe_code, active, account_type, pix_key_types, daily_pix_limit, transfer_fee_default, device_policy, notes, custom_values_json, updated_at) VALUES (${escapeSqlLiteral(
        b.id
      )}, ${escapeSqlLiteral(b.name)}, ${escapeSqlLiteral(b.code)}, ${escapeSqlLiteral(
        b.compeCode
      )}, ${b.active ? 'TRUE' : 'FALSE'}, ${escapeSqlLiteral(
        b.accountType
      )}, ${escapeSqlLiteral(b.pixKeyTypes)}, ${b.dailyPixLimit.toFixed(
        2
      )}, ${b.transferFeeDefault.toFixed(2)}, ${escapeSqlLiteral(
        b.devicePolicy
      )}, ${escapeSqlLiteral(b.notes)}, ${escapeSqlLiteral(
        JSON.stringify(b.customValues || {})
      )}, ${escapeSqlLiteral(
        b.updatedAt
      )}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, compe_code = EXCLUDED.compe_code, active = EXCLUDED.active, account_type = EXCLUDED.account_type, pix_key_types = EXCLUDED.pix_key_types, daily_pix_limit = EXCLUDED.daily_pix_limit, transfer_fee_default = EXCLUDED.transfer_fee_default, device_policy = EXCLUDED.device_policy, notes = EXCLUDED.notes, custom_values_json = EXCLUDED.custom_values_json, updated_at = EXCLUDED.updated_at;`
    );
  }

  lines.push('', 'COMMIT;', '');
  return lines.join('\n');
}
