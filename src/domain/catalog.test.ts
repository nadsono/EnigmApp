import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addCatalogCriterionPure,
  deleteCatalogCriterionPure,
  getActiveBankNames,
  getActiveHouseNames,
  INITIAL_BANK_CATALOG,
  INITIAL_CUSTOM_CRITERIA,
  INITIAL_HOUSE_CATALOG,
  removeBankCatalogItemPure,
  removeHouseCatalogItemPure,
  toggleBankCatalogActivePure,
  toggleHouseCatalogActivePure,
  upsertBankCatalogItemPure,
  upsertHouseCatalogItemPure,
} from './catalog.ts';
import { buildCatalogPersistenceSnapshot } from '../database/catalogRepository.ts';
import {
  buildCleanProductionState,
  PROJECT_DATABASE_BOOT_MODE,
} from '../database/systemMaintenance.ts';

test('house catalog manager supports adding, editing, deactivating, and removing houses with custom attributes', () => {
  const initialCount = INITIAL_HOUSE_CATALOG.length;

  const added = upsertHouseCatalogItemPure(INITIAL_HOUSE_CATALOG, {
    name: 'Novibet',
    cloneGroup: 'Sem clones',
    category: 'Europeia',
    verificationPolicy: 'Facial semanal',
    defaultMinStake: 25,
    withdrawLeadTime: 'PIX Imediato',
    notes: 'Nova casa homologada na operação',
    customValues: {
      licenca_regulacao: 'SPA/MF Brasil (.bet.br)',
      perfil_limitacao: 'Moderada',
      url_operacional: 'https://novibet.bet.br',
    },
  });

  assert.equal(added.ok, true);
  assert.equal(added.houses.length, initialCount + 1);
  assert.equal(added.item?.name, 'Novibet');
  assert.equal(added.item?.customValues.url_operacional, 'https://novibet.bet.br');
  assert.ok(getActiveHouseNames(added.houses).includes('Novibet'));

  // Rejects duplicate house name
  const duplicate = upsertHouseCatalogItemPure(added.houses, { name: 'novibet' });
  assert.equal(duplicate.ok, false);

  // Deactivate house (retirar de circulação mantendo histórico)
  const toggled = toggleHouseCatalogActivePure(added.houses, added.item!.id);
  assert.equal(toggled.ok, true);
  assert.equal(toggled.item?.active, false);
  assert.equal(getActiveHouseNames(toggled.houses).includes('Novibet'), false);

  // Remove house from catalog
  const removed = removeHouseCatalogItemPure(toggled.houses, added.item!.id);
  assert.equal(removed.ok, true);
  assert.equal(removed.houses.length, initialCount);
});

test('bank catalog manager supports adding, editing, deactivating, and removing banks with custom attributes', () => {
  const initialCount = INITIAL_BANK_CATALOG.length;

  const added = upsertBankCatalogItemPure(INITIAL_BANK_CATALOG, {
    name: 'BTG Pactual',
    compeCode: '208',
    accountType: 'Conta Digital PF',
    pixKeyTypes: 'CPF, E-mail, Celular',
    dailyPixLimit: 40000,
    transferFeeDefault: 0,
    devicePolicy: 'App no celular da parceria',
    notes: 'Banco de alto limite para parcerias consolidadas',
    customValues: {
      exige_facial_transacao: 'Apenas acima do limite',
      limite_pix_noturno: '10000',
      gerente_suporte: 'Canal VIP 24h',
    },
  });

  assert.equal(added.ok, true);
  assert.equal(added.banks.length, initialCount + 1);
  assert.equal(added.item?.name, 'BTG Pactual');
  assert.equal(added.item?.compeCode, '208');
  assert.equal(added.item?.customValues.gerente_suporte, 'Canal VIP 24h');
  assert.ok(getActiveBankNames(added.banks).includes('BTG Pactual'));

  // Toggle active status
  const toggled = toggleBankCatalogActivePure(added.banks, added.item!.id);
  assert.equal(toggled.ok, true);
  assert.equal(toggled.item?.active, false);
  assert.equal(getActiveBankNames(toggled.banks).includes('BTG Pactual'), false);

  // Remove bank
  const removed = removeBankCatalogItemPure(toggled.banks, added.item!.id);
  assert.equal(removed.ok, true);
  assert.equal(removed.banks.length, initialCount);
});

test('custom criteria builder adds and propagates new criteria across houses and banks', () => {
  const addedHouseCrit = addCatalogCriterionPure(
    INITIAL_CUSTOM_CRITERIA,
    INITIAL_HOUSE_CATALOG,
    INITIAL_BANK_CATALOG,
    {
      target: 'casa',
      label: 'Provedor de Odds',
      fieldType: 'selecao',
      options: ['Próprio', 'Kambi', 'BetConstruct', 'Altenar'],
      defaultValue: 'Próprio',
      description: 'Motor de cotações utilizado pela casa',
    }
  );

  assert.equal(addedHouseCrit.ok, true);
  assert.equal(addedHouseCrit.criterion?.key, 'provedor_de_odds');
  assert.equal(addedHouseCrit.houses[0].customValues.provedor_de_odds, 'Próprio');

  const addedBankCrit = addCatalogCriterionPure(
    addedHouseCrit.criteria,
    addedHouseCrit.houses,
    addedHouseCrit.banks,
    {
      target: 'banco',
      label: 'Exige Token Físico / SMS',
      fieldType: 'texto',
      defaultValue: 'Apenas Push no App',
    }
  );

  assert.equal(addedBankCrit.ok, true);
  assert.equal(addedBankCrit.banks[0].customValues.exige_token_fisico_sms, 'Apenas Push no App');

  const snapshot = buildCatalogPersistenceSnapshot(
    addedBankCrit.houses,
    addedBankCrit.banks,
    addedBankCrit.criteria
  );
  assert.ok(snapshot.checksum.startsWith('cat:'));
  assert.equal(snapshot.customCriteriaCount, INITIAL_CUSTOM_CRITERIA.length + 2);

  const afterDel = deleteCatalogCriterionPure(
    addedBankCrit.criteria,
    addedBankCrit.criterion!.id
  );
  assert.equal(afterDel.ok, true);
  assert.equal(afterDel.criteria.length, INITIAL_CUSTOM_CRITERIA.length + 1);
});

test('systemMaintenance isolates Clean Production Base mode and preserves admin and catalog while clearing demo data', () => {
  assert.equal(PROJECT_DATABASE_BOOT_MODE, 'default');

  const cleanBundle = buildCleanProductionState({
    currentHouseCatalog: INITIAL_HOUSE_CATALOG,
    currentBankCatalog: INITIAL_BANK_CATALOG,
    currentCustomCriteria: INITIAL_CUSTOM_CRITERIA,
  });

  assert.equal(cleanBundle.mode, 'production_clean');
  assert.equal(cleanBundle.users.length, 1);
  assert.equal(cleanBundle.users[0].role, 'admin');
  assert.equal(cleanBundle.partnerships.length, 0);
  assert.equal(cleanBundle.houseAccounts.length, 0);
  assert.equal(cleanBundle.bankAccounts.length, 0);
  assert.equal(cleanBundle.entries.length, 0);
  assert.equal(cleanBundle.withdrawals.length, 0);
  assert.equal(cleanBundle.costs.length, 0);
  assert.equal(cleanBundle.houseCatalog.length, INITIAL_HOUSE_CATALOG.length);
  assert.equal(cleanBundle.bankCatalog.length, INITIAL_BANK_CATALOG.length);
});
