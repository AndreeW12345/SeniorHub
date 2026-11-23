import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

import {
  requestGoogleGeocodeFromApi,
  mapGoogleAddressComponents,
  parseGoogleGeocodeResults,
} from '../lib/geocoding/google-geocoding-outbound.js';
import { DEFAULT_GEOCODE_CONFIG } from '../lib/geocoding/geocode-types.js';

describe('google geocoding response parsing', () => {
  it('maps Swedish address components for city matching', () => {
    const address = mapGoogleAddressComponents([
      { long_name: 'Tyresö', types: ['postal_town'] },
      { long_name: 'Tyresö kommun', types: ['administrative_area_level_2'] },
      { long_name: 'Stockholms län', types: ['administrative_area_level_1'] },
      { long_name: '135 38', types: ['postal_code'] },
    ]);

    assert.equal(address?.city, 'Tyresö');
    assert.equal(address?.municipality, 'Tyresö kommun');
    assert.equal(address?.county, 'Stockholms län');
  });

  it('parses formatted coordinates from results', () => {
    const hits = parseGoogleGeocodeResults([
      {
        formatted_address: 'Tyresö Centrum, Bollmoravägen, Tyresö, Sverige',
        geometry: { location: { lat: 59.2437149, lng: 18.2304311 } },
        address_components: [
          { long_name: 'Tyresö', types: ['postal_town'] },
          { long_name: 'Tyresö kommun', types: ['administrative_area_level_2'] },
        ],
      },
    ]);

    assert.equal(hits.length, 1);
    assert.equal(hits[0].latitude, 59.2437149);
    assert.equal(hits[0].longitude, 18.2304311);
    assert.match(hits[0].displayName, /Tyresö/);
  });

  it('returns empty list for missing results', () => {
    assert.deepEqual(parseGoogleGeocodeResults(undefined), []);
  });
});

describe('requestGoogleGeocodeFromApi', () => {
  it('returns no hits for ZERO_RESULTS', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      async json() {
        return { status: 'ZERO_RESULTS', results: [] };
      },
    }));

    try {
      const hits = await requestGoogleGeocodeFromApi(
        DEFAULT_GEOCODE_CONFIG,
        'Tyresö centrum, Tyresö, Sverige',
        5,
        'test-key',
      );
      assert.deepEqual(hits, []);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('throws on REQUEST_DENIED', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      async json() {
        return { status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid.' };
      },
    }));

    try {
      await assert.rejects(
        () =>
          requestGoogleGeocodeFromApi(
            DEFAULT_GEOCODE_CONFIG,
            'Tyresö centrum, Tyresö, Sverige',
            5,
            'bad-key',
          ),
        /REQUEST_DENIED/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('parses successful geocode responses', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () => ({
      ok: true,
      async json() {
        return {
          status: 'OK',
          results: [
            {
              formatted_address: 'Tyresö Centrum, Sverige',
              geometry: { location: { lat: 59.24, lng: 18.23 } },
              address_components: [
                { long_name: 'Tyresö', types: ['postal_town'] },
                { long_name: 'Tyresö kommun', types: ['administrative_area_level_2'] },
              ],
            },
          ],
        };
      },
    }));

    try {
      const hits = await requestGoogleGeocodeFromApi(
        DEFAULT_GEOCODE_CONFIG,
        'Tyresö centrum, Sverige',
        5,
        'test-key',
      );
      assert.equal(hits.length, 1);
      assert.equal(hits[0].latitude, 59.24);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});