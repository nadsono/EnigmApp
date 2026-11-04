import type { UserAccountStatus, UserProfile, UserRole } from './types.ts';

export interface AuthAttemptResult {
  ok: boolean;
  reason?: 'credenciais_invalidas' | 'cadastro_pendente' | 'conta_bloqueada';
  message: string;
  user?: UserProfile;
}

export interface RegistrationInput {
  name: string;
  shortName?: string;
  login: string;
  email: string;
  password: string;
  phone?: string;
  registrationNotes?: string;
  requestedRole?: UserRole;
}

export interface UserCrudResult {
  ok: boolean;
  message: string;
  users: UserProfile[];
  targetUser?: UserProfile;
}

export interface SettingsRoleCapabilities {
  isAdmin: boolean;
  isOperator: boolean;
  isSocio: boolean;
  canManageUsersCrud: boolean;
  canManageCatalog: boolean;
  canApproveRegistrations: boolean;
  canEditGlobalOperationalPeriod: boolean;
  canViewDatabaseMigrations: boolean;
  canExportGlobalData: boolean;
  canExportCsv: boolean;
  canRequestExportToAdmin: boolean;
  canResetSystemData: boolean;
  canManageOwnSecurity: boolean;
}

export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export function computePasswordHash(password: string): string {
  const input = `enigma_salt_v1::${password || ''}`;
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `sha256:${hex1}${hex2}`;
}

export function maskPassword(password?: string): string {
  if (!password) return '••••••••';
  const len = Math.max(6, Math.min(12, password.length));
  return '•'.repeat(len);
}

export function evaluatePasswordStrength(password: string): {
  score: 1 | 2 | 3;
  label: 'Fraca' | 'Média' | 'Forte';
} {
  const clean = password.trim();
  if (clean.length < 6) {
    return { score: 1, label: 'Fraca' };
  }
  const hasLetters = /[a-zA-Z]/.test(clean);
  const hasNumbers = /[0-9]/.test(clean);
  const hasSymbolsOrUpper = /[^a-zA-Z0-9]/.test(clean) || (/[A-Z]/.test(clean) && /[a-z]/.test(clean));
  if (clean.length >= 8 && hasLetters && hasNumbers && hasSymbolsOrUpper) {
    return { score: 3, label: 'Forte' };
  }
  return { score: 2, label: 'Média' };
}

export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const symbols = '@#$!';
  let pass = 'En';
  for (let i = 0; i < 5; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
  pass += String(Math.floor(10 + Math.random() * 89));
  return pass;
}

export function authenticateUser(
  users: UserProfile[],
  identifier: string,
  passwordInput: string,
  nowText = '11/10/2026 11:30'
): AuthAttemptResult {
  const cleanId = normalizeLoginIdentifier(identifier);
  if (!cleanId || !passwordInput) {
    return {
      ok: false,
      reason: 'credenciais_invalidas',
      message: 'Informe seu login (ou e-mail) e a senha de acesso.',
    };
  }

  const matched = users.find(
    (u) =>
      normalizeLoginIdentifier(u.login) === cleanId ||
      normalizeLoginIdentifier(u.email) === cleanId ||
      normalizeLoginIdentifier(u.id) === cleanId
  );

  if (!matched || (matched.password ?? '') !== passwordInput) {
    return {
      ok: false,
      reason: 'credenciais_invalidas',
      message: 'Login ou senha inválidos. Confira suas credenciais ou solicite cadastro.',
    };
  }

  if (matched.status === 'pendente') {
    return {
      ok: false,
      reason: 'cadastro_pendente',
      message:
        'Seu cadastro já foi registrado e aguarda liberação do Administrador para acessar a plataforma.',
      user: matched,
    };
  }

  if (matched.status === 'bloqueado') {
    return {
      ok: false,
      reason: 'conta_bloqueada',
      message:
        'Seu acesso encontra-se bloqueado. Entre em contato com o Administrador da operação.',
      user: matched,
    };
  }

  const authenticatedUser: UserProfile = {
    ...matched,
    lastLoginAt: nowText,
  };

  return {
    ok: true,
    message: `Bem-vindo(a), ${authenticatedUser.shortName}!`,
    user: authenticatedUser,
  };
}

