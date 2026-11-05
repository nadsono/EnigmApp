import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useEnigma } from '../context/EnigmaContext.tsx';
import { formatCurrencyBRL, MONTH_NAMES_PT, parseCurrencyInput } from '../domain/ledger.ts';
import {
  computePasswordHash,
  evaluatePasswordStrength,
  generateSecurePassword,
  getSettingsRoleCapabilities,
  maskPassword,
} from '../domain/auth.ts';
import {
  triggerFileDownload,
  generateCustosCsv,
  generateEntradasCsv,
  generateParceriasCsv,
  generateSaquesCsv,
  type CsvExportOptions,
} from '../domain/exportCsv.ts';
import {
  ENIGMA_DATABASE_MIGRATIONS,
  generateLiveUsersSqlMigration,
} from '../database/migrations.ts';
import { serializeUsersPersistenceJson } from '../database/userRepository.ts';
import { PROJECT_DATABASE_BOOT_MODE } from '../database/systemMaintenance.ts';
import { CatalogManagerPanel } from '../components/CatalogManagerPanel.tsx';
import { AppearanceSettings } from '../components/AppearanceSettings.tsx';
import { CryptoNetworkManager } from '../components/CryptoNetworkManager.tsx';
import type { UserAccountStatus, UserProfile, UserRole } from '../domain/types.ts';

type AdminSettingsTab = 'usuarios' | 'catalogo' | 'sql_migrations';

