import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Tabela de Empresas / Unidades Operacionais
export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  operationalMonth: integer('operational_month').notNull().default(10),
  operationalYear: integer('operational_year').notNull().default(2026),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Tabela de Usuários (RBAC + Suporte a Firebase Auth UID)
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  login: text('login').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('operador'), // 'admin' | 'operador' | 'socio'
  status: text('status').notNull().default('pendente'), // 'pendente' | 'ativo' | 'bloqueado'
  companyId: text('company_id')
    .notNull()
    .default('enigma_grupo')
    .references(() => companies.id),
  profitSharePercent: numeric('profit_share_percent', { precision: 5, scale: 2 })
    .notNull()
    .default('50.00'),
  initialMonthlyBalance: numeric('initial_monthly_balance', { precision: 14, scale: 2 })
    .notNull()
    .default('0.00'),
  phone: text('phone'),
  registrationNotes: text('registration_notes'),
  createdAt: text('created_at').notNull(),
  approvedAt: text('approved_at'),
  approvedBy: text('approved_by'),
  lastLoginAt: text('last_login_at'),
});

// 3. Tabela de Parcerias (Titulares / Contas Físicas)
export const partnerships = pgTable('partnerships', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  titularName: text('titular_name').notNull(),
  shortName: text('short_name').notNull(),
  cpf: text('cpf').notNull(),
  birthDate: text('birth_date'),
  address: text('address'),
  emailOperation: text('email_operation'),
  emailPersonal: text('email_personal'),
  phones: text('phones'),
  chipLocation: text('chip_location'),
  referral: text('referral'),
  period: text('period'),
  status: text('status').notNull().default('estoque'), // 'estoque' | 'ativa' | 'fila' | 'arquivada'
  origin: text('origin').notNull().default('estoque'), // 'estoque' | 'atendimento'
  operatorId: text('operator_id'),
  paidByOperatorId: text('paid_by_operator_id').notNull(),
  creationCost: numeric('creation_cost', { precision: 14, scale: 2 })
    .notNull()
    .default('0.00'),
  creationCostCharged: boolean('creation_cost_charged').notNull().default(true),
  reimbursementDueToOperatorId: text('reimbursement_due_to_operator_id'),
  reimbursementAmount: numeric('reimbursement_amount', { precision: 14, scale: 2 })
    .notNull()
    .default('0.00'),
  reimbursementSettled: boolean('reimbursement_settled').notNull().default(true),
  pixWithdrawals: text('pix_withdrawals'),
  pixPayments: text('pix_payments'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 4. Histórico de Eventos / Movimentação de Parcerias
export const partnershipAssignmentEvents = pgTable('partnership_assignment_events', {
  id: text('id').primaryKey(),
  partnershipId: text('partnership_id')
    .notNull()
    .references(() => partnerships.id, { onDelete: 'cascade' }),
  eventDate: text('event_date').notNull(),
  action: text('action').notNull(),
  fromOperatorId: text('from_operator_id'),
  toOperatorId: text('to_operator_id'),
  authorName: text('author_name').notNull(),
  note: text('note'),
});

// 5. Contas Bancárias Operacionais
export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  bankName: text('bank_name').notNull(),
  label: text('label').notNull(),
  status: text('status').notNull().default('ativo'), // 'ativo' | 'sem_status' | 'bloqueado'
  phoneDevice: text('phone_device'),
  login: text('login'),
  passwordSecret: text('password_secret'),
  pixKey: text('pix_key'),
  balance: numeric('balance', { precision: 14, scale: 2 }).notNull().default('0.00'),
  informedRealBalance: numeric('informed_real_balance', { precision: 14, scale: 2 }),
  lastReconciledAt: text('last_reconciled_at'),
});

// 6. Contas em Casas de Apostas
export const houseAccounts = pgTable('house_accounts', {
  id: text('id').primaryKey(),
  partnershipId: text('partnership_id')
    .notNull()
    .references(() => partnerships.id, { onDelete: 'cascade' }),
  houseName: text('house_name').notNull(),
  cloneGroup: text('clone_group').notNull().default('Sem clones'),
  label: text('label').notNull(),
  status: text('status').notNull().default('pronta'),
  login: text('login').notNull(),
  passwordSecret: text('password_secret').notNull(),
  availableBalance: numeric('available_balance', { precision: 14, scale: 2 })
    .notNull()
    .default('0.00'),
  informedRealBalance: numeric('informed_real_balance', { precision: 14, scale: 2 }),
  lastReconciledAt: text('last_reconciled_at'),
  weeklyFacialDue: text('weekly_facial_due'),
  weeklyFacialPending: boolean('weekly_facial_pending').notNull().default(false),
  notes: text('notes'),
});