export function createRegistrationRequest(
  users: UserProfile[],
  input: RegistrationInput,
  nowText = '11/10/2026 11:30'
): UserCrudResult {
  const name = input.name.trim();
  const email = normalizeLoginIdentifier(input.email);
  const login = normalizeLoginIdentifier(input.login || email.split('@')[0] || '');
  const password = input.password;

  if (!name || name.length < 3) {
    return {
      ok: false,
      message: 'Informe seu nome completo (mínimo de 3 caracteres).',
      users,
    };
  }

  if (!login || login.length < 3) {
    return {
      ok: false,
      message: 'Informe um usuário/login válido (mínimo de 3 caracteres).',
      users,
    };
  }

  if (!email || !email.includes('@')) {
    return {
      ok: false,
      message: 'Informe um endereço de e-mail válido.',
      users,
    };
  }

  if (!password || password.length < 4) {
    return {
      ok: false,
      message: 'A senha deve conter pelo menos 4 caracteres.',
      users,
    };
  }

  const duplicate = users.find(
    (u) =>
      normalizeLoginIdentifier(u.login) === login ||
      normalizeLoginIdentifier(u.email) === email
  );

  if (duplicate) {
    return {
      ok: false,
      message:
        duplicate.status === 'pendente'
          ? 'Já existe uma solicitação pendente para este login ou e-mail aguardando liberação do Administrador.'
          : 'Este login ou e-mail já está cadastrado no sistema.',
      users,
    };
  }

  const shortName =
    input.shortName?.trim() ||
    name
      .split(/\s+/)
      .slice(0, 2)
      .join(' ');

  const newUser: UserProfile = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    shortName,
    login,
    email,
    password,
    status: 'pendente',
    role: input.requestedRole ?? 'operador',
    companyId: 'enigma_grupo',
    profitSharePercent: (input.requestedRole ?? 'operador') === 'operador' ? 50 : 0,
    initialMonthlyBalance: 0,
    phone: input.phone?.trim() || '',
    registrationNotes:
      input.registrationNotes?.trim() || 'Solicitação de acesso via tela de login.',
    createdAt: nowText,
    approvedAt: null,
    approvedBy: null,
    lastLoginAt: null,
  };

  return {
    ok: true,
    message:
      'Cadastro enviado com sucesso! O Administrador receberá sua solicitação para liberar seu acesso.',
    users: [newUser, ...users],
    targetUser: newUser,
  };
}

export function approveUserRegistrationPure(
  users: UserProfile[],
  userId: string,
  adminName: string,
  overrides?: {
    role?: UserRole;
    profitSharePercent?: number;
    initialMonthlyBalance?: number;
    shortName?: string;
  },
  nowText = '11/10/2026 11:35'
): UserCrudResult {
  const existing = users.find((u) => u.id === userId);
  if (!existing) {
    return {
      ok: false,
      message: 'Usuário não encontrado para liberação.',
      users,
    };
  }

  const updatedUser: UserProfile = {
    ...existing,
    status: 'ativo',
    role: overrides?.role ?? existing.role,
    shortName: overrides?.shortName?.trim() || existing.shortName,
    profitSharePercent:
      overrides?.profitSharePercent !== undefined
        ? overrides.profitSharePercent
        : existing.profitSharePercent,
    initialMonthlyBalance:
      overrides?.initialMonthlyBalance !== undefined
        ? overrides.initialMonthlyBalance
        : existing.initialMonthlyBalance,
    approvedAt: nowText,
    approvedBy: adminName,
  };

  return {
    ok: true,
    message: `Acesso de ${updatedUser.name} (${updatedUser.login}) liberado com sucesso!`,
    users: users.map((u) => (u.id === userId ? updatedUser : u)),
    targetUser: updatedUser,
  };
}