export const ConfiguracoesScreen: React.FC = () => {
  const {
    users,
    pendingUsers,
    userPersistenceSnapshot,
    houseCatalog,
    bankCatalog,
    customCriteria,
    currentUser,
    logoutUser,
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
    partnerships,
    houseAccounts,
    allPartnerships,
    allHouseAccounts,
    allBankAccounts,
    allEntries,
    allWithdrawals,
    allCosts,
    operationalMonth,
    operationalYear,
    operationalMonthYearLabel,
    setOperationalMonth,
    setOperationalYear,
    setOperationalMonthYear,
    periodStart,
    periodEnd,
    resetPeriodToCurrentMonth,
    showTips,
    setShowTips,
    dismissedTips,
    restoreAllTips,
    systemVersion,
    systemVersionsList,
    switchSystemVersion,
    operatorPreferredExchange,
    setOperatorPreferredExchange,
    usdtBrlRate,
    setUsdtBrlRate,
    eurUsdtRate,
    setEurUsdtRate,
    currencyDisplayMode,
    setCurrencyDisplayMode,
    notify,
  } = useEnigma();

  const capabilities = useMemo(
    () => getSettingsRoleCapabilities(currentUser),
    [currentUser]
  );

  const quickMonthPresets = useMemo(() => {
    const now = new Date();
    return [0, 1, 2].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthName = MONTH_NAMES_PT[m - 1];
      const suffix = offset === 0 ? ' (Vigente)' : offset === 1 ? ' (Mês anterior)' : '';
      return {
        m,
        y,
        label: `${monthName} / ${y}${suffix}`,
      };
    });
  }, []);

  // =========================================================================
  // Aba Administrativa Ativa ('usuarios' por padrão)
  // =========================================================================
  const [activeAdminTab, setActiveAdminTab] = useState<AdminSettingsTab>('usuarios');

  // =========================================================================
  // Estados da Aba Administrativa de 'Usuários' (Lista, Aprovação e Credenciais)
  // =========================================================================
  const [userFilter, setUserFilter] = useState<'todos' | 'ativo' | 'pendente' | 'bloqueado'>('todos');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserForm, setShowUserForm] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [showFormPasswordPlain, setShowFormPasswordPlain] = useState(false);

  // Painel dedicado de Gerenciamento Seguro de Credenciais (Login / Senha)
  const [credentialTargetUserId, setCredentialTargetUserId] = useState<string | null>(null);
  const [credLogin, setCredLogin] = useState('');
  const [credEmail, setCredEmail] = useState('');
  const [credNewPassword, setCredNewPassword] = useState('');
  const [credShowPassword, setCredShowPassword] = useState(false);
  const [credMustChange, setCredMustChange] = useState(false);

  // Painel de Importação JSON de Persistência de Usuários
  const [showJsonImportBox, setShowJsonImportBox] = useState(false);
  const [jsonImportText, setJsonImportText] = useState('');

  // Campos do formulário interno de Criação/Edição de Usuário pelo Admin
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('op123');
  const [formRole, setFormRole] = useState<UserRole>('operador');
  const [formStatus, setFormStatus] = useState<UserAccountStatus>('ativo');
  const [formProfitShare, setFormProfitShare] = useState('50');
  const [formInitialBalance, setFormInitialBalance] = useState('20000');
  const [formPhone, setFormPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Custom overrides for pending user approval
  const [approvalBalances, setApprovalBalances] = useState<Record<string, string>>({});
  const [approvalShares, setApprovalShares] = useState<Record<string, string>>({});

  // =========================================================================
  // Estados de Meu Perfil / Alterar Senha (Operador / Usuário Logado)
  // =========================================================================
  const [ownName, setOwnName] = useState(currentUser.name);
  const [ownShortName, setOwnShortName] = useState(currentUser.shortName);
  const [ownPhone, setOwnPhone] = useState(currentUser.phone || '');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');

  useEffect(() => {
    setOwnName(currentUser.name);
    setOwnShortName(currentUser.shortName);
    setOwnPhone(currentUser.phone || '');
    setCurrentPasswordInput('');
    setNewPasswordInput('');
  }, [currentUser.id, currentUser.name, currentUser.shortName, currentUser.phone]);

  // =========================================================================
  // Estados de Edição Fluida de Cotação (USDT/BRL e EUR/USDT) + Sincronização Ao Vivo
  // =========================================================================
  const [usdtRateInput, setUsdtRateInput] = useState<string>(() =>
    usdtBrlRate.toFixed(2).replace('.', ',')
  );
  const [eurRateInput, setEurRateInput] = useState<string>(() =>
    eurUsdtRate.toFixed(2).replace('.', ',')
  );
  const [isSyncingLiveRate, setIsSyncingLiveRate] = useState<boolean>(false);

  useEffect(() => {
    setUsdtRateInput(usdtBrlRate.toFixed(2).replace('.', ','));
  }, [usdtBrlRate]);

  useEffect(() => {
    setEurRateInput(eurUsdtRate.toFixed(2).replace('.', ','));
  }, [eurUsdtRate]);

  const handleSyncLiveRates = async () => {
    setIsSyncingLiveRate(true);
    try {
      let nextUsdt: number | null = null;
      let nextEur: number | null = null;
      const [usdtRes, eurRes] = await Promise.allSettled([
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL'),
        fetch('https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT'),
      ]);
      if (usdtRes.status === 'fulfilled' && usdtRes.value.ok) {
        const data = await usdtRes.value.json();
        const p = Number(data?.price);
        if (Number.isFinite(p) && p > 3) nextUsdt = p;
      }
      if (eurRes.status === 'fulfilled' && eurRes.value.ok) {
        const data = await eurRes.value.json();
        const p = Number(data?.price);
        if (Number.isFinite(p) && p > 0.7) nextEur = p;
      }
      if (!nextUsdt) {
        const fbRes = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-USD');
        if (fbRes.ok) {
          const fb = await fbRes.json();
          const u = Number(fb?.USDBRL?.bid);
          const e = Number(fb?.EURUSD?.bid);
          if (Number.isFinite(u) && u > 3) nextUsdt = u;
          if (Number.isFinite(e) && e > 0.7) nextEur = e;
        }
      }
      if (nextUsdt) setUsdtBrlRate(nextUsdt);
      if (nextEur) setEurUsdtRate(nextEur);
      if (nextUsdt || nextEur) {
        notify(
          'success',
          `Cotação sincronizada ao vivo: 1 USDT = R$ ${(nextUsdt || usdtBrlRate)
            .toFixed(2)
            .replace('.', ',')} · 1 EUR = ${(nextEur || eurUsdtRate)
            .toFixed(2)
            .replace('.', ',')} USDT.`
        );
      } else {
        notify('warning', 'Não foi possível consultar a API externa agora; edite o valor manualmente.');
      }
    } catch {
      notify('warning', 'Sem conexão com a API de cotação; digite o valor desejado no campo.');
    } finally {
      setIsSyncingLiveRate(false);
    }
  };

  // =========================================================================
  // Estados de Exportação CSV (Exclusivo Admin) e Migrations
  // =========================================================================
  const [delimiter, setDelimiter] = useState<CsvExportOptions['delimiter']>(';');
  const [decimalSeparator, setDecimalSeparator] = useState<CsvExportOptions['decimalSeparator']>(',');
  const [scopeOperatorId, setScopeOperatorId] = useState<string>('all');
  const [selectedMigrationId, setSelectedMigrationId] = useState<string>(
    ENIGMA_DATABASE_MIGRATIONS[1].id
  );

  const resetInternalUserForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormShortName('');
    setFormLogin('');
    setFormEmail('');
    setFormPassword('op123');
    setShowFormPasswordPlain(false);
    setFormRole('operador');
    setFormStatus('ativo');
    setFormProfitShare('50');
    setFormInitialBalance('20000');
    setFormPhone('');
    setFormNotes('');
  };

  const openCreateUserModal = () => {
    setCredentialTargetUserId(null);
    resetInternalUserForm();
    setShowUserForm(true);
  };

  const openEditUserModal = (u: UserProfile) => {
    setEditingUserId(u.id);
    setCredentialTargetUserId(null);
    setFormName(u.name);
    setFormShortName(u.shortName);
    setFormLogin(u.login);
    setFormEmail(u.email);
    setFormPassword(u.password || '');
    setShowFormPasswordPlain(false);
    setFormRole(u.role);
    setFormStatus(u.status);
    setFormProfitShare(String(u.profitSharePercent));
    setFormInitialBalance(String(u.initialMonthlyBalance));
    setFormPhone(u.phone || '');
    setFormNotes(u.registrationNotes || '');
    setShowUserForm(true);
  };

  const openCredentialManager = (u: UserProfile) => {
    setCredentialTargetUserId(u.id);
    setCredLogin(u.login);
    setCredEmail(u.email);
    setCredNewPassword('');
    setCredShowPassword(false);
    setCredMustChange(Boolean(u.mustChangePassword));
  };

  const credentialTargetUser = useMemo(
    () => users.find((u) => u.id === credentialTargetUserId) || null,
    [users, credentialTargetUserId]
  );

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialTargetUser) return;
    const res = updateAdminUserCredentials(credentialTargetUser.id, {
      login: credLogin,
      email: credEmail,
      newPassword: credNewPassword.trim() ? credNewPassword.trim() : undefined,
      mustChangePassword: credMustChange,
    });
    if (res.ok) {
      setCredentialTargetUserId(null);
      setCredNewPassword('');
    }
  };

  const handleToggleRevealPassword = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSaveUserCrud = (e: React.FormEvent) => {
    e.preventDefault();
    const profitSharePercent = Math.max(0, Math.min(100, Number(formProfitShare) || 0));
    const initialMonthlyBalance = Math.max(0, Number(formInitialBalance) || 0);
    const derivedShortName = formShortName.trim() || formName.trim().split(/\s+/)[0] || 'Operador';
    const derivedEmail =
      formEmail.trim() ||
      (formLogin.trim().includes('@')
        ? formLogin.trim()
        : `${formLogin.trim().toLowerCase()}@enigma.com`);

    if (editingUserId) {
      const res = updateAdminUser(editingUserId, {
        name: formName,
        shortName: derivedShortName,
        login: formLogin,
        email: derivedEmail,
        password: formPassword,
        role: formRole,
        status: formStatus,
        profitSharePercent,
        initialMonthlyBalance,
        phone: formPhone,
        registrationNotes: formNotes,
      });
      if (res.ok) {
        resetInternalUserForm();
      }
    } else {
      const res = createAdminUser({
        name: formName,
        shortName: derivedShortName,
        login: formLogin,
        email: derivedEmail,
        password: formPassword,
        role: formRole,
        status: formStatus,
        profitSharePercent,
        initialMonthlyBalance,
        phone: formPhone,
        registrationNotes: formNotes,
      });
      if (res.ok) {
        resetInternalUserForm();
      }
    }
  };

  const handleApprovePending = (u: UserProfile) => {
    const customBal = approvalBalances[u.id];
    const customShare = approvalShares[u.id];
    approveUserRegistration(u.id, {
      initialMonthlyBalance:
        customBal !== undefined ? Number(customBal) || 0 : u.initialMonthlyBalance || 15000,
      profitSharePercent:
        customShare !== undefined ? Number(customShare) || 50 : u.profitSharePercent || 50,
    });
  };

  const handleUpdateOwnSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateOwnProfileSecurity({
      name: ownName,
      shortName: ownShortName,
      phone: ownPhone,
      currentPassword: currentPasswordInput,
      newPassword: newPasswordInput,
    });
    if (res.ok) {
      setCurrentPasswordInput('');
      setNewPasswordInput('');
    }
  };

  const filteredUsersList = useMemo(() => {
    const q = userSearchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (userFilter !== 'todos' && u.status !== userFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.shortName.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, userFilter, userSearchQuery]);

  const handleExportUsersPersistenceJson = () => {
    const jsonContent = serializeUsersPersistenceJson(
      users,
      userPersistenceSnapshot.updatedAt
    );
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigma_usuarios_persistence_v${userPersistenceSnapshot.schemaVersion}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(
      'success',
      `Snapshot de persistência de usuários exportado (${users.length} registros).`
    );
  };

  const handleConfirmJsonImport = () => {
    if (!jsonImportText.trim()) {
      notify('error', 'Cole o conteúdo JSON de persistência de usuários para importar.');
      return;
    }
    const res = importUsersFromJsonSnapshot(jsonImportText);
    if (res.ok) {
      setShowJsonImportBox(false);
      setJsonImportText('');
    }
  };

  // =========================================================================
  // Dados de Exportação CSV (Exclusivo para Administrador)
  // =========================================================================
  const exportableEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (scopeOperatorId !== 'all' && e.operatorId !== scopeOperatorId) {
        return false;
      }
      return true;
    });
  }, [allEntries, scopeOperatorId]);

  const exportableWithdrawals = useMemo(() => {
    return allWithdrawals.filter((w) => {
      if (scopeOperatorId !== 'all' && w.operatorId !== scopeOperatorId) {
        return false;
      }
      return true;
    });
  }, [allWithdrawals, scopeOperatorId]);

  const exportablePartnerships = useMemo(() => {
    return allPartnerships.filter((p) => {
      if (scopeOperatorId !== 'all' && p.operatorId !== scopeOperatorId) {
        return false;
      }
      return true;
    });
  }, [allPartnerships, scopeOperatorId]);

  const exportableCosts = useMemo(() => {
    return allCosts.filter((c) => {
      if (scopeOperatorId !== 'all' && c.operatorId !== scopeOperatorId) {
        return false;
      }
      return true;
    });
  }, [allCosts, scopeOperatorId]);

  const csvOptions = {
    delimiter,
    decimalSeparator,
    includeBom: true,
  };

  const fileSuffix = useMemo(() => {
    const opTag = scopeOperatorId === 'all' ? 'geral' : scopeOperatorId;
    return `${opTag}_${operationalYear}-${String(operationalMonth).padStart(2, '0')}`;
  }, [scopeOperatorId, operationalMonth, operationalYear]);

  const handleExportEntradas = () => {
    if (!capabilities.canExportCsv) return;
    const content = generateEntradasCsv(
      exportableEntries,
      allHouseAccounts,
      allPartnerships,
      csvOptions
    );
    triggerFileDownload(`enigma_entradas_${fileSuffix}.csv`, content);
    notify(
      'success',
      `Arquivo CSV de Entradas exportado (${exportableEntries.length} registros).`
    );
  };

  const handleExportSaques = () => {
    if (!capabilities.canExportCsv) return;
    const content = generateSaquesCsv(
      exportableWithdrawals,
      allHouseAccounts,
      allBankAccounts,
      allPartnerships,
      csvOptions
    );
    triggerFileDownload(`enigma_saques_${fileSuffix}.csv`, content);
    notify(
      'success',
      `Arquivo CSV de Saques exportado (${exportableWithdrawals.length} registros).`
    );
  };

  const handleExportParcerias = () => {
    if (!capabilities.canExportCsv) return;
    const content = generateParceriasCsv(
      exportablePartnerships,
      allHouseAccounts,
      allBankAccounts,
      csvOptions
    );
    triggerFileDownload(`enigma_parcerias_${fileSuffix}.csv`, content);
    notify(
      'success',
      `Arquivo CSV de Parcerias exportado (${exportablePartnerships.length} registros).`
    );
  };

  const handleExportCustos = () => {
    if (!capabilities.canExportCsv) return;
    const content = generateCustosCsv(
      exportableCosts,
      allPartnerships,
      csvOptions
    );
    triggerFileDownload(`enigma_custos_${fileSuffix}.csv`, content);
    notify(
      'success',
      `Arquivo CSV de Custos exportado (${exportableCosts.length} registros).`
    );
  };

  const handleExportAll = () => {
    if (!capabilities.canExportCsv) return;
    handleExportEntradas();
    handleExportSaques();
    handleExportParcerias();
    handleExportCustos();
    notify('success', 'Pacote completo (4 arquivos CSV) gerado com sucesso.');
  };

  const handleDownloadSqlBundle = () => {
    if (!capabilities.canViewDatabaseMigrations) return;
    const sqlContent = generateLiveUsersSqlMigration(
      users,
      operationalMonth,
      operationalYear,
      {
        houses: houseCatalog,
        banks: bankCatalog,
        customCriteria,
      }
    );
    const blob = new Blob([sqlContent], { type: 'application/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enigma_full_database_${operationalYear}_${String(operationalMonth).padStart(2, '0')}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(
      'success',
      'Bundle SQL completo de Banco de Dados, Usuários e Catálogo (Casas/Bancos/Critérios) exportado.'
    );
  };

  const selectedMigration =
    ENIGMA_DATABASE_MIGRATIONS.find((m) => m.id === selectedMigrationId) ||
    ENIGMA_DATABASE_MIGRATIONS[0];

  const handleDownloadSingleMigration = () => {
    const blob = new Blob([selectedMigration.sqlPreview], {
      type: 'application/sql;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedMigration.filename.split('/').pop() || 'migration.sql';
    a.download = baseName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('success', `Migration ${baseName} exportada com sucesso.`);
  };

  const myPendingExportRequest = useMemo(
    () =>
      exportRequests.find(
        (r) =>
          r.userId === currentUser.id &&
          r.periodLabel === operationalMonthYearLabel &&
          r.status === 'pendente'
      ) || null,
    [exportRequests, currentUser.id, operationalMonthYearLabel]
  );

  const pendingExportRequests = useMemo(
    () => exportRequests.filter((r) => r.status === 'pendente'),
    [exportRequests]
  );

  const credStrength = evaluatePasswordStrength(credNewPassword || 'op123');

  return (
    <div className="flex flex-col gap-[22px]">
      {/* Cabeçalho com Identificação Clara da Visão (Administrador vs Operador/Usuário) */}
      <header className="flex flex-wrap justify-between items-start gap-[16px]">
        <div>
          <div className="flex items-center gap-[8px] mb-[6px]">
            <span
              className={`inline-block px-[10px] py-[4px] rounded-full text-[12px] font-semibold ${
                capabilities.isOperator
                  ? 'bg-[#FBF0DD] text-[#9A6518]'
                  : 'bg-[#DCECE7] text-[#0F6B5C]'
              }`}
            >
              {capabilities.isOperator
                ? 'Configurações do Operador (Usuário Final)'
                : capabilities.isAdmin
                ? 'Administração do Sistema · Aba de Usuários, Credenciais & Exportações'
                : 'Configurações da Conta (Sócio)'}
            </span>
            <span className="text-[12px] text-[#5E6B65] font-mono">
              Sessão: {currentUser.login}
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1B2421]">
            {capabilities.isOperator
              ? 'Minha Conta e Preferências'
              : 'Configurações e Controle de Acesso'}
          </h1>
          <p className="text-[#5E6B65] text-[14px] mt-[4px] max-w-[760px]">
            {capabilities.isOperator
              ? 'Gerencie seus dados de operador, senha de acesso, preferências de interface e período operacional vigente.'
              : 'Gerencie a aba administrativa de Usuários (aprovação de cadastros, credenciais login/senha e persistência), o período operacional vigente e as exportações exclusivas do Administrador.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-[10px] items-center">
          <button
            type="button"
            onClick={logoutUser}
            className="px-[14px] py-[10px] rounded-[10px] border border-[#D4DDD8] bg-[#FFFFFF] text-[#1B2421] text-[13px] font-medium hover:bg-[#EEF2EF] transition-colors cursor-pointer"
          >
            Sair / Trocar Usuário (Login)
          </button>

          {capabilities.canExportCsv && (
            <button
              type="button"
              onClick={handleExportAll}
              className="px-[16px] py-[10px] rounded-[10px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B5448] transition-colors cursor-pointer"
            >
              Baixar Pacote Completo (4 CSVs)
            </button>
          )}
        </div>
      </header>

      <AppearanceSettings />
      <CryptoNetworkManager />

      {/* =====================================================================
          CENTRAL DE VERSIONAMENTO & MODOS DE OPERAÇÃO (v2.0 Cripto / v1.5 Híbrido / v1.0 Bancos)
         ===================================================================== */}
      <section
        aria-label="Preferências da operação"
        className="bg-[#FFFFFF] border-2 border-[#0F6B5C] rounded-[14px] p-[20px] shadow-xs flex flex-col gap-[16px]"
      >
        <details className="rounded-[8px] border border-[#D4DDD8] p-[12px]">
          <summary className="cursor-pointer text-[13px] font-semibold text-[#44504B]">Perfis de demonstração (avançado)</summary>
        <div className="flex flex-wrap justify-between items-start gap-[12px]">
          <div>
            <div className="flex flex-wrap items-center gap-[8px]">
              <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#0F6B5C] text-white uppercase tracking-wider">
                Controle de Versão & Retorno Seguro
              </span>
              <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#E3F1EE] text-[#0B4F44]">
                Corretora Ativa do Operador: {operatorPreferredExchange} · 1 USDT = R$ {usdtBrlRate.toFixed(2).replace('.', ',')} · 1 EUR (€) = {eurUsdtRate.toFixed(2).replace('.', ',')} USDT
              </span>
            </div>
            <h2 className="text-[18px] font-bold text-[#1B2421] mt-[6px]">
              Dados de exemplo por perfil
            </h2>
            <p className="text-[13px] text-[#5E6B65] mt-[2px]">
              Alterne a qualquer momento entre a nova versão <b>v2.0 (Offshore Cripto com OKX/Binance + Saldo EUR/USDT)</b>, o modo <b>v1.5 (Híbrido Bancos PIX + Cripto)</b> ou retorne ao estado <b>v1.0 (Clássico Bancos & PIX em R$)</b>. Antes de cada troca, um backup automático do estado atual é salvo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
          {systemVersionsList.map((ver) => {
            const isCurrent = ver.id === systemVersion;
            return (
              <div
                key={ver.id}
                className={`p-[16px] rounded-[12px] border flex flex-col justify-between gap-[12px] transition-all ${
                  isCurrent
                    ? 'border-2 border-[#0F6B5C] bg-[#F4FAF8]'
                    : 'border-[#DCE3DF] bg-[#FAFBFA]'
                }`}
              >
                <div className="flex flex-col gap-[6px]">
                  <div className="flex items-center justify-between gap-[8px]">
                    <span
                      className={`px-[8px] py-[2px] rounded-full text-[11px] font-bold ${
                        isCurrent
                          ? 'bg-[#0F6B5C] text-white'
                          : 'bg-[#E2E8E4] text-[#3A4A43]'
                      }`}
                    >
                      {ver.tag}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] font-semibold text-[#0F6B5C]">
                        ● Em execução
                      </span>
                    )}
                  </div>
                  <div className="text-[14px] font-bold text-[#1B2421]">{ver.title}</div>
                  <p className="text-[12px] text-[#5E6B65] leading-[1.45]">{ver.description}</p>
                  <ul className="mt-[4px] flex flex-col gap-[3px] text-[11px] text-[#3A4A43]">
                    {ver.highlights.map((hl, i) => (
                      <li key={i}>• {hl}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => switchSystemVersion(ver.id)}
                  className={`w-full py-[8px] px-[12px] rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-[#CFE6DF] text-[#0B4F44] cursor-default'
                      : 'bg-[#0F6B5C] text-white hover:bg-[#0B5448]'
                  }`}
                >
                  {isCurrent ? 'Versão Ativa no Momento' : `Carregar ${ver.tag}`}
                </button>
              </div>
            );
          })}
        </div>

        </details>

        {/* Controles de Corretora Preferencial, Cotações (USDT/BRL e EUR/USDT) e Exibição de Moeda */}
        <div className="pt-[14px] border-t border-[#E2E8E4] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] items-end">
          <div className="flex flex-col gap-[4px]">
            <label
              htmlFor="settings-operator-exchange"
              className="text-[12px] font-medium text-[#5E6B65]"
            >
              Minha Corretora Preferencial
            </label>
            <input
              id="settings-operator-exchange"
              aria-label="Corretora preferencial do operador"
              list="settings-exchange-options"
              key={operatorPreferredExchange}
              defaultValue={operatorPreferredExchange}
              onBlur={(event) => { const name = event.target.value.trim(); if (name) setOperatorPreferredExchange(name); }}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
              className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421] font-semibold"
            />
            <datalist id="settings-exchange-options">
              {[...new Set(['OKX', 'Binance', 'Bybit', ...bankCatalog.filter((item) => item.active).map((item) => item.name)])].map((name) => <option key={name} value={name} />)}
            </datalist>
          </div>

          <div className="flex flex-col gap-[4px]">
            <div className="flex items-center justify-between gap-[6px]">
              <label
                htmlFor="settings-usdt-brl-rate"
                className="text-[12px] font-medium text-[#475569]"
              >
                Cotação 1 USDT = R$ (BRL)
              </label>
              <button
                type="button"
                onClick={handleSyncLiveRates}
                disabled={isSyncingLiveRate}
                title="Buscar cotação atualizada em tempo real (Binance / Mercado)"
                className="text-[11px] font-semibold text-[#0F6B5C] hover:underline inline-flex items-center gap-[4px] cursor-pointer"
              >
                <RefreshCw
                  className={`w-[11px] h-[11px] ${isSyncingLiveRate ? 'animate-spin' : ''}`}
                  strokeWidth={2}
                />
                <span>{isSyncingLiveRate ? 'Buscando...' : 'Ao vivo'}</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-[10px] text-[12px] font-semibold text-[#64748B] pointer-events-none">
                R$
              </span>
              <input
                id="settings-usdt-brl-rate"
                type="text"
                inputMode="decimal"
                aria-label="Cotação USDT em BRL"
                value={usdtRateInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setUsdtRateInput(raw);
                  const parsed = parseCurrencyInput(raw);
                  if (parsed !== null && parsed >= 1 && parsed <= 20) {
                    setUsdtBrlRate(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseCurrencyInput(usdtRateInput);
                  if (parsed !== null && parsed >= 1 && parsed <= 20) {
                    setUsdtBrlRate(parsed);
                    setUsdtRateInput(parsed.toFixed(2).replace('.', ','));
                  } else {
                    setUsdtRateInput(usdtBrlRate.toFixed(2).replace('.', ','));
                  }
                }}
                placeholder="5,48"
                className="w-full pl-[30px] pr-[10px] py-[8px] rounded-[8px] border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label
              htmlFor="settings-eur-usdt-rate"
              className="text-[12px] font-medium text-[#475569]"
              title="Usado em casas onde o depósito é via USDT mas o saldo interno é em Euro (ex.: Pinnacle/SBOBET)"
            >
              Cotação 1 EUR (€) = USDT
            </label>
            <div className="relative flex items-center">
              <input
                id="settings-eur-usdt-rate"
                type="text"
                inputMode="decimal"
                aria-label="Cotação EUR em USDT"
                value={eurRateInput}
                onChange={(e) => {
                  const raw = e.target.value;
                  setEurRateInput(raw);
                  const parsed = parseCurrencyInput(raw);
                  if (parsed !== null && parsed >= 0.5 && parsed <= 5) {
                    setEurUsdtRate(parsed);
                  }
                }}
                onBlur={() => {
                  const parsed = parseCurrencyInput(eurRateInput);
                  if (parsed !== null && parsed >= 0.5 && parsed <= 5) {
                    setEurUsdtRate(parsed);
                    setEurRateInput(parsed.toFixed(2).replace('.', ','));
                  } else {
                    setEurRateInput(eurUsdtRate.toFixed(2).replace('.', ','));
                  }
                }}
                placeholder="1,08"
                className="w-full px-[10px] py-[8px] rounded-[8px] border border-[#CBD5E1] bg-white text-[13px] text-[#0F172A] font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[4px]">
            <label
              htmlFor="settings-currency-display-mode"
              className="text-[12px] font-medium text-[#5E6B65]"
            >
              Modo de Exibição de Moeda
            </label>
            <select
              id="settings-currency-display-mode"
              aria-label="Modo de exibição de moeda"
              value={currencyDisplayMode}
              onChange={(e) =>
                setCurrencyDisplayMode(
                  e.target.value as 'usdt_brl_mirror' | 'usdt_only' | 'brl_only'
                )
              }
              className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421] font-medium cursor-pointer"
            >
              <option value="usdt_brl_mirror">Moeda: USDT + Espelho R$</option>
              <option value="usdt_only">Moeda: Apenas USDT ($)</option>
              <option value="brl_only">Moeda: Apenas R$ (BRL)</option>
            </select>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SEÇÃO PRINCIPAL: PERÍODO OPERACIONAL GLOBAL & PREFERÊNCIAS DE INTERFACE
         ===================================================================== */}
      <section
        aria-label="Período Operacional"
        className="grid grid-cols-1 lg:grid-cols-12 gap-[16px]"
      >
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[20px] shadow-xs flex flex-col gap-[14px]">
          <div className="flex flex-wrap justify-between items-start gap-[10px]">
            <div>
              <h2 className="text-[17px] font-bold text-[#1B2421]">
                Período Operacional
              </h2>
              <p className="text-[13px] text-[#5E6B65] mt-[2px]">
                Selecione o mês e o ano vigentes. Todas as telas (Visão geral, Entradas, Saques, Conferência, Saldos, Equipe e Custos) consultam este período automaticamente, mantendo a interface limpa sem filtros repetitivos.
              </p>
            </div>
            <span className="px-[10px] py-[4px] rounded-full text-[12px] font-semibold bg-[#E3F1EE] text-[#0F6B5C]">
              Período vigente: {operationalMonthYearLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] items-end">
            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="settings-operational-month"
                className="text-[12px] font-medium text-[#5E6B65]"
              >
                Mês operacional
              </label>
              <select
                id="settings-operational-month"
                aria-label="Mês operacional"
                value={operationalMonth}
                onChange={(e) => setOperationalMonth(Number(e.target.value))}
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421] font-medium cursor-pointer"
              >
                {MONTH_NAMES_PT.map((monthName, idx) => {
                  const monthNumber = idx + 1;
                  return (
                    <option key={monthNumber} value={monthNumber}>
                      {String(monthNumber).padStart(2, '0')} - {monthName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex flex-col gap-[4px]">
              <label
                htmlFor="settings-operational-year"
                className="text-[12px] font-medium text-[#5E6B65]"
              >
                Ano operacional
              </label>
              <select
                id="settings-operational-year"
                aria-label="Ano operacional"
                value={operationalYear}
                onChange={(e) => setOperationalYear(Number(e.target.value))}
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421] font-medium cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetPeriodToCurrentMonth}
              className="py-[8px] px-[12px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-medium hover:bg-[#0B5448] transition-colors cursor-pointer"
            >
              Mês Atual (Padrão)
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-[8px] pt-[6px] border-t border-[#EDF1EE]">
            <div className="flex flex-wrap gap-[6px]">
              {quickMonthPresets.map(({ m, y, label }) => {
                const isSelected = operationalMonth === m && operationalYear === y;
                return (
                  <button
                    key={`${m}-${y}`}
                    type="button"
                    onClick={() => setOperationalMonthYear(m, y)}
                    className={`px-[10px] py-[5px] rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0F6B5C] text-white'
                        : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-[#5E6B65] tabular-nums">
              Intervalo: <strong>{periodStart}</strong> a <strong>{periodEnd}</strong> ·{' '}
              {allEntries.length} entrada(s), {allWithdrawals.length} saque(s),{' '}
              {allCosts.length} custo(s)
            </div>
          </div>
        </div>

        {/* Preferências de Interface / Dicas e Orientações */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[20px] shadow-xs flex flex-col justify-between gap-[14px]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1B2421]">
              Dicas e Orientações na Interface
            </h2>
            <p className="text-[13px] text-[#5E6B65] mt-[2px]">
              Você pode fechar avisos explicativos individualmente nas telas ou ocultar todos os blocos de orientação de uma só vez.
            </p>
          </div>

          <div className="flex flex-col gap-[10px]">
            <label className="flex items-center justify-between p-[12px] rounded-[10px] bg-[#F7F9F8] border border-[#E5EBE7] cursor-pointer">
              <div>
                <div className="text-[13px] font-semibold text-[#1B2421]">
                  Exibir dicas operacionais nas abas
                </div>
                <div className="text-[12px] text-[#5E6B65]">
                  {showTips
                    ? `Ativado (${dismissedTips.length} dica(s) fechada(s))`
                    : 'Todas as dicas foram ocultadas'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={showTips}
                onChange={(e) => setShowTips(e.target.checked)}
                className="w-[18px] h-[18px] accent-[#0F6B5C] cursor-pointer"
              />
            </label>

            {(!showTips || dismissedTips.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  restoreAllTips();
                  notify('success', 'Todas as dicas da plataforma foram restauradas.');
                }}
                className="py-[8px] px-[12px] rounded-[8px] border border-[#C9D2CD] text-[#3A4A43] text-[12px] font-medium hover:bg-[#F0F3F1] transition-colors cursor-pointer self-start"
              >
                Reexibir todas as dicas fechadas
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================================
          VISÃO EXCLUSIVA DO ADMINISTRADOR: ABA ADMINISTRATIVA DE 'USUÁRIOS'
          (Lista de Usuários, Aprovação de Cadastros, Credenciais Seguras e Persistência)
         ===================================================================== */}
      {capabilities.canManageUsersCrud && (
        <section
          aria-label="Painel Administrativo de Usuários"
          className="bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[22px] shadow-xs flex flex-col gap-[18px]"
        >
          {/* Barra de Abas Administrativas */}
          <div className="flex flex-wrap items-center justify-between gap-[12px] border-b border-[#E5EBE7] pb-[14px]">
            <div
              role="tablist"
              aria-label="Abas administrativas de configurações"
              className="flex flex-wrap items-center gap-[8px]"
            >
              <button
                id="admin-tab-usuarios"
                role="tab"
                type="button"
                aria-selected={activeAdminTab === 'usuarios'}
                onClick={() => setActiveAdminTab('usuarios')}
                className={`px-[16px] py-[9px] rounded-[10px] text-[13px] font-semibold flex items-center gap-[8px] transition-colors cursor-pointer ${
                  activeAdminTab === 'usuarios'
                    ? 'bg-[#0F6B5C] text-white shadow-xs'
                    : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
                }`}
              >
                <span>Usuários</span>
                <span
                  className={`px-[7px] py-[1px] rounded-full text-[11px] font-bold tabular-nums ${
                    activeAdminTab === 'usuarios'
                      ? 'bg-[#09473D] text-white'
                      : 'bg-[#DCE3DF] text-[#1B2421]'
                  }`}
                >
                  {users.length}
                </span>
                {pendingUsers.length > 0 && (
                  <span className="px-[7px] py-[1px] rounded-full text-[11px] font-bold bg-[#E8A33D] text-[#2A1D05]">
                    {pendingUsers.length} pendente(s)
                  </span>
                )}
              </button>

              <button
                id="admin-tab-catalogo"
                role="tab"
                type="button"
                aria-selected={activeAdminTab === 'catalogo'}
                onClick={() => setActiveAdminTab('catalogo')}
                className={`px-[16px] py-[9px] rounded-[10px] text-[13px] font-semibold flex items-center gap-[8px] transition-colors cursor-pointer ${
                  activeAdminTab === 'catalogo'
                    ? 'bg-[#0F6B5C] text-white shadow-xs'
                    : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
                }`}
              >
                <span>Casas, Bancos & Critérios</span>
                <span
                  className={`px-[7px] py-[1px] rounded-full text-[11px] font-bold tabular-nums ${
                    activeAdminTab === 'catalogo'
                      ? 'bg-[#09473D] text-white'
                      : 'bg-[#DCE3DF] text-[#1B2421]'
                  }`}
                >
                  {houseCatalog.filter((h) => h.active).length}C ·{' '}
                  {bankCatalog.filter((b) => b.active).length}B
                </span>
              </button>

              <button
                id="admin-tab-sql"
                role="tab"
                type="button"
                aria-selected={activeAdminTab === 'sql_migrations'}
                onClick={() => setActiveAdminTab('sql_migrations')}
                className={`px-[16px] py-[9px] rounded-[10px] text-[13px] font-semibold flex items-center gap-[8px] transition-colors cursor-pointer ${
                  activeAdminTab === 'sql_migrations'
                    ? 'bg-[#0F6B5C] text-white shadow-xs'
                    : 'bg-[#F0F3F1] text-[#3A4A43] hover:bg-[#E2E8E4]'
                }`}
              >
                <span>Supabase & Migrations SQL</span>
                <span
                  className={`px-[7px] py-[1px] rounded-full text-[11px] font-bold tabular-nums ${
                    activeAdminTab === 'sql_migrations'
                      ? 'bg-[#09473D] text-white'
                      : 'bg-[#DCE3DF] text-[#0F6B5C]'
                  }`}
                >
                  19 Tabelas
                </span>
              </button>
            </div>

            {activeAdminTab === 'usuarios' && (
              <div className="flex flex-wrap items-center gap-[8px]">
                <button
                  type="button"
                  onClick={openCreateUserModal}
                  className="px-[14px] py-[9px] rounded-[10px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B5448] transition-colors cursor-pointer"
                >
                  + Novo Usuário
                </button>
              </div>
            )}
          </div>

          {activeAdminTab === 'usuarios' ? (
            <div
              role="tabpanel"
              aria-labelledby="admin-tab-usuarios"
              className="flex flex-col gap-[18px]"
            >
              {/* Cabeçalho da Aba de Usuários */}
              <div className="flex flex-wrap justify-between items-start gap-[12px]">
                <div>
                  <div className="flex items-center gap-[8px]">
                    <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#DCECE7] text-[#0F6B5C] uppercase tracking-wider">
                      Aba Administrativa · Usuários
                    </span>
                    <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#EEF3F0] text-[#3A4A43]">
                      Credenciais Protegidas por Hash SHA-256
                    </span>
                  </div>
                  <h2 className="text-[19px] font-bold text-[#1B2421] mt-[6px]">
                    Lista de Usuários, Aprovação de Cadastros e Gestão Segura de Credenciais
                  </h2>
                  <p className="text-[13px] text-[#5E6B65] mt-[2px]">
                    Visualize todos os usuários da operação, aprove solicitações de cadastro pendentes e gerencie credenciais (login/senha) com mascaramento e hash de integridade.
                  </p>
                </div>
              </div>

              {/* 1. Fila de Cadastros Pendentes de Liberação */}
              {pendingUsers.length > 0 && (
                <div className="p-[16px] rounded-[12px] bg-[#FDF8ED] border border-[#E8C987] flex flex-col gap-[12px]">
                  <div className="flex flex-wrap items-center justify-between gap-[8px]">
                    <div className="text-[14px] font-bold text-[#7C4D0B]">
                      Solicitações de Cadastro Aguardando Aprovação ({pendingUsers.length})
                    </div>
                    <span className="text-[12px] text-[#9A6518]">
                      Enquanto pendentes, estes usuários ficam bloqueados no login até a aprovação do Administrador
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-[10px]">
                    {pendingUsers.map((pending) => (
                      <div
                        key={pending.id}
                        className="p-[14px] rounded-[10px] bg-[#FFFFFF] border border-[#E6D4AA] flex flex-wrap items-center justify-between gap-[14px]"
                      >
                        <div className="flex flex-col gap-[3px] min-w-[240px] flex-1">
                          <div className="flex items-center gap-[8px]">
                            <span className="text-[15px] font-bold text-[#1B2421]">
                              {pending.name}
                            </span>
                            <span className="px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#FBF0DD] text-[#9A6518]">
                              Pendente de Liberação
                            </span>
                          </div>
                          <div className="text-[12px] text-[#5E6B65] font-mono">
                            Login: <strong>{pending.login}</strong> · E-mail: {pending.email}{' '}
                            {pending.phone ? `· Tel: ${pending.phone}` : ''}
                          </div>
                          <div className="text-[12px] text-[#6B7872]">
                            Solicitado em {pending.createdAt || '11/10/2026'} —{' '}
                            {pending.registrationNotes || 'Novo operador'}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-[10px]">
                          <div className="flex flex-col gap-[3px]">
                            <label
                              htmlFor={`approve-bal-${pending.id}`}
                              className="text-[11px] font-semibold text-[#5E6B65]"
                            >
                              Capital Inicial (USDT)
                            </label>
                            <input
                              id={`approve-bal-${pending.id}`}
                              type="number"
                              value={
                                approvalBalances[pending.id] ??
                                String(pending.initialMonthlyBalance || 15000)
                              }
                              onChange={(e) =>
                                setApprovalBalances((prev) => ({
                                  ...prev,
                                  [pending.id]: e.target.value,
                                }))
                              }
                              className="w-[120px] px-[10px] py-[6px] rounded-[8px] border border-[#C9D2CD] text-[12px]"
                            />
                          </div>

                          <div className="flex flex-col gap-[3px]">
                            <label
                              htmlFor={`approve-share-${pending.id}`}
                              className="text-[11px] font-semibold text-[#5E6B65]"
                            >
                              Comissão (%)
                            </label>
                            <input
                              id={`approve-share-${pending.id}`}
                              type="number"
                              value={
                                approvalShares[pending.id] ??
                                String(pending.profitSharePercent || 50)
                              }
                              onChange={(e) =>
                                setApprovalShares((prev) => ({
                                  ...prev,
                                  [pending.id]: e.target.value,
                                }))
                              }
                              className="w-[80px] px-[10px] py-[6px] rounded-[8px] border border-[#C9D2CD] text-[12px]"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApprovePending(pending)}
                            className="px-[14px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] transition-colors cursor-pointer"
                          >
                            Aprovar
                          </button>

                          <button
                            type="button"
                            onClick={() => rejectUserRegistration(pending.id)}
                            className="px-[12px] py-[8px] rounded-[8px] border border-[#E5B8B2] bg-[#FBE9E7] text-[#8C1D18] text-[12px] font-semibold hover:bg-[#F5D5D1] transition-colors cursor-pointer"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Painel de Gerenciamento Seguro de Credenciais (Login / Senha) */}
              {credentialTargetUser && (
                <form
                  onSubmit={handleSaveCredentials}
                  aria-label="Gerenciar Credenciais de Acesso"
                  className="p-[18px] rounded-[12px] bg-[#F3F8F6] border-2 border-[#0F6B5C] flex flex-col gap-[14px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-[10px]">
                    <div>
                      <div className="flex items-center gap-[8px]">
                        <span className="px-[8px] py-[2px] rounded-full text-[11px] font-semibold bg-[#0F6B5C] text-white">
                          Gerenciamento Seguro de Credenciais
                        </span>
                        <span className="text-[12px] font-mono text-[#4F5E57]">
                          ID: {credentialTargetUser.id}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-[#1B2421] mt-[4px]">
                        Credenciais de {credentialTargetUser.name} ({credentialTargetUser.shortName})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCredentialTargetUserId(null)}
                      className="text-[12px] font-semibold text-[#5E6B65] hover:text-[#1B2421] cursor-pointer"
                    >
                      × Fechar gerenciador
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px]">
                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="cred-login-input" className="text-[12px] font-semibold text-[#4F5E57]">
                        Login de acesso *
                      </label>
                      <input
                        id="cred-login-input"
                        type="text"
                        value={credLogin}
                        onChange={(e) => setCredLogin(e.target.value)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px] font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="cred-email-input" className="text-[12px] font-semibold text-[#4F5E57]">
                        E-mail de autenticação *
                      </label>
                      <input
                        id="cred-email-input"
                        type="email"
                        value={credEmail}
                        onChange={(e) => setCredEmail(e.target.value)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px] font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center justify-between">
                        <label htmlFor="cred-password-input" className="text-[12px] font-semibold text-[#4F5E57]">
                          Nova senha (deixe em branco para manter)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = generateSecurePassword();
                            setCredNewPassword(generated);
                            setCredShowPassword(true);
                          }}
                          className="text-[11px] font-semibold text-[#0F6B5C] hover:underline cursor-pointer"
                        >
                          Gerar senha segura
                        </button>
                      </div>
                      <div className="flex gap-[6px]">
                        <input
                          id="cred-password-input"
                          type={credShowPassword ? 'text' : 'password'}
                          value={credNewPassword}
                          onChange={(e) => setCredNewPassword(e.target.value)}
                          placeholder="Digite nova senha..."
                          className="flex-1 px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px] font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setCredShowPassword((v) => !v)}
                          className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[12px] font-medium text-[#4F5E57] cursor-pointer"
                        >
                          {credShowPassword ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-[12px] pt-[6px] border-t border-[#D5E4DF]">
                    <div className="flex flex-wrap items-center gap-[14px] text-[12px]">
                      <label className="flex items-center gap-[6px] text-[#1B2421] font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={credMustChange}
                          onChange={(e) => setCredMustChange(e.target.checked)}
                          className="accent-[#0F6B5C]"
                        />
                        Exigir redefinição de senha no próximo login
                      </label>

                      <span className="text-[#5E6B65]">
                        Força da senha:{' '}
                        <strong
                          className={
                            credStrength.score === 3
                              ? 'text-[#0D6547]'
                              : credStrength.score === 2
                              ? 'text-[#9A6518]'
                              : 'text-[#8C1D18]'
                          }
                        >
                          {credStrength.label}
                        </strong>
                      </span>

                      <span className="font-mono text-[11px] text-[#5E6B65]">
                        Hash resultante:{' '}
                        {computePasswordHash(
                          credNewPassword.trim() || credentialTargetUser.password || ''
                        )}
                      </span>
                    </div>

                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={() => setCredentialTargetUserId(null)}
                        className="px-[12px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[#4F5E57] text-[12px] font-medium cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-[14px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold hover:bg-[#0B5448] cursor-pointer"
                      >
                        Salvar Credenciais com Segurança
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 3. Formulário para o Admin Criar Novos Acessos Internamente / Editar Usuário */}
              {showUserForm && (
                <form
                  onSubmit={handleSaveUserCrud}
                  aria-label="Formulário interno de criação e edição de acesso"
                  data-testid="admin-user-form"
                  className="p-[18px] rounded-[12px] bg-[#F7F9F8] border border-[#C9D7D1] flex flex-col gap-[14px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-[8px]">
                    <div>
                      <span className="inline-block px-[8px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#DCECE7] text-[#0F6B5C]">
                        {editingUserId ? 'Modo de Edição de Usuário' : 'Cadastro Interno pelo Administrador'}
                      </span>
                      <h3 className="text-[15px] font-bold text-[#1B2421] mt-[3px]">
                        {editingUserId
                          ? `Editar Acesso de Usuário (${formLogin || editingUserId})`
                          : 'Criar Novo Acesso Internamente'}
                      </h3>
                    </div>
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={resetInternalUserForm}
                        className="text-[12px] font-semibold text-[#0F6B5C] hover:underline cursor-pointer"
                      >
                        + Voltar para Criar Novo Acesso
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-name" className="text-[12px] font-semibold text-[#4F5E57]">
                        Nome completo *
                      </label>
                      <input
                        id="crud-user-name"
                        data-testid="crud-user-name"
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex.: Operador D (Rafael)"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-shortname" className="text-[12px] font-semibold text-[#4F5E57]">
                        Nome curto (Exibição)
                      </label>
                      <input
                        id="crud-user-shortname"
                        data-testid="crud-user-shortname"
                        type="text"
                        value={formShortName}
                        onChange={(e) => setFormShortName(e.target.value)}
                        placeholder="Ex.: Operador D"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-login" className="text-[12px] font-semibold text-[#4F5E57]">
                        Login de acesso *
                      </label>
                      <input
                        id="crud-user-login"
                        data-testid="crud-user-login"
                        type="text"
                        value={formLogin}
                        onChange={(e) => setFormLogin(e.target.value)}
                        placeholder="Ex.: operador.d"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-email" className="text-[12px] font-semibold text-[#4F5E57]">
                        E-mail
                      </label>
                      <input
                        id="crud-user-email"
                        data-testid="crud-user-email"
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="Ex.: operador.d@enigma.com"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-[12px]">
                    <div className="flex flex-col gap-[4px]">
                      <div className="flex items-center justify-between">
                        <label htmlFor="crud-user-password" className="text-[12px] font-semibold text-[#4F5E57]">
                          Senha de acesso *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowFormPasswordPlain((v) => !v)}
                          className="text-[11px] text-[#0F6B5C] font-medium cursor-pointer"
                        >
                          {showFormPasswordPlain ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                      <input
                        id="crud-user-password"
                        data-testid="crud-user-password"
                        type={showFormPasswordPlain ? 'text' : 'password'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="Ex.: op123"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px] font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-role" className="text-[12px] font-semibold text-[#4F5E57]">
                        Perfil (RBAC)
                      </label>
                      <select
                        id="crud-user-role"
                        data-testid="crud-user-role"
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      >
                        <option value="operador">Operador (Usuário Final)</option>
                        <option value="socio">Sócio</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-status" className="text-[12px] font-semibold text-[#4F5E57]">
                        Status da Conta
                      </label>
                      <select
                        id="crud-user-status"
                        data-testid="crud-user-status"
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as UserAccountStatus)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      >
                        <option value="ativo">Ativo (Liberado)</option>
                        <option value="pendente">Pendente de Liberação</option>
                        <option value="bloqueado">Bloqueado</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-share" className="text-[12px] font-semibold text-[#4F5E57]">
                        Participação (%)
                      </label>
                      <input
                        id="crud-user-share"
                        type="number"
                        value={formProfitShare}
                        onChange={(e) => setFormProfitShare(e.target.value)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>

                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-balance" className="text-[12px] font-semibold text-[#4F5E57]">
                        Capital Inicial (USDT)
                      </label>
                      <input
                        id="crud-user-balance"
                        type="number"
                        value={formInitialBalance}
                        onChange={(e) => setFormInitialBalance(e.target.value)}
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px]">
                    <div className="flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-phone" className="text-[12px] font-semibold text-[#4F5E57]">
                        Telefone / WhatsApp
                      </label>
                      <input
                        id="crud-user-phone"
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-[4px]">
                      <label htmlFor="crud-user-notes" className="text-[12px] font-semibold text-[#4F5E57]">
                        Observações / Turno
                      </label>
                      <input
                        id="crud-user-notes"
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Notas internas de operação"
                        className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-[10px] pt-[6px]">
                    {editingUserId && (
                      <button
                        type="button"
                        onClick={resetInternalUserForm}
                        className="px-[14px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-white text-[#4F5E57] text-[13px] font-medium cursor-pointer"
                      >
                        Cancelar Edição
                      </button>
                    )}
                    <button
                      type="submit"
                      data-testid="crud-user-submit"
                      className="px-[16px] py-[8px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B5448] cursor-pointer"
                    >
                      {editingUserId ? 'Salvar Alterações do Usuário' : 'Criar Novo Acesso'}
                    </button>
                  </div>
                </form>
              )}

              {/* 4. Filtros de Status, Busca e Tabela de Usuários (Status, Login e Ações: Aprovar, Editar, Remover) */}
              <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <div className="flex flex-wrap gap-[6px]">
                  {(
                    [
                      ['todos', `Todos (${users.length})`],
                      ['ativo', `Ativos (${users.filter((u) => u.status === 'ativo').length})`],
                      ['pendente', `Pendentes (${users.filter((u) => u.status === 'pendente').length})`],
                      ['bloqueado', `Bloqueados (${users.filter((u) => u.status === 'bloqueado').length})`],
                    ] as const
                  ).map(([st, label]) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setUserFilter(st)}
                      className={`px-[12px] py-[6px] rounded-[8px] text-[12px] font-semibold transition-colors cursor-pointer ${
                        userFilter === st
                          ? 'bg-[#0F6B5C] text-white'
                          : 'bg-[#F0F3F1] text-[#4F5E57] hover:bg-[#E2E8E4]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-[10px]">
                  <input
                    type="search"
                    aria-label="Filtrar usuários por nome ou login"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Buscar usuário, login ou e-mail..."
                    className="px-[12px] py-[6px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[12px] min-w-[220px]"
                  />
                  <div className="text-[12px] text-[#5E6B65]">
                    Admin padrão: <code className="font-mono font-semibold">admin@enigma.com</code>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E5EBE7] rounded-[12px]">
                <table
                  data-testid="admin-users-table"
                  className="w-full text-left border-collapse text-[13px]"
                >
                  <thead>
                    <tr className="bg-[#F4F6F5] text-[#4F5E57] border-b border-[#E5EBE7] text-[12px]">
                      <th className="py-[10px] px-[12px] font-semibold">Usuário</th>
                      <th className="py-[10px] px-[12px] font-semibold">Login & Credenciais</th>
                      <th className="py-[10px] px-[12px] font-semibold">Perfil (RBAC)</th>
                      <th className="py-[10px] px-[12px] font-semibold">Status</th>
                      <th className="py-[10px] px-[12px] font-semibold">Capital Inicial / %</th>
                      <th className="py-[10px] px-[12px] font-semibold text-right">
                        Ações (Aprovar, Editar, Remover)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EFEA]">
                    {filteredUsersList.map((u) => {
                      const isRevealed = Boolean(revealedPasswords[u.id]);
                      const hashPreview = (
                        u.passwordHash || computePasswordHash(u.password || '')
                      ).slice(0, 15);
                      return (
                        <tr
                          key={u.id}
                          data-testid={`user-row-${u.login}`}
                          className="hover:bg-[#FAFBF9]"
                        >
                          <td className="py-[12px] px-[12px]">
                            <div className="font-bold text-[#1B2421]">{u.name}</div>
                            <div className="text-[11px] text-[#6B7872]">
                              Exibição: {u.shortName} {u.phone ? `· ${u.phone}` : ''}
                            </div>
                          </td>
                          <td className="py-[12px] px-[12px] font-mono text-[12px]">
                            <div className="text-[#1B2421] font-semibold">Login: {u.login}</div>
                            <div className="text-[#5E6B65]">{u.email}</div>
                            <div className="flex flex-wrap items-center gap-[6px] mt-[3px]">
                              <span className="text-[11px] text-[#4F5E57] bg-[#EEF2EF] px-[6px] py-[1px] rounded">
                                Senha: {isRevealed ? u.password || '—' : maskPassword(u.password)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleRevealPassword(u.id)}
                                className="text-[10px] font-sans font-semibold text-[#0F6B5C] hover:underline cursor-pointer"
                              >
                                {isRevealed ? 'Ocultar' : 'Revelar'}
                              </button>
                              <span
                                title="Assinatura de hash da credencial"
                                className="text-[10px] text-[#6B7872]"
                              >
                                ({hashPreview}…)
                              </span>
                            </div>
                            {u.mustChangePassword && (
                              <div className="text-[10px] font-sans font-semibold text-[#9A6518] mt-[2px]">
                                ● Troca de senha pendente no próximo login
                              </div>
                            )}
                          </td>
                          <td className="py-[12px] px-[12px]">
                            <span
                              className={`inline-block px-[8px] py-[2px] rounded-full text-[11px] font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-[#DCECE7] text-[#0F6B5C]'
                                  : u.role === 'operador'
                                  ? 'bg-[#FBF0DD] text-[#9A6518]'
                                  : 'bg-[#E8ECEA] text-[#3A4A43]'
                              }`}
                            >
                              {u.role === 'admin'
                                ? 'Administrador'
                                : u.role === 'operador'
                                ? 'Operador'
                                : 'Sócio'}
                            </span>
                          </td>
                          <td className="py-[12px] px-[12px]">
                            <span
                              className={`inline-block px-[8px] py-[2px] rounded-full text-[11px] font-semibold ${
                                u.status === 'ativo'
                                  ? 'bg-[#E1F3EA] text-[#0D6547]'
                                  : u.status === 'pendente'
                                  ? 'bg-[#FBF0DD] text-[#9A6518]'
                                  : 'bg-[#FBE9E7] text-[#8C1D18]'
                              }`}
                            >
                              {u.status === 'ativo'
                                ? 'Ativo'
                                : u.status === 'pendente'
                                ? 'Pendente'
                                : 'Bloqueado'}
                            </span>
                            <div className="text-[10.5px] text-[#7A8781] mt-[3px]">
                              {u.approvedBy ? `Liberado por ${u.approvedBy}` : 'Aguardando aprovação'}
                            </div>
                          </td>
                          <td className="py-[12px] px-[12px] tabular-nums">
                            <div className="font-semibold text-[#1B2421]">
                              {formatCurrencyBRL(u.initialMonthlyBalance)}
                            </div>
                            <div className="text-[11px] text-[#6B7872]">
                              Comissão: {u.profitSharePercent}%
                            </div>
                          </td>
                          <td className="py-[12px] px-[12px] text-right">
                            <div className="flex flex-wrap justify-end gap-[6px]">
                              <button
                                type="button"
                                data-testid={`btn-aprovar-${u.id}`}
                                disabled={u.status === 'ativo'}
                                onClick={() => handleApprovePending(u)}
                                title={
                                  u.status === 'ativo'
                                    ? 'Usuário já está aprovado e ativo'
                                    : 'Aprovar e ativar acesso deste usuário'
                                }
                                className={`px-[10px] py-[5px] rounded-[7px] text-[11px] font-semibold transition-colors ${
                                  u.status === 'ativo'
                                    ? 'bg-[#E9EFEA] text-[#6B7872] cursor-default opacity-70'
                                    : 'bg-[#0F6B5C] text-white hover:bg-[#0B5448] cursor-pointer'
                                }`}
                              >
                                Aprovar
                              </button>

                              <button
                                type="button"
                                data-testid={`btn-editar-${u.id}`}
                                onClick={() => openEditUserModal(u)}
                                className="px-[10px] py-[5px] rounded-[7px] border border-[#C9D2CD] bg-white text-[#1B2421] text-[11px] font-semibold hover:bg-[#F0F3F1] cursor-pointer"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                data-testid={`btn-remover-${u.id}`}
                                disabled={u.id === currentUser.id}
                                onClick={() => deleteAdminUser(u.id)}
                                title={
                                  u.id === currentUser.id
                                    ? 'Você não pode remover sua própria conta em uso'
                                    : `Remover usuário ${u.name}`
                                }
                                className={`px-[10px] py-[5px] rounded-[7px] border text-[11px] font-semibold transition-colors ${
                                  u.id === currentUser.id
                                    ? 'border-[#E0E4E2] bg-[#F4F6F5] text-[#9AA5A0] cursor-not-allowed'
                                    : 'border-[#E7B5AD] bg-[#FBECE9] text-[#9E3324] hover:bg-[#F6D7D2] cursor-pointer'
                                }`}
                              >
                                Remover
                              </button>

                              <button
                                type="button"
                                onClick={() => openCredentialManager(u)}
                                className="px-[10px] py-[5px] rounded-[7px] border border-[#0F6B5C] bg-[#EDF6F3] text-[#0F6B5C] text-[11px] font-semibold hover:bg-[#DCECE7] cursor-pointer"
                              >
                                Credenciais
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5. Estrutura para Persistência de Dados de Usuários (UserRepository) */}
              <div className="p-[16px] rounded-[12px] bg-[#F8FAF9] border border-[#DCE3DF] flex flex-col gap-[12px]">
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <div>
                    <div className="flex items-center gap-[8px]">
                      <span className="w-[8px] h-[8px] rounded-full bg-[#0F6B5C] inline-block" />
                      <h3 className="text-[14px] font-bold text-[#1B2421]">
                        Estrutura de Persistência de Dados de Usuários (UserRepository v{userPersistenceSnapshot.schemaVersion})
                      </h3>
                    </div>
                    <p className="text-[12px] text-[#5E6B65] mt-[2px]">
                      Todos os cadastros, aprovações e hashes de credenciais são persistidos automaticamente em estrutura versionada (<code className="font-mono">{userPersistenceSnapshot.storageKey}</code>) pronta para sincronização com banco SQL.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-[8px]">
                    <button
                      type="button"
                      onClick={syncUsersRepositoryNow}
                      className="px-[12px] py-[7px] rounded-[8px] border border-[#C9D2CD] bg-white text-[#1B2421] text-[12px] font-semibold hover:bg-[#F0F3F1] cursor-pointer"
                    >
                      Sincronizar Persistência
                    </button>
                    <button
                      type="button"
                      onClick={handleExportUsersPersistenceJson}
                      className="px-[12px] py-[7px] rounded-[8px] bg-[#17211E] text-white text-[12px] font-semibold hover:bg-[#263833] cursor-pointer"
                    >
                      Exportar Snapshot de Usuários (.json)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowJsonImportBox((v) => !v)}
                      className="px-[12px] py-[7px] rounded-[8px] border border-[#0F6B5C] text-[#0F6B5C] bg-white text-[12px] font-semibold hover:bg-[#EDF6F3] cursor-pointer"
                    >
                      {showJsonImportBox ? 'Fechar Importação JSON' : 'Restaurar Snapshot JSON'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] text-[12px]">
                  <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
                    <div className="text-[#6B7872]">Driver de Persistência</div>
                    <div className="font-semibold text-[#1B2421] font-mono mt-[2px]">
                      {userPersistenceSnapshot.driver} (Schema v{userPersistenceSnapshot.schemaVersion})
                    </div>
                  </div>
                  <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
                    <div className="text-[#6B7872]">Checksum de Integridade</div>
                    <div className="font-semibold text-[#0F6B5C] font-mono mt-[2px]">
                      {userPersistenceSnapshot.checksum}
                    </div>
                  </div>
                  <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
                    <div className="text-[#6B7872]">Registros Persistidos</div>
                    <div className="font-semibold text-[#1B2421] mt-[2px]">
                      {userPersistenceSnapshot.totalRecords} total ({userPersistenceSnapshot.activeCount} ativos · {userPersistenceSnapshot.pendingCount} pendentes)
                    </div>
                  </div>
                  <div className="p-[10px] rounded-[8px] bg-white border border-[#E4EAE7]">
                    <div className="text-[#6B7872]">Última Gravação</div>
                    <div className="font-semibold text-[#1B2421] font-mono mt-[2px]">
                      {userPersistenceSnapshot.updatedAt}
                    </div>
                  </div>
                </div>

                {showJsonImportBox && (
                  <div className="p-[12px] rounded-[10px] bg-white border border-[#C9D2CD] flex flex-col gap-[8px]">
                    <label
                      htmlFor="import-users-json"
                      className="text-[12px] font-semibold text-[#1B2421]"
                    >
                      Cole o conteúdo do Snapshot JSON de Usuários para restaurar na camada de persistência:
                    </label>
                    <textarea
                      id="import-users-json"
                      rows={4}
                      value={jsonImportText}
                      onChange={(e) => setJsonImportText(e.target.value)}
                      placeholder='{"schemaVersion": 3, "users": [...]}'
                      className="w-full p-[10px] rounded-[8px] border border-[#C9D2CD] font-mono text-[12px]"
                    />
                    <div className="flex justify-end gap-[8px]">
                      <button
                        type="button"
                        onClick={() => setShowJsonImportBox(false)}
                        className="px-[12px] py-[6px] rounded-[8px] border border-[#C9D2CD] text-[12px] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmJsonImport}
                        className="px-[14px] py-[6px] rounded-[8px] bg-[#0F6B5C] text-white text-[12px] font-semibold cursor-pointer"
                      >
                        Aplicar Snapshot JSON
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeAdminTab === 'catalogo' ? (
            <CatalogManagerPanel />
          ) : (
            <div
              role="tabpanel"
              aria-labelledby="admin-tab-sql"
              className="flex flex-col gap-[16px]"
            >
              <div className="flex flex-wrap justify-between items-start gap-[12px]">
                <div>
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#DCECE7] text-[#0F6B5C] uppercase tracking-wider">
                      Supabase PostgreSQL · 19 Tabelas Ativas
                    </span>
                    <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-mono bg-[#F0F3F1] text-[#3A4A43]">
                      supabase/migrations/ · drizzle/0000_tiny_kingpin.sql
                    </span>
                  </div>
                  <h2 className="text-[18px] font-bold text-[#1B2421] mt-[6px]">
                    Integração Supabase & Migrations SQL
                  </h2>
                  <p className="text-[13px] text-[#5E6B65] mt-[2px]">
                    Migrations geradas em <code className="font-mono">supabase/migrations/</code>, <code className="font-mono">database/migrations/</code> e <code className="font-mono">drizzle/</code> com Row Level Security (RLS), views consolidadas e sincronização em tempo real com PostgreSQL.
                  </p>
                </div>

                <div className="flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    onClick={syncUsersRepositoryNow}
                    className="px-[13px] py-[10px] rounded-[10px] border border-[#0F6B5C] bg-[#EDF6F3] text-[#0F6B5C] text-[12px] font-semibold hover:bg-[#DCECE7] transition-colors cursor-pointer"
                  >
                    Sincronizar Dados com Supabase Agora
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSingleMigration}
                    className="px-[13px] py-[10px] rounded-[10px] border border-[#C9D2CD] bg-white text-[#1B2421] text-[12px] font-semibold hover:bg-[#F0F3F1] transition-colors cursor-pointer"
                  >
                    Baixar Migration Selecionada (.sql)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSqlBundle}
                    className="px-[14px] py-[10px] rounded-[10px] bg-[#17211E] text-white text-[12px] font-semibold hover:bg-[#263833] transition-colors cursor-pointer"
                  >
                    Baixar Bundle Completo Supabase + Seeds (.sql)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[10px] text-[12px]">
                <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#DCE3DF]">
                  <div className="text-[#6B7872]">Motor Relacional</div>
                  <div className="font-bold text-[#0F6B5C] font-mono mt-[2px]">
                    Supabase / PostgreSQL 15+
                  </div>
                </div>
                <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#DCE3DF]">
                  <div className="text-[#6B7872]">Tabelas & Views</div>
                  <div className="font-bold text-[#1B2421] mt-[2px]">
                    19 Tabelas + 1 View Patrimonial
                  </div>
                </div>
                <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#DCE3DF]">
                  <div className="text-[#6B7872]">Migrations Geradas</div>
                  <div className="font-bold text-[#1B2421] font-mono mt-[2px]">
                    {ENIGMA_DATABASE_MIGRATIONS.length} arquivos .sql + Drizzle
                  </div>
                </div>
                <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#DCE3DF]">
                  <div className="text-[#6B7872]">Segurança de Banco</div>
                  <div className="font-bold text-[#0F6B5C] mt-[2px]">
                    RLS Habilitado + Hash SHA-256
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-[16px]">
                <div className="lg:col-span-5 flex flex-col gap-[8px]">
                  {ENIGMA_DATABASE_MIGRATIONS.map((mig) => {
                    const isSelected = mig.id === selectedMigration.id;
                    return (
                      <button
                        key={mig.id}
                        type="button"
                        onClick={() => setSelectedMigrationId(mig.id)}
                        className={`text-left p-[12px] rounded-[10px] border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDF6F3] border-[#0F6B5C]'
                            : 'bg-[#F8FAF9] border-[#E4EAE7] hover:bg-[#F0F4F2]'
                        }`}
                      >
                        <div className="text-[13px] font-bold text-[#1B2421]">{mig.title}</div>
                        <div className="text-[11px] font-mono text-[#0F6B5C] mt-[2px]">
                          {mig.filename}
                        </div>
                        <div className="text-[12px] text-[#5E6B65] mt-[4px]">
                          {mig.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-7 bg-[#17211E] text-[#D8E5DF] rounded-[12px] p-[16px] flex flex-col gap-[10px]">
                  <div className="flex flex-wrap items-center justify-between gap-[8px] border-b border-[#2C3E38] pb-[8px]">
                    <span className="text-[12px] font-mono text-[#7CE2C8]">
                      {selectedMigration.filename}
                    </span>
                    <span className="text-[11px] text-[#8FA39B]">
                      Tabelas ({selectedMigration.tables.length}): {selectedMigration.tables.join(', ')}
                    </span>
                  </div>
                  <pre className="text-[12px] font-mono leading-[1.5] overflow-x-auto text-[#CFE0D9] whitespace-pre-wrap">
                    {selectedMigration.sqlPreview}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          VISÃO DO OPERADOR (E CONTA PESSOAL): MEU PERFIL E SEGURANÇA DE ACESSO
         ===================================================================== */}
      {!capabilities.isAdmin && (
        <section className="bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[22px] shadow-xs flex flex-col gap-[16px]">
          <div className="flex flex-wrap justify-between items-start gap-[12px] border-b border-[#E5EBE7] pb-[14px]">
            <div>
              <span className="inline-block px-[9px] py-[2px] rounded-full text-[11px] font-semibold bg-[#FBF0DD] text-[#9A6518] uppercase tracking-wider">
                Meus Dados de Acesso
              </span>
              <h2 className="text-[18px] font-bold text-[#1B2421] mt-[6px]">
                Perfil Operacional e Senha de Acesso
              </h2>
              <p className="text-[13px] text-[#5E6B65] mt-[2px]">
                Seus dados pessoais de acesso e resumo do escopo autorizado na operação. A gestão de usuários e a exportação de relatórios são exclusivas do Administrador.
              </p>
            </div>
            <div className="px-[12px] py-[8px] rounded-[10px] bg-[#F4F6F5] border border-[#DCE3DF] text-[12px] text-[#4F5E57]">
              Parcerias ativas vinculadas:{' '}
              <strong>
                {partnerships.filter((p) => p.operatorId === currentUser.id).length}
              </strong>{' '}
              · Contas em casas: <strong>{houseAccounts.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
            <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#E4EAE7]">
              <div className="text-[11px] font-semibold uppercase text-[#6B7872]">Login / E-mail</div>
              <div className="text-[14px] font-bold text-[#1B2421] font-mono mt-[2px]">
                {currentUser.login}
              </div>
              <div className="text-[12px] text-[#5E6B65]">{currentUser.email}</div>
            </div>
            <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#E4EAE7]">
              <div className="text-[11px] font-semibold uppercase text-[#6B7872]">Nível de Permissão</div>
              <div className="text-[14px] font-bold text-[#9A6518] mt-[2px]">
                {capabilities.isOperator ? 'Operador (Escopo Próprio)' : 'Sócio'}
              </div>
              <div className="text-[12px] text-[#5E6B65]">Credenciais protegidas por hash</div>
            </div>
            <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#E4EAE7]">
              <div className="text-[11px] font-semibold uppercase text-[#6B7872]">Participação Definida</div>
              <div className="text-[14px] font-bold text-[#1B2421] mt-[2px]">
                {currentUser.profitSharePercent}% sobre o lucro líquido
              </div>
              <div className="text-[12px] text-[#5E6B65]">Definido pelo Administrador</div>
            </div>
            <div className="p-[12px] rounded-[10px] bg-[#F8FAF9] border border-[#E4EAE7]">
              <div className="text-[11px] font-semibold uppercase text-[#6B7872]">Capital Inicial no Mês</div>
              <div className="text-[14px] font-bold text-[#1B2421] mt-[2px]">
                {formatCurrencyBRL(currentUser.initialMonthlyBalance)}
              </div>
              <div className="text-[12px] text-[#5E6B65]">Base de apuração mensal</div>
            </div>
          </div>

          <form
            onSubmit={handleUpdateOwnSecurity}
            className="pt-[8px] grid grid-cols-1 md:grid-cols-5 gap-[12px] items-end"
          >
            <div className="flex flex-col gap-[4px]">
              <label htmlFor="own-name" className="text-[12px] font-semibold text-[#4F5E57]">
                Meu Nome
              </label>
              <input
                id="own-name"
                type="text"
                value={ownName}
                onChange={(e) => setOwnName(e.target.value)}
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <label htmlFor="own-phone" className="text-[12px] font-semibold text-[#4F5E57]">
                Meu Telefone
              </label>
              <input
                id="own-phone"
                type="text"
                value={ownPhone}
                onChange={(e) => setOwnPhone(e.target.value)}
                placeholder="(11) 98888-0000"
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <label htmlFor="own-current-pass" className="text-[12px] font-semibold text-[#4F5E57]">
                Senha Atual (para trocar senha)
              </label>
              <input
                id="own-current-pass"
                type="password"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                placeholder="Senha atual"
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px]"
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <label htmlFor="own-new-pass" className="text-[12px] font-semibold text-[#4F5E57]">
                Nova Senha
              </label>
              <input
                id="own-new-pass"
                type="password"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="px-[10px] py-[8px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px]"
              />
            </div>

            <button
              type="submit"
              className="py-[9px] px-[14px] rounded-[8px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B5448] transition-colors cursor-pointer"
            >
              Salvar Minha Conta
            </button>
          </form>
        </section>
      )}

      {/* =====================================================================
          SEÇÃO DE EXPORTAÇÕES:
          - EXCLUSIVO ADMINISTRADOR: Controles completos de exportação CSV e atendimento de solicitações
          - USUÁRIO / OPERADOR: Apenas UMA única opção de solicitar exportação ao Administrador
         ===================================================================== */}
      {capabilities.canExportCsv ? (
        <section
          aria-label="Exportações Exclusivas do Administrador"
          className="grid grid-cols-1 lg:grid-cols-12 gap-[16px]"
        >
          <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[20px] shadow-xs flex flex-col gap-[16px]">
            <div className="flex flex-wrap justify-between items-center gap-[10px]">
              <div>
                <div className="flex items-center gap-[8px]">
                  <span className="inline-block px-[8px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#DCECE7] text-[#0F6B5C]">
                    Exclusivo Administrador
                  </span>
                  {pendingExportRequests.length > 0 && (
                    <span className="inline-block px-[8px] py-[2px] rounded-full text-[10px] font-semibold bg-[#FBF0DD] text-[#9A6518]">
                      {pendingExportRequests.length} solicitação(ões) de usuário pendente(s)
                    </span>
                  )}
                </div>
                <h2 className="text-[16px] font-semibold text-[#1B2421] mt-[4px]">
                  Central de Exportação de Relatórios (CSV)
                </h2>
                <p className="text-[12px] text-[#5E6B65]">
                  A geração de arquivos CSV é restrita ao Administrador. Exportando registros do período <strong>{operationalMonthYearLabel}</strong>.
                </p>
              </div>
            </div>

            {pendingExportRequests.length > 0 && (
              <div className="p-[12px] rounded-[10px] bg-[#FDF8ED] border border-[#E8C987] flex flex-col gap-[8px]">
                <div className="text-[12px] font-bold text-[#7C4D0B]">
                  Solicitações de Exportação Enviadas pelos Operadores ({pendingExportRequests.length})
                </div>
                {pendingExportRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-[10px] p-[10px] rounded-[8px] bg-white border border-[#E6D4AA] text-[12px]"
                  >
                    <div>
                      <strong>{req.userName}</strong> (<code className="font-mono">{req.userLogin}</code>) solicitou exportação do período <strong>{req.periodLabel}</strong> em {req.requestedAt}
                    </div>
                    <div className="flex gap-[8px]">
                      <button
                        type="button"
                        onClick={() => {
                          setScopeOperatorId(req.userId);
                          handleExportAll();
                          fulfillExportRequest(req.id);
                        }}
                        className="px-[10px] py-[5px] rounded-[6px] bg-[#0F6B5C] text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Gerar CSVs e Atender
                      </button>
                      <button
                        type="button"
                        onClick={() => fulfillExportRequest(req.id)}
                        className="px-[10px] py-[5px] rounded-[6px] border border-[#C9D2CD] bg-white text-[#4F5E57] text-[11px] font-medium cursor-pointer"
                      >
                        Concluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="csv-delimiter"
                  className="text-[12px] font-medium text-[#5E6B65]"
                >
                  Separador de colunas
                </label>
                <select
                  id="csv-delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value as CsvExportOptions['delimiter'])}
                  className="px-[12px] py-[9px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421]"
                >
                  <option value=";">Ponto e vírgula (;) — Excel Brasil</option>
                  <option value=",">Vírgula (,) — Padrão Internacional</option>
                </select>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="csv-decimal"
                  className="text-[12px] font-medium text-[#5E6B65]"
                >
                  Separador decimal
                </label>
                <select
                  id="csv-decimal"
                  value={decimalSeparator}
                  onChange={(e) =>
                    setDecimalSeparator(e.target.value as CsvExportOptions['decimalSeparator'])
                  }
                  className="px-[12px] py-[9px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421]"
                >
                  <option value=",">Vírgula (1.250,50)</option>
                  <option value=".">Ponto (1250.50)</option>
                </select>
              </div>

              <div className="flex flex-col gap-[6px]">
                <label
                  htmlFor="csv-operator-scope"
                  className="text-[12px] font-medium text-[#5E6B65]"
                >
                  Filtrar por operador
                </label>
                <select
                  id="csv-operator-scope"
                  value={scopeOperatorId}
                  onChange={(e) => setScopeOperatorId(e.target.value)}
                  className="px-[12px] py-[9px] rounded-[8px] border border-[#C9D2CD] bg-[#FAFBFA] text-[13px] text-[#1B2421]"
                >
                  <option value="all">Toda a operação autorizada</option>
                  {users
                    .filter((u) => u.role === 'operador' && u.status === 'ativo')
                    .map((op) => (
                      <option key={op.id} value={op.id}>
                        Apenas {op.shortName}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[10px] pt-[6px]">
              <button
                type="button"
                onClick={handleExportEntradas}
                className="p-[12px] rounded-[10px] border border-[#C9D2CD] bg-[#FAFBFA] hover:bg-[#EEF3F0] text-left transition-colors cursor-pointer"
              >
                <div className="text-[13px] font-bold text-[#1B2421]">Entradas (.csv)</div>
                <div className="text-[11px] text-[#5E6B65] mt-[2px]">
                  {exportableEntries.length} registro(s) no período
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportSaques}
                className="p-[12px] rounded-[10px] border border-[#C9D2CD] bg-[#FAFBFA] hover:bg-[#EEF3F0] text-left transition-colors cursor-pointer"
              >
                <div className="text-[13px] font-bold text-[#1B2421]">Saques (.csv)</div>
                <div className="text-[11px] text-[#5E6B65] mt-[2px]">
                  {exportableWithdrawals.length} registro(s) no período
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportParcerias}
                className="p-[12px] rounded-[10px] border border-[#C9D2CD] bg-[#FAFBFA] hover:bg-[#EEF3F0] text-left transition-colors cursor-pointer"
              >
                <div className="text-[13px] font-bold text-[#1B2421]">Parcerias (.csv)</div>
                <div className="text-[11px] text-[#5E6B65] mt-[2px]">
                  {exportablePartnerships.length} titular(es)
                </div>
              </button>

              <button
                type="button"
                onClick={handleExportCustos}
                className="p-[12px] rounded-[10px] border border-[#C9D2CD] bg-[#FAFBFA] hover:bg-[#EEF3F0] text-left transition-colors cursor-pointer"
              >
                <div className="text-[13px] font-bold text-[#1B2421]">Custos (.csv)</div>
                <div className="text-[11px] text-[#5E6B65] mt-[2px]">
                  {exportableCosts.length} lançamento(s)
                </div>
              </button>
            </div>
          </div>

          {/* Proteção de Integridade da Base — Sem botão destrutivo na interface normal */}
          <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[20px] shadow-xs flex flex-col justify-between gap-[14px]">
            <div className="flex flex-col gap-[8px]">
              <span className="inline-block self-start px-[8px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#DCECE7] text-[#0F6B5C]">
                Proteção contra Zeramento Acidental
              </span>
              <h2 className="text-[16px] font-semibold text-[#1B2421]">
                Base Limpa & Zeramento Isolados por Domínio
              </h2>
              <p className="text-[12px] text-[#5E6B65] leading-[1.5]">
                Para proteger a operação, nenhum botão de zerar ou restaurar configurações fica exposto na tela do Administrador. O controle de inicialização limpa fica isolado diretamente no código do projeto:
              </p>
            </div>

            <div className="p-[12px] rounded-[10px] bg-[#17211E] text-[#CFE0D9] font-mono text-[11px] flex flex-col gap-[4px]">
              <div className="text-[#7CE2C8]">
                // src/database/systemMaintenance.ts (Linha 19)
              </div>
              <div>
                PROJECT_DATABASE_BOOT_MODE = &apos;{PROJECT_DATABASE_BOOT_MODE}&apos;
              </div>
              <div className="text-[#8FA39B] mt-[2px]">
                Domínio isolado: /?domain=sys_maintenance
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          aria-label="Solicitação de Exportação ao Administrador"
          className="bg-[#FFFFFF] border border-[#DCE3DF] rounded-[14px] p-[20px] shadow-xs flex flex-wrap items-center justify-between gap-[16px]"
        >
          <div className="max-w-[680px]">
            <span className="inline-block px-[8px] py-[2px] rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#FBF0DD] text-[#9A6518]">
              Exportação Restrita ao Administrador
            </span>
            <h2 className="text-[16px] font-semibold text-[#1B2421] mt-[4px]">
              Relatórios e Exportação de Dados
            </h2>
            <p className="text-[13px] text-[#5E6B65] mt-[2px]">
              A exportação de planilhas e relatórios operacionais é centralizada no perfil Administrador. Caso precise do relatório referente ao período vigente ({operationalMonthYearLabel}), envie uma solicitação abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={requestAdminExport}
            className="px-[16px] py-[10px] rounded-[10px] bg-[#0F6B5C] text-white text-[13px] font-semibold hover:bg-[#0B5448] transition-colors cursor-pointer shrink-0"
          >
            {myPendingExportRequest
              ? `Solicitação enviada ao Administrador (${operationalMonthYearLabel})`
              : 'Solicitar exportação ao Administrador'}
          </button>
        </section>
      )}
    </div>
  );
};
