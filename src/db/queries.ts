import { db } from './index.ts';
import {
  users,
  catalogHouses,
  catalogBanks,
  catalogCustomCriteria,
  betEntries,
  withdrawals,
  partnerships,
} from './schema.ts';
import { and, eq, ne, or, sql } from 'drizzle-orm';
import type {
  BankCatalogItem,
  CatalogCustomCriterion,
  HouseCatalogItem,
  UserProfile,
} from '../domain/types.ts';

export async function getDbUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('Database query failed (getDbUsers):', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function upsertDbUsers(userList: UserProfile[]) {
  try {
    for (const u of userList) {
      await db
        .delete(users)
        .where(
          and(
            ne(users.id, u.id),
            or(
              sql`lower(${users.login}) = lower(${u.login})`,
              sql`lower(${users.email}) = lower(${u.email})`
            )
          )
        );

      await db
        .insert(users)
        .values({
          id: u.id,
          name: u.name,
          shortName: u.shortName,
          login: u.login,
          email: u.email,
          passwordHash: u.passwordHash || 'sha256:default',
          role: u.role,
          status: u.status,
          companyId: u.companyId || 'enigma_grupo',
          profitSharePercent: String(u.profitSharePercent ?? 50),
          initialMonthlyBalance: String(u.initialMonthlyBalance ?? 0),
          phone: u.phone || null,
          registrationNotes: u.registrationNotes || null,
          createdAt: u.createdAt || new Date().toISOString(),
          approvedAt: u.approvedAt || null,
          approvedBy: u.approvedBy || null,
          lastLoginAt: u.lastLoginAt || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            name: u.name,
            shortName: u.shortName,
            login: u.login,
            email: u.email,
            passwordHash: u.passwordHash || 'sha256:default',
            role: u.role,
            status: u.status,
            profitSharePercent: String(u.profitSharePercent ?? 50),
            initialMonthlyBalance: String(u.initialMonthlyBalance ?? 0),
            phone: u.phone || null,
            registrationNotes: u.registrationNotes || null,
            approvedAt: u.approvedAt || null,
            approvedBy: u.approvedBy || null,
            lastLoginAt: u.lastLoginAt || null,
          },
        });
    }
    return { syncedCount: userList.length };
  } catch (error) {
    console.error('Database query failed (upsertDbUsers):', error);
    throw new Error('Database user sync failed.', { cause: error });
  }
}

