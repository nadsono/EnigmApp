import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_USERS } from './seed.ts';
import {
  approveUserRegistrationPure,
  authenticateUser,
  computePasswordHash,
  createAdminUserPure,
  createRegistrationRequest,
  deleteAdminUserPure,
  getSettingsRoleCapabilities,
  maskPassword,
  updateAdminUserPure,
  updateUserCredentialsPure,
} from './auth.ts';
import { generateLiveUsersSqlMigration } from '../database/migrations.ts';
import {
  buildUserPersistenceSnapshot,
  deserializeUsersPersistenceJson,
  serializeUsersPersistenceJson,
} from '../database/userRepository.ts';
import { buildDatabaseMigrations } from '../../database/migrate.ts';

test('authenticateUser validates default admin credentials and active operators', () => {
  const adminByLogin = authenticateUser(INITIAL_USERS, 'admin', 'admin123');
  assert.equal(adminByLogin.ok, true);
  assert.equal(adminByLogin.user?.role, 'admin');

  const adminByEmail = authenticateUser(INITIAL_USERS, 'admin@enigma.com', 'admin123');
  assert.equal(adminByEmail.ok, true);
  assert.equal(adminByEmail.user?.id, 'admin');

  const wrongPassword = authenticateUser(INITIAL_USERS, 'admin', 'errada');
  assert.equal(wrongPassword.ok, false);
  assert.equal(wrongPassword.reason, 'credenciais_invalidas');

  const opLogin = authenticateUser(INITIAL_USERS, 'operador.a@enigma.com', 'op123');
  assert.equal(opLogin.ok, true);
  assert.equal(opLogin.user?.role, 'operador');
});

test('registration workflow creates pending user, blocks login until approved, and allows login after admin liberation', () => {
  const regResult = createRegistrationRequest(INITIAL_USERS, {
    name: 'Rafael Costa',
    shortName: 'Operador D',
    login: 'rafael.op',
    email: 'rafael.op@enigma.com',
    password: 'op456',
    phone: '(11) 95555-4444',
    registrationNotes: 'Operador da tarde',
  });

  assert.equal(regResult.ok, true);
  assert.equal(regResult.targetUser?.status, 'pendente');
  assert.equal(regResult.targetUser?.role, 'operador');

  // Cannot log in while pending
  const blockedPending = authenticateUser(regResult.users, 'rafael.op', 'op456');
  assert.equal(blockedPending.ok, false);
  assert.equal(blockedPending.reason, 'cadastro_pendente');

  // Admin approves registration
  const approval = approveUserRegistrationPure(
    regResult.users,
    regResult.targetUser!.id,
    'Administrador Geral',
    { initialMonthlyBalance: 22000, profitSharePercent: 50 }
  );
  assert.equal(approval.ok, true);
  assert.equal(approval.targetUser?.status, 'ativo');
  assert.equal(approval.targetUser?.initialMonthlyBalance, 22000);

  // Now login succeeds
  const afterApproval = authenticateUser(approval.users, 'rafael.op', 'op456');
  assert.equal(afterApproval.ok, true);
  assert.equal(afterApproval.user?.status, 'ativo');
});

