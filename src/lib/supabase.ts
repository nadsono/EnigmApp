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

function offlineHealth(): SupabaseDatabaseHealth {
  return {
    status: 'offline',
    database: 'not_configured',
    provider: 'not_configured',
    region: '',
    tablesCount: 0,
    usersCount: 0,
    housesCount: 0,
    banksCount: 0,
    timestamp: new Date().toISOString(),
  };
}

export async function fetchSupabaseHealth(): Promise<SupabaseDatabaseHealth> {
  if (!isDirectSupabaseConfigured) return offlineHealth();

  try {
    const res = await fetch('/api/health');
    if (!res.ok) return offlineHealth();
    const health = (await res.json()) as SupabaseDatabaseHealth;
    return health.status === 'ok' ? health : offlineHealth();
  } catch {
    return offlineHealth();
  }
}

/**
 * Database sync is disabled until an authenticated, authorized server-side
 * write path is implemented. The demo remains local and synthetic.
 */
export async function syncUsersToSupabasePostgres(_users: UserProfile[]): Promise<{
  ok: boolean;
  syncedCount: number;
}> {
  return { ok: false, syncedCount: 0 };
}

/** Catalog sync is disabled while the connected backend is not configured. */
export async function syncCatalogToSupabasePostgres(_payload: {
  houses: HouseCatalogItem[];
  banks: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
}): Promise<{ ok: boolean }> {
  return { ok: false };
}
