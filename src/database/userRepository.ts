import { INITIAL_USERS } from '../domain/seed.ts';
import { computePasswordHash, normalizeLoginIdentifier } from '../domain/auth.ts';
import type {
  ExportRequestRecord,
  UserPersistenceSnapshot,
  UserProfile,
} from '../domain/types.ts';

export const USERS_REPOSITORY_STORAGE_KEY = 'enigma_users_repository_v3';
export const LEGACY_USERS_STORAGE_KEY = 'enigma_users_v2';
export const EXPORT_REQUESTS_STORAGE_KEY = 'enigma_export_requests_v1';
export const USER_REPOSITORY_SCHEMA_VERSION = 3;

export function enrichUserWithPersistenceMetadata(user: UserProfile): UserProfile {
  return {
    ...user,
    login: normalizeLoginIdentifier(user.login),
    email: normalizeLoginIdentifier(user.email),
    passwordHash: user.passwordHash || computePasswordHash(user.password || ''),
    passwordUpdatedAt: user.passwordUpdatedAt ?? user.createdAt ?? '01/10/2026 08:00',
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

export function computeUsersChecksum(users: UserProfile[]): string {
  const payload = users
    .map(
      (u) =>
        `${u.id}:${u.login}:${u.email}:${u.role}:${u.status}:${u.passwordHash || computePasswordHash(u.password || '')}`
    )
    .join('|');
  return computePasswordHash(payload).replace('sha256:', 'chk:');
}

export function buildUserPersistenceSnapshot(
  users: UserProfile[],
  updatedAt = '11/10/2026 11:45'
): UserPersistenceSnapshot {
  const normalizedUsers = users.map(enrichUserWithPersistenceMetadata);
  const activeCount = normalizedUsers.filter((u) => u.status === 'ativo').length;
  const pendingCount = normalizedUsers.filter((u) => u.status === 'pendente').length;
  const blockedCount = normalizedUsers.filter((u) => u.status === 'bloqueado').length;

  return {
    schemaVersion: USER_REPOSITORY_SCHEMA_VERSION,
    driver: 'localStorage+sql',
    storageKey: USERS_REPOSITORY_STORAGE_KEY,
    updatedAt,
    checksum: computeUsersChecksum(normalizedUsers),
    totalRecords: normalizedUsers.length,
    activeCount,
    pendingCount,
    blockedCount,
    users: normalizedUsers,
  };
}

export function loadUsersFromRepository(): {
  users: UserProfile[];
  snapshot: UserPersistenceSnapshot;
} {
  try {
    if (typeof localStorage !== 'undefined') {
      const rawV3 = localStorage.getItem(USERS_REPOSITORY_STORAGE_KEY);
      if (rawV3) {
        const parsed = JSON.parse(rawV3) as Partial<UserPersistenceSnapshot>;
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          const snapshot = buildUserPersistenceSnapshot(
            parsed.users,
            parsed.updatedAt || '11/10/2026 11:45'
          );
          return { users: snapshot.users, snapshot };
        }
      }

      const rawLegacy = localStorage.getItem(LEGACY_USERS_STORAGE_KEY);
      if (rawLegacy) {
        const parsedLegacy = JSON.parse(rawLegacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0 && parsedLegacy[0].login) {
          const snapshot = buildUserPersistenceSnapshot(parsedLegacy);
          return { users: snapshot.users, snapshot };
        }
      }
    }
  } catch {
    // fallback to seed users
  }

  const fallbackSnapshot = buildUserPersistenceSnapshot(INITIAL_USERS);
  return {
    users: fallbackSnapshot.users,
    snapshot: fallbackSnapshot,
  };
}

export function saveUsersToRepository(
  users: UserProfile[],
  updatedAt = '11/10/2026 11:45'
): UserPersistenceSnapshot {
  const snapshot = buildUserPersistenceSnapshot(users, updatedAt);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(USERS_REPOSITORY_STORAGE_KEY, JSON.stringify(snapshot));
      localStorage.setItem(LEGACY_USERS_STORAGE_KEY, JSON.stringify(snapshot.users));
    }
  } catch {
    // ignore storage quota errors
  }
  return snapshot;
}

export function serializeUsersPersistenceJson(
  users: UserProfile[],
  updatedAt = '11/10/2026 11:45'
): string {
  const snapshot = buildUserPersistenceSnapshot(users, updatedAt);
  return JSON.stringify(snapshot, null, 2);
}

export function deserializeUsersPersistenceJson(rawJson: string): {
  ok: boolean;
  message: string;
  users?: UserProfile[];
  snapshot?: UserPersistenceSnapshot;
} {
  try {
    const parsed = JSON.parse(rawJson);
    const candidateUsers: unknown[] | null = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.users)
      ? parsed.users
      : null;

    if (!candidateUsers || candidateUsers.length === 0) {
      return {
        ok: false,
        message: 'O JSON informado não contém uma lista válida de usuários.',
      };
    }

    const validUsers: UserProfile[] = [];
    for (const item of candidateUsers) {
      if (!item || typeof item !== 'object') continue;
      const u = item as Partial<UserProfile>;
      if (!u.id || !u.login || !u.name) continue;
      validUsers.push(
        enrichUserWithPersistenceMetadata({
          id: String(u.id),
          name: String(u.name),
          shortName: String(u.shortName || u.name),
          login: String(u.login),
          email: String(u.email || `${u.login}@enigma.com`),
          password: String(u.password || 'op123'),
          passwordHash: u.passwordHash,
          passwordUpdatedAt: u.passwordUpdatedAt ?? null,
          mustChangePassword: Boolean(u.mustChangePassword),
          status:
            u.status === 'ativo' || u.status === 'pendente' || u.status === 'bloqueado'
              ? u.status
              : 'pendente',
          role:
            u.role === 'admin' || u.role === 'operador' || u.role === 'socio'
              ? u.role
              : 'operador',
          companyId: String(u.companyId || 'enigma_grupo'),
          profitSharePercent: Number(u.profitSharePercent) || 0,
          initialMonthlyBalance: Number(u.initialMonthlyBalance) || 0,
          phone: u.phone ? String(u.phone) : '',
          registrationNotes: u.registrationNotes ? String(u.registrationNotes) : '',
          createdAt: u.createdAt || '11/10/2026 11:45',
          approvedAt: u.approvedAt ?? null,
          approvedBy: u.approvedBy ?? null,
          lastLoginAt: u.lastLoginAt ?? null,
        })
      );
    }

    if (validUsers.length === 0) {
      return {
        ok: false,
        message: 'Nenhum registro de usuário válido foi encontrado no payload.',
      };
    }

    // Ensure at least one active admin exists
    const hasActiveAdmin = validUsers.some(
      (u) => u.role === 'admin' && u.status === 'ativo'
    );
    if (!hasActiveAdmin) {
      const defaultAdmin = INITIAL_USERS.find((u) => u.id === 'admin');
      if (defaultAdmin) {
        validUsers.unshift(enrichUserWithPersistenceMetadata(defaultAdmin));
      }
    }

    const snapshot = buildUserPersistenceSnapshot(validUsers);
    return {
      ok: true,
      message: `${snapshot.totalRecords} usuário(s) carregado(s) na estrutura de persistência com sucesso.`,
      users: snapshot.users,
      snapshot,
    };
  } catch {
    return {
      ok: false,
      message: 'Formato JSON inválido para importação de usuários.',
    };
  }
}

export function loadExportRequestsFromRepository(): ExportRequestRecord[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(EXPORT_REQUESTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveExportRequestsToRepository(requests: ExportRequestRecord[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(EXPORT_REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    }
  } catch {
    // ignore
  }
}
