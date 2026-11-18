import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  detectGeocodePiiViolation,
  GEOCODE_PII_FAILURE_MESSAGE,
  hashGeocodeFieldValue,
  swedishPersonnummerLuhnValid,
} from '../lib/geocoding/geocode-pii.js';

describe('geocode PII filter', () => {
  it('allows normal activity place names and streets', () => {
    assert.deepEqual(
      detectGeocodePiiViolation({
        placeName: 'Tyresö centrum',
        city: 'Tyresö',
        street: 'Storgatan 12',
      }),
      { blocked: false },
    );
  });

  it('blocks email patterns', () => {
    const result = detectGeocodePiiViolation({
      placeName: 'kontakt@forening.se',
      city: 'Tyresö',
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, 'email');
  });

  it('blocks Swedish phone numbers', () => {
    const result = detectGeocodePiiViolation({
      placeName: 'Ring 070-123 45 67',
      city: 'Tyresö',
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, 'phone_or_digits');
  });

  it('allows five-digit postal code in postal field', () => {
    assert.deepEqual(
      detectGeocodePiiViolation({
        placeName: 'Tyresö centrum',
        city: 'Tyresö',
        postalCode: '13540',
      }),
      { blocked: false },
    );
  });

  it('blocks personnummer patterns', () => {
    assert.equal(swedishPersonnummerLuhnValid('8112289874'), true);

    const result = detectGeocodePiiViolation({
      placeName: '811228-9874',
      city: 'Tyresö',
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, 'personnummer');
  });

  it('blocks twelve consecutive digits', () => {
    const result = detectGeocodePiiViolation({
      placeName: '123456789012',
      city: 'Tyresö',
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, 'personnummer');
  });

  it('blocks overly long place names', () => {
    const result = detectGeocodePiiViolation({
      placeName: 'a'.repeat(121),
      city: 'Tyresö',
    });
    assert.equal(result.blocked, true);
    assert.equal(result.reason, 'max_length');
  });

  it('hashes values without exposing raw text', () => {
    const hash = hashGeocodeFieldValue('hemlig text');
    assert.equal(hash.length, 64);
    assert.notEqual(hash, 'hemlig text');
  });

  it('exposes neutral failure message constant', () => {
    assert.match(GEOCODE_PII_FAILURE_MESSAGE, /Kartpositionen/);
  });
});