// 7. Entradas Operacionais
export const betEntries = pgTable('bet_entries', {
  id: text('id').primaryKey(),
  mode: text('mode').notNull().default('rapido'), // 'rapido' | 'detalhado'
  operationType: text('operation_type').notNull(), // 'ao_vivo' | 'pre_jogo' | 'cashout' | 'bonus' | 'delay' | 'extracao'
  event: text('event').notNull(),
  market: text('market'),
  createdAt: text('created_at').notNull(),
  concludedAt: text('concluded_at'),
  operatorId: text('operator_id').notNull(),
  origin: text('origin').notNull().default('Manual'),
  totalInvestedCapital: numeric('total_invested_capital', { precision: 14, scale: 2 }),
  resultStatus: text('result_status').notNull().default('aberta'),
  reconciliationStatus: text('reconciliation_status').notNull().default('pendente_apuracao'),
  simpleResultHint: text('simple_result_hint'),
  notes: text('notes'),
});

// 8. Pernas da Operação
export const betLegs = pgTable('bet_legs', {
  id: text('id').primaryKey(),
  entryId: text('entry_id')
    .notNull()
    .references(() => betEntries.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  houseName: text('house_name').notNull(),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  accountId: text('account_id').references(() => houseAccounts.id, {
    onDelete: 'set null',
  }),
  selection: text('selection'),
  odd: numeric('odd', { precision: 10, scale: 4 }),
  stake: numeric('stake', { precision: 14, scale: 2 }),
  result: text('result').notNull().default('pendente'),
  grossReturn: numeric('gross_return', { precision: 14, scale: 2 }),
  createdAt: text('created_at').notNull(),
});

// 9. Saques e Ciclo de Vida
export const withdrawals = pgTable('withdrawals', {
  id: text('id').primaryKey(),
  houseAccountId: text('house_account_id')
    .notNull()
    .references(() => houseAccounts.id, { onDelete: 'restrict' }),
  partnershipId: text('partnership_id')
    .notNull()
    .references(() => partnerships.id, { onDelete: 'restrict' }),
  destinationBankId: text('destination_bank_id')
    .notNull()
    .references(() => bankAccounts.id, { onDelete: 'restrict' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  receivedAmount: numeric('received_amount', { precision: 14, scale: 2 }),
  feeAmount: numeric('fee_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  noCostConfirmed: boolean('no_cost_confirmed').notNull().default(false),
  stage: text('stage').notNull().default('solicitado'),
  issueType: text('issue_type').notNull().default('nenhum'),
  issueNotes: text('issue_notes'),
  priority: text('priority').notNull().default('media'),
  requestedAt: text('requested_at').notNull(),
  houseCompletedAt: text('house_completed_at'),
  bankReceivedAt: text('bank_received_at'),
  hoursElapsed: integer('hours_elapsed').notNull().default(0),
  operatorId: text('operator_id').notNull(),
});

// 10. Depósitos e Transferências entre Contas
export const depositsTransfers = pgTable('deposits_transfers', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // 'deposito_casa' | 'transferencia_bancos'
  originBankId: text('origin_bank_id')
    .notNull()
    .references(() => bankAccounts.id, { onDelete: 'restrict' }),
  destinationHouseAccountId: text('destination_house_account_id').references(
    () => houseAccounts.id,
    { onDelete: 'set null' }
  ),
  destinationBankId: text('destination_bank_id').references(() => bankAccounts.id, {
    onDelete: 'set null',
  }),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  feeAmount: numeric('fee_amount', { precision: 14, scale: 2 }).notNull().default('0.00'),
  status: text('status').notNull().default('pretendido'),
  createdAt: text('created_at').notNull(),
  confirmedAt: text('confirmed_at'),
  operatorId: text('operator_id').notNull(),
  originTag: text('origin_tag').notNull(),
  notes: text('notes'),
});

// 11. Custos Operacionais e Faciais
export const costRecords = pgTable('cost_records', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  detail: text('detail').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  recordDate: text('record_date').notNull(),
  operatorId: text('operator_id').notNull(),
  paidByOperatorId: text('paid_by_operator_id').notNull(),
  origin: text('origin').notNull(),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  houseAccountId: text('house_account_id').references(() => houseAccounts.id, {
    onDelete: 'set null',
  }),
  withdrawalId: text('withdrawal_id').references(() => withdrawals.id, {
    onDelete: 'set null',
  }),
  reversed: boolean('reversed').notNull().default(false),
  reversalReason: text('reversal_reason'),
});

// 12. Divergências e Conciliação
export const reconciliationDivergences = pgTable('reconciliation_divergences', {
  id: text('id').primaryKey(),
  targetType: text('target_type').notNull(), // 'casa' | 'banco'
  targetId: text('target_id').notNull(),
  targetLabel: text('target_label').notNull(),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  operatorId: text('operator_id').notNull(),
  expectedBalance: numeric('expected_balance', { precision: 14, scale: 2 }).notNull(),
  realBalance: numeric('real_balance', { precision: 14, scale: 2 }).notNull(),
  difference: numeric('difference', { precision: 14, scale: 2 }).notNull(),
  status: text('status').notNull().default('aberta'),
  classification: text('classification').notNull(),
  justification: text('justification'),
  responsibleName: text('responsible_name').notNull(),
  updatedAt: text('updated_at').notNull(),
  contextHint: text('context_hint'),
});

// 13. Livro Razão / Movimentações Financeiras (Ledger)
export const ledgerMovements = pgTable('ledger_movements', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  houseName: text('house_name'),
  partnershipId: text('partnership_id').references(() => partnerships.id, {
    onDelete: 'set null',
  }),
  houseAccountId: text('house_account_id').references(() => houseAccounts.id, {
    onDelete: 'set null',
  }),
  bankAccountId: text('bank_account_id').references(() => bankAccounts.id, {
    onDelete: 'set null',
  }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  timestamp: text('timestamp').notNull(),
  operatorId: text('operator_id').notNull(),
  authorName: text('author_name').notNull(),
  status: text('status').notNull().default('pendente'),
  referenceId: text('reference_id').notNull(),
  notes: text('notes'),
  reversedByMovementId: text('reversed_by_movement_id'),
});

// 14. Permissões de Acesso do Operador por Conta
export const accountOperatorPermissions = pgTable('account_operator_permissions', {
  id: text('id').primaryKey(),
  targetType: text('target_type').notNull(), // 'casa' | 'banco'
  targetAccountId: text('target_account_id').notNull(),
  operatorId: text('operator_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
});

// 15. Auditoria de Liberação / Gestão de Usuários
export const userApprovalAuditLogs = pgTable('user_approval_audit_logs', {
  id: text('id').primaryKey(),
  targetUserId: text('target_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  adminUserId: text('admin_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  action: text('action').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

// 16. Log de Acesso a Credenciais
export const credentialAccessLogs = pgTable('credential_access_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  userName: text('user_name').notNull(),
  partnershipId: text('partnership_id')
    .notNull()
    .references(() => partnerships.id, { onDelete: 'cascade' }),
  targetType: text('target_type').notNull(),
  targetLabel: text('target_label').notNull(),
});

// 17. Catálogo Dinâmico de Casas de Apostas
export const catalogHouses = pgTable('catalog_houses', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  active: boolean('active').notNull().default(true),
  cloneGroup: text('clone_group').notNull().default('Sem clones'),
  category: text('category').notNull().default('Nacional'),
  verificationPolicy: text('verification_policy').notNull().default('Facial no saque'),
  defaultMinStake: numeric('default_min_stake', { precision: 12, scale: 2 })
    .notNull()
    .default('10.00'),
  withdrawLeadTime: text('withdraw_lead_time').notNull().default('PIX Imediato'),
  notes: text('notes'),
  customValuesJson: text('custom_values_json').notNull().default('{}'),
  updatedAt: text('updated_at').notNull(),
});

// 18. Catálogo Dinâmico de Bancos
export const catalogBanks = pgTable('catalog_banks', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(),
  compeCode: text('compe_code').notNull().default('000'),
  active: boolean('active').notNull().default(true),
  accountType: text('account_type').notNull().default('Conta Digital PF'),
  pixKeyTypes: text('pix_key_types')
    .notNull()
    .default('CPF, E-mail, Celular, Aleatória'),
  dailyPixLimit: numeric('daily_pix_limit', { precision: 14, scale: 2 })
    .notNull()
    .default('20000.00'),
  transferFeeDefault: numeric('transfer_fee_default', { precision: 10, scale: 2 })
    .notNull()
    .default('0.00'),
  devicePolicy: text('device_policy')
    .notNull()
    .default('App no celular da parceria'),
  notes: text('notes'),
  customValuesJson: text('custom_values_json').notNull().default('{}'),
  updatedAt: text('updated_at').notNull(),
});

// 19. Critérios Customizados Dinâmicos (Casas e Bancos)
export const catalogCustomCriteria = pgTable('catalog_custom_criteria', {
  id: text('id').primaryKey(),
  target: text('target').notNull(), // 'casa' | 'banco'
  criterionKey: text('criterion_key').notNull(),
  label: text('label').notNull(),
  fieldType: text('field_type').notNull(), // 'texto' | 'numero' | 'moeda' | 'selecao'
  optionsJson: text('options_json'),
  defaultValue: text('default_value').notNull().default(''),
  description: text('description'),
  required: boolean('required').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Relacionamentos Drizzle
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  permissions: many(accountOperatorPermissions),
}));

export const partnershipsRelations = relations(partnerships, ({ many }) => ({
  houseAccounts: many(houseAccounts),
  bankAccounts: many(bankAccounts),
  assignmentEvents: many(partnershipAssignmentEvents),
}));

export const houseAccountsRelations = relations(houseAccounts, ({ one, many }) => ({
  partnership: one(partnerships, {
    fields: [houseAccounts.partnershipId],
    references: [partnerships.id],
  }),
  withdrawals: many(withdrawals),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  partnership: one(partnerships, {
    fields: [bankAccounts.partnershipId],
    references: [partnerships.id],
  }),
}));

export const betEntriesRelations = relations(betEntries, ({ many }) => ({
  legs: many(betLegs),
}));

export const betLegsRelations = relations(betLegs, ({ one }) => ({
  entry: one(betEntries, {
    fields: [betLegs.entryId],
    references: [betEntries.id],
  }),
}));
