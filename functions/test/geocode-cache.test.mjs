import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildGeocodeCacheDocId,
  normalizeGeocodeQueryForCache,
} from '../lib/geocoding/geocode-cache.js';

describe('geocode cache helpers', () => {
  it('normalizes whitespace and casing consistently', () => {
    assert.equal(
      normalizeGeocodeQueryForCache('  Tyresö   centrum,  Tyresö,  Sverige  '),
      normalizeGeocodeQueryForCache('tyresö centrum, tyresö, sverige'),
    );
  });

  it('builds stable cache keys for same input', () => {
    const config = { provider: 'nominatim', cacheVersion: 1 };
    const query = 'tyresö centrum, tyresö, sverige';
    const first = buildGeocodeCacheDocId(config, query);
    const second = buildGeocodeCacheDocId(config, query);
    assert.equal(first, second);
  });

  it('changes cache key when cacheVersion changes', () => {
    const query = 'tyresö centrum, tyresö, sverige';
    const v1 = buildGeocodeCacheDocId({ provider: 'nominatim', cacheVersion: 1 }, query);
    const v2 = buildGeocodeCacheDocId({ provider: 'nominatim', cacheVersion: 2 }, query);
    assert.notEqual(v1, v2);
  });
});