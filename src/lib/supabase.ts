import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  BankCatalogItem,
  CatalogCustomCriterion,
  HouseCatalogItem,
  UserProfile,
} from '../domain/types.ts';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isDirectSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.includes('your-supabase-anon')
);

export const supabaseClient: SupabaseClient | null = isDirectSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface SupabaseDatabaseHealth {
  status: 'ok' | 'offline';
  database: string;
  provider: string;
  region: string;
  tablesCount: number;
  usersCount: number;
  housesCount: number;
  banksCount: number;
  timestamp: string;
}

export async function fetchSupabaseHealth(): Promise<SupabaseDatabaseHealth> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch {
    return {
      status: 'offline',
      database: 'postgresql_supabase',
      provider: 'supabase_postgres',
      region: 'us-west2',
      tablesCount: 19,
      usersCount: 0,
      housesCount: 0,
      banksCount: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function syncUsersToSupabasePostgres(users: UserProfile[]): Promise<{
  ok: boolean;
  syncedCount: number;
}> {
  try {
    if (supabaseClient) {
      const rows = users.map((u) => ({
        id: u.id,
        name: u.name,
        short_name: u.shortName,
        login: u.login,
        email: u.email,
        password_hash: u.passwordHash || 'sha256:default',
        password_plain_fallback: u.password || null,
        password_updated_at: u.passwordUpdatedAt || null,
        must_change_password: Boolean(u.mustChangePassword),
        role: u.role,
        status: u.status,
        company_id: u.companyId || 'enigma_grupo',
        profit_share_percent: u.profitSharePercent,
        initial_monthly_balance: u.initialMonthlyBalance,
        phone: u.phone || null,
        registration_notes: u.registrationNotes || null,
        created_at: u.createdAt,
        approved_at: u.approvedAt || null,
        approved_by: u.approvedBy || null,
        last_login_at: u.lastLoginAt || null,
      }));
      const { error } = await supabaseClient.from('users').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
    }

    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
    if (!res.ok) throw new Error('Sync failed');
    const data = await res.json();
    return { ok: true, syncedCount: data.syncedCount ?? users.length };
  } catch {
    return { ok: false, syncedCount: 0 };
  }
}

export async function syncCatalogToSupabasePostgres(payload: {
  houses: HouseCatalogItem[];
  banks: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
}): Promise<{ ok: boolean }> {
  try {
    const res = await fetch('/api/catalog/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
