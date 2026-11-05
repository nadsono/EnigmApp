import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_CRYPTO_NETWORKS,
  addCryptoNetwork,
  buildCryptoRouteMetadata,
  getCryptoNetworkOptions,
  parseCryptoNetworkCatalog,
  persistCryptoNetworkCatalog,
  serializeCryptoNetworkCatalog,
  toggleCryptoNetwork,
} from './cryptoNetworks.ts';

test('catalog keeps the seven networks separate and custom inactive networks survive persistence', () => {
  assert.deepEqual(INITIAL_CRYPTO_NETWORKS.map((network) => network.name), [
    'Ethereum', 'BNB Smart Chain', 'Polygon', 'Avalanche', 'Arbitrum', 'Optimism', 'Tron',
  ]);
  const added = addCryptoNetwork(INITIAL_CRYPTO_NETWORKS, { name: 'Rede de teste', tokenStandard: 'Padrão manual' }, 'custom_test');
  assert.equal(added.error, null);
  const inactive = toggleCryptoNetwork(added.networks, 'custom_test');
  const parsed = parseCryptoNetworkCatalog(serializeCryptoNetworkCatalog(inactive));
  assert.equal(parsed.issue, null);
  assert.equal(parsed.networks.find((network) => network.id === 'custom_test')?.active, false);
  assert.equal(parsed.networks.find((network) => network.id === 'custom_test')?.tokenStandard, 'Padrão manual');
  assert.equal(addCryptoNetwork(parsed.networks, { name: '  rede de TESTE ' }, 'duplicate').error !== null, true);
});

test('empty and corrupted storage never selects a default route or silently accepts damaged data', () => {
  assert.equal(parseCryptoNetworkCatalog(null).networks.length, 7);
  assert.equal(parseCryptoNetworkCatalog(null).issue, null);
  assert.ok(parseCryptoNetworkCatalog('{bad').issue);
  assert.ok(parseCryptoNetworkCatalog(JSON.stringify({ version: 99, networks: [] })).issue);
  assert.ok(parseCryptoNetworkCatalog(JSON.stringify({ version: 1, networks: [{ id: 'bad', active: true }] })).issue);
  assert.equal(buildCryptoRouteMetadata(INITIAL_CRYPTO_NETWORKS, '', '', false), undefined);
});

test('unknown and inactive selected values remain selectable without being replaced', () => {
  const legacy = 'Arbitrum / Optimism';
  const options = getCryptoNetworkOptions(INITIAL_CRYPTO_NETWORKS, legacy);
  assert.equal(options.find((option) => option.value === legacy)?.legacy, true);
  assert.equal(getCryptoNetworkOptions(INITIAL_CRYPTO_NETWORKS, '')[0].value, '');
  const inactive = toggleCryptoNetwork(INITIAL_CRYPTO_NETWORKS, 'polygon');
  assert.equal(getCryptoNetworkOptions(inactive, '').some((option) => option.value === 'Polygon'), false);
  assert.equal(getCryptoNetworkOptions(inactive, 'Polygon').find((option) => option.value === 'Polygon')?.inactive, true);
});

test('route stores a snapshot and confirms compatibility only on explicit manual confirmation', () => {
  const route = buildCryptoRouteMetadata(INITIAL_CRYPTO_NETWORKS, 'Polygon', ' usdt ', false);
  assert.deepEqual(route, { networkId: 'polygon', networkName: 'Polygon', assetSymbol: 'USDT', compatibility: 'unknown' });
  const unknown = buildCryptoRouteMetadata(INITIAL_CRYPTO_NETWORKS, 'Rede legada', '', true, '2026-11-05T15:00:00.000Z');
  assert.deepEqual(unknown, { networkId: null, networkName: 'Rede legada', compatibility: 'confirmed_manually', compatibilityCheckedAt: '2026-11-05T15:00:00.000Z' });
  assert.equal(route?.networkName, 'Polygon');
});

test('storage failures are reported and do not claim the catalog was saved', () => {
  let saved = '';
  assert.equal(persistCryptoNetworkCatalog({ setItem: (_key, value) => { saved = value; } }, INITIAL_CRYPTO_NETWORKS), null);
  assert.equal(parseCryptoNetworkCatalog(saved).networks.length, 7);
  assert.ok(persistCryptoNetworkCatalog({ setItem: () => { throw new Error('quota'); } }, INITIAL_CRYPTO_NETWORKS));
});