test('admin user CRUD supports create, update, block, and delete while protecting last active admin', () => {
  const created = createAdminUserPure(
    INITIAL_USERS,
    {
      name: 'Operador E (Bruno)',
      shortName: 'Operador E',
      login: 'bruno.op',
      email: 'bruno.op@enigma.com',
      password: 'op789',
      role: 'operador',
      status: 'ativo',
      profitSharePercent: 45,
      initialMonthlyBalance: 16000,
    },
    'Administrador Geral'
  );
  assert.equal(created.ok, true);
  assert.ok(created.targetUser);

  const updated = updateAdminUserPure(created.users, created.targetUser.id, {
    profitSharePercent: 55,
    status: 'bloqueado',
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.targetUser?.profitSharePercent, 55);
  assert.equal(updated.targetUser?.status, 'bloqueado');

  // Protecting last active admin from being blocked or deleted
  const blockAdminAttempt = updateAdminUserPure(updated.users, 'admin', {
    status: 'bloqueado',
  });
  assert.equal(blockAdminAttempt.ok, false);

  const deleteSelfAttempt = deleteAdminUserPure(updated.users, 'admin', 'admin');
  assert.equal(deleteSelfAttempt.ok, false);

  const deleteOpAttempt = deleteAdminUserPure(
    updated.users,
    created.targetUser.id,
    'admin'
  );
  assert.equal(deleteOpAttempt.ok, true);
});

test('updateUserCredentialsPure securely manages login and password with hash calculation and conflict checks', () => {
  const res = updateUserCredentialsPure(INITIAL_USERS, 'op_a', {
    login: 'operador.a.novo',
    email: 'operador.a.novo@enigma.com',
    newPassword: 'Nova@2026',
    mustChangePassword: true,
  });

  assert.equal(res.ok, true);
  assert.equal(res.targetUser?.login, 'operador.a.novo');
  assert.equal(res.targetUser?.password, 'Nova@2026');
  assert.equal(res.targetUser?.passwordHash, computePasswordHash('Nova@2026'));
  assert.equal(res.targetUser?.mustChangePassword, true);
  assert.equal(maskPassword('Nova@2026'), '•••••••••');

  // Rejects duplicate login
  const duplicateLogin = updateUserCredentialsPure(res.users, 'op_b', {
    login: 'admin',
  });
  assert.equal(duplicateLogin.ok, false);
});

test('getSettingsRoleCapabilities enforces admin-only exports and single request option for non-admins', () => {
  const admin = INITIAL_USERS.find((u) => u.id === 'admin')!;
  const operator = INITIAL_USERS.find((u) => u.id === 'op_a')!;
  const socio = INITIAL_USERS.find((u) => u.id === 'socio_nadson')!;

  const adminCaps = getSettingsRoleCapabilities(admin);
  assert.equal(adminCaps.canManageUsersCrud, true);
  assert.equal(adminCaps.canManageCatalog, true);
  assert.equal(adminCaps.canApproveRegistrations, true);
  assert.equal(adminCaps.canEditGlobalOperationalPeriod, true);
  assert.equal(adminCaps.canViewDatabaseMigrations, true);
  assert.equal(adminCaps.canExportGlobalData, true);
  assert.equal(adminCaps.canExportCsv, true);
  assert.equal(adminCaps.canRequestExportToAdmin, false);
  assert.equal(adminCaps.canResetSystemData, false);

  const opCaps = getSettingsRoleCapabilities(operator);
  assert.equal(opCaps.canManageUsersCrud, false);
  assert.equal(opCaps.canManageCatalog, false);
  assert.equal(opCaps.canApproveRegistrations, false);
  assert.equal(opCaps.canEditGlobalOperationalPeriod, false);
  assert.equal(opCaps.canViewDatabaseMigrations, false);
  assert.equal(opCaps.canExportGlobalData, false);
  assert.equal(opCaps.canExportCsv, false);
  assert.equal(opCaps.canRequestExportToAdmin, true);
  assert.equal(opCaps.canResetSystemData, false);
  assert.equal(opCaps.canManageOwnSecurity, true);

  const socioCaps = getSettingsRoleCapabilities(socio);
  assert.equal(socioCaps.canExportCsv, false);
  assert.equal(socioCaps.canExportGlobalData, false);
  assert.equal(socioCaps.canRequestExportToAdmin, true);
});

test('userRepository builds, serializes, and deserializes user persistence snapshots', () => {
  const snapshot = buildUserPersistenceSnapshot(INITIAL_USERS, '11/10/2026 12:00');
  assert.equal(snapshot.schemaVersion, 3);
  assert.equal(snapshot.totalRecords, INITIAL_USERS.length);
  assert.ok(snapshot.checksum.startsWith('chk:'));

  const json = serializeUsersPersistenceJson(INITIAL_USERS, '11/10/2026 12:00');
  const parsed = deserializeUsersPersistenceJson(json);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.users?.length, INITIAL_USERS.length);
  assert.ok(parsed.users?.[0].passwordHash?.startsWith('sha256:'));
});

test('database migration builder compiles SQL migrations and seeds into build artifact', () => {
  const summary = buildDatabaseMigrations();
  assert.ok(summary.migrationsApplied.length >= 3);
  assert.equal(summary.seedsApplied.length, 1);
  assert.ok(summary.tablesCreated.includes('users'));
  assert.ok(summary.tablesCreated.includes('partnerships'));
  assert.ok(summary.tablesCreated.includes('catalog_houses'));
  assert.ok(summary.tablesCreated.includes('catalog_banks'));
  assert.ok(summary.tablesCreated.includes('catalog_custom_criteria'));

  const sqlDump = generateLiveUsersSqlMigration(INITIAL_USERS, 10, 2026);
  assert.ok(sqlDump.includes("INSERT INTO users"));
  assert.ok(sqlDump.includes("INSERT INTO catalog_houses"));
  assert.ok(sqlDump.includes("INSERT INTO catalog_banks"));
  assert.ok(sqlDump.includes("'admin@enigma.com'"));
});
