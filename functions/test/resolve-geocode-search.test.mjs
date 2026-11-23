import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createGeocodeSearch } from '../lib/geocoding/resolve-geocode-search.js';
import { DEFAULT_GEOCODE_CONFIG, LEGACY_NOMINATIM_GEOCODE_CONFIG } from '../lib/geocoding/geocode-types.js';

describe('createGeocodeSearch', () => {
  it('rejects Google provider when API key is missing', async () => {
    const search = createGeocodeSearch(undefined);
    await assert.rejects(
      () => search(DEFAULT_GEOCODE_CONFIG, 'Tyresö, Sverige', 1),
      /API-nyckel saknas/,
    );
  });

  it('selects nominatim provider without reading Google secret', () => {
    const search = createGeocodeSearch(undefined);
    assert.equal(typeof search, 'function');
    assert.equal(LEGACY_NOMINATIM_GEOCODE_CONFIG.provider, 'nominatim');
  });
});