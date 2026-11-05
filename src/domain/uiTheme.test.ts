import test from 'node:test';
import assert from 'node:assert/strict';
import { appearanceStorageKey, DEFAULT_APPEARANCE, getHouseColorTheme, normalizeAppearancePreferences, parseAppearancePreferences, serializeAppearancePreferences } from './uiTheme.ts';

test('appearance defaults tolerate missing, invalid and unsupported stored values', () => {
  for (const raw of [null, '{broken', '{"version":99,"preferences":{"theme":"dark"}}']) {
    assert.deepEqual(parseAppearancePreferences(raw), DEFAULT_APPEARANCE);
  }
  assert.deepEqual(normalizeAppearancePreferences({ theme: 'invalid', density: true, houseColors: 1 }), DEFAULT_APPEARANCE);
});
test('appearance choices round-trip independently from user and anonymous scopes', () => {
  const dark = { theme: 'dark', density: 'compact', houseColors: 'brand' } as const;
  assert.deepEqual(parseAppearancePreferences(serializeAppearancePreferences(dark)), dark);
  const scopes = [null, 'operator:a', 'operator:b', 'anonymous'].map(appearanceStorageKey);
  assert.equal(new Set(scopes).size, scopes.length);
});
test('unknown house appearance is neutral and custom identity colors remain explicit', () => {
  assert.equal(getHouseColorTheme('Unknown A').primary, getHouseColorTheme('Unknown B').primary);
  assert.equal(getHouseColorTheme('Unknown A', undefined, '#2563EB').primary.toLowerCase(), '#2563eb');
});
