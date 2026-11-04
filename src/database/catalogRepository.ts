import {
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
} from '../domain/catalog.ts';
import type {
  BankCatalogItem,
  CatalogCustomCriterion,
  CatalogPersistenceSnapshot,
  HouseCatalogItem,
} from '../domain/types.ts';

export const CATALOG_REPOSITORY_STORAGE_KEY = 'enigma_catalog_repository_crypto_v2_2';
export const CATALOG_SCHEMA_VERSION = 3;

function computeCatalogChecksum(
  houses: HouseCatalogItem[],
  banks: BankCatalogItem[],
  criteria: CatalogCustomCriterion[]
): string {
  const payload = JSON.stringify({
    h: houses.map((x) => `${x.id}:${x.name}:${x.active}:${x.cloneGroup}:${JSON.stringify(x.customValues)}`),
    b: banks.map((x) => `${x.id}:${x.name}:${x.active}:${x.compeCode}:${JSON.stringify(x.customValues)}`),
    c: criteria.map((x) => `${x.id}:${x.target}:${x.key}:${x.fieldType}`),
  });
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return `cat:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildCatalogPersistenceSnapshot(
  houses: HouseCatalogItem[],
  banks: BankCatalogItem[],
  customCriteria: CatalogCustomCriterion[],
  updatedAt = '11/10/2026 12:00'
): CatalogPersistenceSnapshot {
  return {
    schemaVersion: CATALOG_SCHEMA_VERSION,
    driver: 'localStorage+sql',
    storageKey: CATALOG_REPOSITORY_STORAGE_KEY,
    updatedAt,
    checksum: computeCatalogChecksum(houses, banks, customCriteria),
    housesCount: houses.length,
    activeHousesCount: houses.filter((h) => h.active).length,
    banksCount: banks.length,
    activeBanksCount: banks.filter((b) => b.active).length,
    customCriteriaCount: customCriteria.length,
    houses,
    banks,
    customCriteria,
  };
}

export function loadCatalogFromRepository(): {
  houses: HouseCatalogItem[];
  banks: BankCatalogItem[];
  customCriteria: CatalogCustomCriterion[];
  snapshot: CatalogPersistenceSnapshot;
} {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CATALOG_REPOSITORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          Array.isArray(parsed.houses) &&
          parsed.houses.length > 0 &&
          Array.isArray(parsed.banks) &&
          parsed.banks.length > 0
        ) {
          const customCriteria = Array.isArray(parsed.customCriteria)
            ? parsed.customCriteria
            : INITIAL_CUSTOM_CRITERIA;
          const snapshot = buildCatalogPersistenceSnapshot(
            parsed.houses,
            parsed.banks,
            customCriteria,
            parsed.updatedAt || '11/10/2026 12:00'
          );
          return {
            houses: parsed.houses,
            banks: parsed.banks,
            customCriteria,
            snapshot,
          };
        }
      }
    }
  } catch {
    // ignore storage read errors
  }

  const snapshot = buildCatalogPersistenceSnapshot(
    INITIAL_HOUSE_CATALOG,
    INITIAL_BANK_CATALOG,
    INITIAL_CUSTOM_CRITERIA
  );
  return {
    houses: INITIAL_HOUSE_CATALOG,
    banks: INITIAL_BANK_CATALOG,
    customCriteria: INITIAL_CUSTOM_CRITERIA,
    snapshot,
  };
}

export function saveCatalogToRepository(
  houses: HouseCatalogItem[],
  banks: BankCatalogItem[],
  customCriteria: CatalogCustomCriterion[],
  updatedAt = '11/10/2026 12:00'
): CatalogPersistenceSnapshot {
  const snapshot = buildCatalogPersistenceSnapshot(
    houses,
    banks,
    customCriteria,
    updatedAt
  );
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CATALOG_REPOSITORY_STORAGE_KEY, JSON.stringify(snapshot));
    }
  } catch {
    // ignore storage quota errors
  }
  return snapshot;
}
