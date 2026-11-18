import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('geocoding client T3 — no direct Nominatim', () => {
  it('geocoding-service delegates to callable wrapper', () => {
    const source = readFileSync(
      resolve(rootDir, 'src/services/geocoding/geocoding-service.ts'),
      'utf8',
    );
    assert.match(source, /callGeocodeActivityPlace/);
    assert.doesNotMatch(source, /searchNominatimSweden/);
    assert.doesNotMatch(source, /nominatim\.openstreetmap\.org/);
  });

  it('nominatim-geocode does not perform HTTP fetch', () => {
    const source = readFileSync(
      resolve(rootDir, 'src/services/geocoding/nominatim-geocode.ts'),
      'utf8',
    );
    assert.doesNotMatch(source, /fetch\s*\(/);
    assert.doesNotMatch(source, /nominatim\.openstreetmap\.org/);
  });

  it('searchNominatimSweden throws when invoked', async () => {
    const moduleUrl = pathToFileURL(
      resolve(rootDir, 'src/services/geocoding/nominatim-geocode.ts'),
    ).href;
    const { searchNominatimSweden } = await import(moduleUrl);
    await assert.rejects(
      () => searchNominatimSweden('Tyresö centrum, Tyresö, Sverige'),
      /inaktiverade/i,
    );
  });

  it('callable wrapper targets geocodeActivityPlace', () => {
    const source = readFileSync(
      resolve(rootDir, 'src/services/geocoding/geocode-activity-place-callable.ts'),
      'utf8',
    );
    assert.match(source, /geocodeActivityPlace/);
    assert.match(source, /prepareCallableRequest/);
  });
});