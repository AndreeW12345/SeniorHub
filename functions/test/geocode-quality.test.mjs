import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cityNamesMatch, selectReliableGeocodeHit } from '../lib/geocoding/geocode-quality.js';

describe('geocode city name matching', () => {
  it('matches ASCII and Swedish diacritics for the same municipality', () => {
    assert.equal(cityNamesMatch('Tyreso', 'Tyresö kommun'), true);
    assert.equal(cityNamesMatch('Goteborg', 'Göteborgs stad'), true);
  });

  it('selects a hit when city omits Swedish diacritics', () => {
    const hit = {
      latitude: 59.2437149,
      longitude: 18.2304311,
      displayName: 'Tyresö Centrum, Bollmoravägen, Tyresö kommun, Sverige',
      address: { municipality: 'Tyresö kommun' },
    };
    const anchor = { latitude: 59.216667, longitude: 18.333333 };

    const picked = selectReliableGeocodeHit('Tyreso', [hit], anchor);
    assert.ok(picked);
    assert.equal(picked.latitude, hit.latitude);
  });
});