export async function upsertDbCatalog(payload: {
  houses?: HouseCatalogItem[];
  banks?: BankCatalogItem[];
  customCriteria?: CatalogCustomCriterion[];
}) {
  try {
    if (payload.houses) {
      for (const h of payload.houses) {
        await db
          .delete(catalogHouses)
          .where(
            and(
              ne(catalogHouses.id, h.id),
              or(
                sql`lower(${catalogHouses.name}) = lower(${h.name})`,
                sql`lower(${catalogHouses.code}) = lower(${h.code})`
              )
            )
          );

        await db
          .insert(catalogHouses)
          .values({
            id: h.id,
            name: h.name,
            code: h.code,
            active: h.active,
            cloneGroup: h.cloneGroup,
            category: h.category,
            verificationPolicy: h.verificationPolicy,
            defaultMinStake: String(h.defaultMinStake ?? 10),
            withdrawLeadTime: h.withdrawLeadTime,
            notes: h.notes || null,
            customValuesJson: JSON.stringify(h.customValues || {}),
            updatedAt: h.updatedAt,
          })
          .onConflictDoUpdate({
            target: catalogHouses.id,
            set: {
              name: h.name,
              code: h.code,
              active: h.active,
              cloneGroup: h.cloneGroup,
              category: h.category,
              verificationPolicy: h.verificationPolicy,
              defaultMinStake: String(h.defaultMinStake ?? 10),
              withdrawLeadTime: h.withdrawLeadTime,
              notes: h.notes || null,
              customValuesJson: JSON.stringify(h.customValues || {}),
              updatedAt: h.updatedAt,
            },
          });
      }
    }

    if (payload.banks) {
      for (const b of payload.banks) {
        await db
          .delete(catalogBanks)
          .where(
            and(
              ne(catalogBanks.id, b.id),
              or(
                sql`lower(${catalogBanks.name}) = lower(${b.name})`,
                sql`lower(${catalogBanks.code}) = lower(${b.code})`
              )
            )
          );

        await db
          .insert(catalogBanks)
          .values({
            id: b.id,
            name: b.name,
            code: b.code,
            compeCode: b.compeCode,
            active: b.active,
            accountType: b.accountType,
            pixKeyTypes: b.pixKeyTypes,
            dailyPixLimit: String(b.dailyPixLimit ?? 20000),
            transferFeeDefault: String(b.transferFeeDefault ?? 0),
            devicePolicy: b.devicePolicy,
            notes: b.notes || null,
            customValuesJson: JSON.stringify(b.customValues || {}),
            updatedAt: b.updatedAt,
          })
          .onConflictDoUpdate({
            target: catalogBanks.id,
            set: {
              name: b.name,
              code: b.code,
              compeCode: b.compeCode,
              active: b.active,
              accountType: b.accountType,
              pixKeyTypes: b.pixKeyTypes,
              dailyPixLimit: String(b.dailyPixLimit ?? 20000),
              transferFeeDefault: String(b.transferFeeDefault ?? 0),
              devicePolicy: b.devicePolicy,
              notes: b.notes || null,
              customValuesJson: JSON.stringify(b.customValues || {}),
              updatedAt: b.updatedAt,
            },
          });
      }
    }

    if (payload.customCriteria) {
      for (const c of payload.customCriteria) {
        await db
          .delete(catalogCustomCriteria)
          .where(
            and(
              ne(catalogCustomCriteria.id, c.id),
              and(
                eq(catalogCustomCriteria.target, c.target),
                eq(catalogCustomCriteria.criterionKey, c.key)
              )
            )
          );

        await db
          .insert(catalogCustomCriteria)
          .values({
            id: c.id,
            target: c.target,
            criterionKey: c.key,
            label: c.label,
            fieldType: c.fieldType,
            optionsJson: JSON.stringify(c.options || []),
            defaultValue: c.defaultValue,
            description: c.description || null,
            required: c.required,
            createdAt: c.createdAt,
          })
          .onConflictDoUpdate({
            target: catalogCustomCriteria.id,
            set: {
              label: c.label,
              fieldType: c.fieldType,
              optionsJson: JSON.stringify(c.options || []),
              defaultValue: c.defaultValue,
              description: c.description || null,
              required: c.required,
            },
          });
      }
    }

    return { ok: true };
  } catch (error) {
    console.error('Database query failed (upsertDbCatalog):', error);
    throw new Error('Database catalog sync failed.', { cause: error });
  }
}

export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        id: `usr_${uid.slice(0, 8)}`,
        uid,
        email,
        name: email.split('@')[0] || 'Novo Usuário',
        shortName: email.split('@')[0] || 'Usuário',
        login: email.split('@')[0] || uid.slice(0, 8),
        passwordHash: 'firebase_oauth_managed',
        role: 'operador',
        status: 'pendente',
        companyId: 'enigma_grupo',
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          lastLoginAt: new Date().toISOString(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed (getOrCreateUser):', error);
    throw new Error('Database user sync failed.', { cause: error });
  }
}

export async function getDbCatalogHouses() {
  try {
    return await db.select().from(catalogHouses);
  } catch (error) {
    console.error('Database query failed (getDbCatalogHouses):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getDbCatalogBanks() {
  try {
    return await db.select().from(catalogBanks);
  } catch (error) {
    console.error('Database query failed (getDbCatalogBanks):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getDbCustomCriteria() {
  try {
    return await db.select().from(catalogCustomCriteria);
  } catch (error) {
    console.error('Database query failed (getDbCustomCriteria):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getDbPartnerships() {
  try {
    return await db.select().from(partnerships);
  } catch (error) {
    console.error('Database query failed (getDbPartnerships):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getDbBetEntries() {
  try {
    return await db.select().from(betEntries);
  } catch (error) {
    console.error('Database query failed (getDbBetEntries):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}

export async function getDbWithdrawals() {
  try {
    return await db.select().from(withdrawals);
  } catch (error) {
    console.error('Database query failed (getDbWithdrawals):', error);
    throw new Error('Database query failed.', { cause: error });
  }
}