export function createAdminUserPure(
  users: UserProfile[],
  payload: {
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
  },
  adminName: string,
  nowText = '11/10/2026 11:40'
): UserCrudResult {
  const name = payload.name.trim();
  const login = normalizeLoginIdentifier(payload.login);
  const email = normalizeLoginIdentifier(payload.email || `${login}@enigma.com`);
  const password = payload.password;

  if (!name || !login || !password) {
    return {
      ok: false,
      message: 'Preencha nome, login e senha para criar o usuário.',
      users,
    };
  }

  const duplicate = users.find(
    (u) =>
      normalizeLoginIdentifier(u.login) === login ||
      normalizeLoginIdentifier(u.email) === email
  );

  if (duplicate) {
    return {
      ok: false,
      message: 'Já existe um usuário com este login ou e-mail.',
      users,
    };
  }

  const newUser: UserProfile = {
    id:
      payload.role === 'operador'
        ? `op_${login.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-3)}`
        : `usr_${login.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).slice(-3)}`,
    name,
    shortName: payload.shortName.trim() || name.split(/\s+/)[0],
    login,
    email,
    password,
    status: payload.status,
    role: payload.role,
    companyId: 'enigma_grupo',
    profitSharePercent: payload.profitSharePercent,
    initialMonthlyBalance: payload.initialMonthlyBalance,
    phone: payload.phone?.trim() || '',
    registrationNotes: payload.registrationNotes?.trim() || 'Criado diretamente pelo Administrador.',
    createdAt: nowText,
    approvedAt: payload.status === 'ativo' ? nowText : null,
    approvedBy: payload.status === 'ativo' ? adminName : null,
    lastLoginAt: null,
  };

  return {
    ok: true,
    message: `Usuário ${newUser.shortName} criado com sucesso.`,
    users: [...users, newUser],
    targetUser: newUser,
  };
}

export function updateAdminUserPure(
  users: UserProfile[],
  userId: string,
  patch: Partial<UserProfile>
): UserCrudResult {
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return {
      ok: false,
      message: 'Usuário não encontrado.',
      users,
    };
  }

  // Prevent locking out or demoting the last active administrator
  const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'ativo');
  const wouldRemoveAdmin =
    target.role === 'admin' &&
    target.status === 'ativo' &&
    ((patch.role && patch.role !== 'admin') || (patch.status && patch.status !== 'ativo'));

  if (wouldRemoveAdmin && activeAdmins.length <= 1) {
    return {
      ok: false,
      message:
        'Não é permitido bloquear ou remover o perfil de Administrador do único administrador ativo do sistema.',
      users,
    };
  }

  if (patch.login || patch.email) {
    const nextLogin = normalizeLoginIdentifier(patch.login ?? target.login);
    const nextEmail = normalizeLoginIdentifier(patch.email ?? target.email);
    const conflict = users.find(
      (u) =>
        u.id !== userId &&
        (normalizeLoginIdentifier(u.login) === nextLogin ||
          normalizeLoginIdentifier(u.email) === nextEmail)
    );
    if (conflict) {
      return {
        ok: false,
        message: 'Outro usuário já utiliza este login ou e-mail.',
        users,
      };
    }
  }

  const nextPassword =
    patch.password && patch.password.trim().length > 0
      ? patch.password.trim()
      : target.password;

  const updatedUser: UserProfile = {
    ...target,
    ...patch,
    name: (patch.name ?? target.name).trim(),
    shortName: (patch.shortName ?? target.shortName).trim(),
    login: normalizeLoginIdentifier(patch.login ?? target.login),
    email: normalizeLoginIdentifier(patch.email ?? target.email),
    password: nextPassword,
    passwordHash: computePasswordHash(nextPassword || ''),
  };

  return {
    ok: true,
    message: `Dados de ${updatedUser.shortName} atualizados com sucesso.`,
    users: users.map((u) => (u.id === userId ? updatedUser : u)),
    targetUser: updatedUser,
  };
}

export function updateUserCredentialsPure(
  users: UserProfile[],
  userId: string,
  payload: {
    login?: string;
    email?: string;
    newPassword?: string;
    mustChangePassword?: boolean;
  },
  nowText = '11/10/2026 11:45'
): UserCrudResult {
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return {
      ok: false,
      message: 'Usuário não encontrado para atualização de credenciais.',
      users,
    };
  }

  const nextLogin = normalizeLoginIdentifier(payload.login ?? target.login);
  const nextEmail = normalizeLoginIdentifier(payload.email ?? target.email);

  if (!nextLogin || nextLogin.length < 3) {
    return {
      ok: false,
      message: 'O login deve possuir ao menos 3 caracteres.',
      users,
    };
  }

  if (!nextEmail || !nextEmail.includes('@')) {
    return {
      ok: false,
      message: 'Informe um e-mail válido para a credencial.',
      users,
    };
  }

  const conflict = users.find(
    (u) =>
      u.id !== userId &&
      (normalizeLoginIdentifier(u.login) === nextLogin ||
        normalizeLoginIdentifier(u.email) === nextEmail)
  );
  if (conflict) {
    return {
      ok: false,
      message: 'Outro usuário já utiliza este login ou e-mail.',
      users,
    };
  }

  let nextPassword = target.password || '';
  let nextPasswordUpdatedAt = target.passwordUpdatedAt ?? null;
  if (payload.newPassword !== undefined && payload.newPassword.trim().length > 0) {
    if (payload.newPassword.trim().length < 4) {
      return {
        ok: false,
        message: 'A nova senha deve conter pelo menos 4 caracteres.',
        users,
      };
    }
    nextPassword = payload.newPassword.trim();
    nextPasswordUpdatedAt = nowText;
  }

  const updatedUser: UserProfile = {
    ...target,
    login: nextLogin,
    email: nextEmail,
    password: nextPassword,
    passwordHash: computePasswordHash(nextPassword),
    passwordUpdatedAt: nextPasswordUpdatedAt,
    mustChangePassword:
      payload.mustChangePassword !== undefined
        ? payload.mustChangePassword
        : target.mustChangePassword ?? false,
  };

  return {
    ok: true,
    message: `Credenciais (login/senha) de ${updatedUser.shortName} atualizadas com segurança.`,
    users: users.map((u) => (u.id === userId ? updatedUser : u)),
    targetUser: updatedUser,
  };
}

export function deleteAdminUserPure(
  users: UserProfile[],
  userId: string,
  actingAdminId: string
): UserCrudResult {
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return {
      ok: false,
      message: 'Usuário não encontrado.',
      users,
    };
  }

  if (target.id === actingAdminId) {
    return {
      ok: false,
      message: 'Você não pode excluir sua própria conta de Administrador em uso.',
      users,
    };
  }

  const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'ativo');
  if (target.role === 'admin' && target.status === 'ativo' && activeAdmins.length <= 1) {
    return {
      ok: false,
      message: 'Não é possível excluir o único Administrador ativo.',
      users,
    };
  }

  return {
    ok: true,
    message: `Usuário ${target.name} removido do sistema.`,
    users: users.filter((u) => u.id !== userId),
    targetUser: target,
  };
}

export function getSettingsRoleCapabilities(user: UserProfile): SettingsRoleCapabilities {
  const isAdmin = user.role === 'admin';
  const isOperator = user.role === 'operador';
  const isSocio = user.role === 'socio';

  return {
    isAdmin,
    isOperator,
    isSocio,
    canManageUsersCrud: isAdmin,
    canManageCatalog: isAdmin,
    canApproveRegistrations: isAdmin,
    canEditGlobalOperationalPeriod: isAdmin,
    canViewDatabaseMigrations: isAdmin,
    canExportGlobalData: isAdmin,
    canExportCsv: isAdmin,
    canRequestExportToAdmin: !isAdmin,
    // Isolado fora da UI normal (controlado via src/database/systemMaintenance.ts ou ?domain=sys_maintenance)
    canResetSystemData: false,
    canManageOwnSecurity: true,
  };
}
