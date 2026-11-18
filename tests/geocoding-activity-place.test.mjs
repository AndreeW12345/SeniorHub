import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildActivityGeocodeQuery,
  buildActivityStoredFullAddress,
} from '../src/utils/activity-place-address.ts';
import {
  isValidSwedishPostalCode,
  formatSwedishPostalCode,
  validatePostalCodeInput,
} from '../src/utils/swedish-postal-code.ts';
import {
  selectReliableGeocodeHit,
  isWithinDistanceOfAnchor,
} from '../src/services/geocoding/geocode-quality.ts';
import {
  parseCoordinateInput,
  validateActivityCoordinates,
} from '../src/utils/activity-coordinates.ts';
function hasActivityCoordinates(activity) {
  return (
    typeof activity.latitude === 'number' &&
    typeof activity.longitude === 'number' &&
    Number.isFinite(activity.latitude) &&
    Number.isFinite(activity.longitude)
  );
}

function getActivitiesWithCoordinates(activities) {
  return activities.filter(hasActivityCoordinates);
}

const TYRESON_ANCHOR = { latitude: 59.2390408, longitude: 18.3073536 };
const KALMAR_HIT = {
  latitude: 56.6628826,
  longitude: 16.3662382,
  displayName: 'Kalmar, Kalmar kommun, Kalmar län, 392 31, Sverige',
  address: {
    city: 'Kalmar',
    municipality: 'Kalmar kommun',
  },
};
const TYRESON_CENTRUM_HIT = {
  latitude: 59.2437149,
  longitude: 18.2304311,
  displayName: 'Tyresö Centrum, Bollmoravägen, Bollmora, Tyresö kommun, Stockholms län, 135 38, Sverige',
  address: {
    municipality: 'Tyresö kommun',
    city: 'Tyresö',
  },
};

function shouldGeocodePlace(placeChanged, hasExistingCoordinates) {
  return placeChanged || !hasExistingCoordinates;
}

function resolveOptionalActivityCoordinates(latitudeRaw, longitudeRaw) {
  const latitudeText = latitudeRaw?.trim() ?? '';
  const longitudeText = longitudeRaw?.trim() ?? '';
  if (!latitudeText && !longitudeText) {
    return { latitude: null, longitude: null, errorMessage: null };
  }
  const latitude = parseCoordinateInput(latitudeText);
  const longitude = parseCoordinateInput(longitudeText);
  const coordinateError = validateActivityCoordinates(latitude, longitude);
  if (coordinateError) {
    return { latitude: null, longitude: null, errorMessage: coordinateError };
  }
  if (latitude === null || longitude === null) {
    return {
      latitude: null,
      longitude: null,
      errorMessage: 'Ange både latitud och longitud, eller lämna båda tomma.',
    };
  }
  return { latitude, longitude, errorMessage: null };
}

describe('geocoding activity place', () => {
  it('builds query for Tyresö centrum without street or postal', () => {
    const query = buildActivityGeocodeQuery({
      placeName: 'Tyresö centrum',
      city: 'Tyresö',
    });
    assert.equal(query, 'Tyresö centrum, Tyresö, Sverige');
  });

  it('builds query with five-digit postal 13540', () => {
    const query = buildActivityGeocodeQuery({
      placeName: 'Tyresö centrum',
      city: 'Tyresö',
      postalCode: '13540',
    });
    assert.equal(query, 'Tyresö centrum, 135 40, Tyresö, Sverige');
  });

  it('rejects invalid postal code 135', () => {
    assert.equal(isValidSwedishPostalCode('135'), false);
    assert.equal(validatePostalCodeInput('135'), 'Postnummer måste bestå av fem siffror.');
  });

  it('accepts formatted Swedish postal code', () => {
    assert.equal(isValidSwedishPostalCode('135 40'), true);
    assert.equal(formatSwedishPostalCode('13540'), '135 40');
    assert.equal(validatePostalCodeInput('13540'), null);
  });

  it('rejects geocode hit far from city anchor (Kalmar vs Tyresö)', () => {
    const within = isWithinDistanceOfAnchor(KALMAR_HIT, TYRESON_ANCHOR);
    assert.equal(within, false);

    const picked = selectReliableGeocodeHit('Tyresö', [KALMAR_HIT], TYRESON_ANCHOR);
    assert.equal(picked, null);
  });

  it('accepts a reliable hit in Tyresö', () => {
    const picked = selectReliableGeocodeHit('Tyresö', [TYRESON_CENTRUM_HIT], TYRESON_ANCHOR);
    assert.ok(picked);
    assert.equal(picked.latitude, TYRESON_CENTRUM_HIT.latitude);
  });

  it('returns null when no geocode hits match city', () => {
    const picked = selectReliableGeocodeHit('Tyresö', [], TYRESON_ANCHOR);
    assert.equal(picked, null);
  });

  it('builds stored address for place-only input', () => {
    assert.equal(
      buildActivityStoredFullAddress({
        placeName: 'Tyresö centrum',
        city: 'Tyresö',
      }),
      'Tyresö centrum, Tyresö',
    );
  });

  it('allows creating activity document without coordinates', () => {
    const coordinates = resolveOptionalActivityCoordinates('', '');
    assert.equal(coordinates.errorMessage, null);
    assert.equal(coordinates.latitude, null);
    assert.equal(coordinates.longitude, null);
  });

  it('still maps activities with coordinates for the map', () => {
    const withCoords = {
      id: '1',
      title: 'Kartaktivitet',
      description: 'd',
      date: '2099-01-01',
      time: '10:00',
      location: 'Tyresö centrum',
      organizer: 'Org',
      category: 'Fika',
      latitude: 59.2437149,
      longitude: 18.2304311,
    };

    assert.equal(hasActivityCoordinates(withCoords), true);
    assert.equal(getActivitiesWithCoordinates([withCoords]).length, 1);
  });

  it('excludes activities without coordinates from the map list', () => {
    const withoutCoords = {
      id: '2',
      title: 'Utan karta',
      description: 'd',
      date: '2099-01-01',
      time: '10:00',
      location: 'Tyresö centrum',
      organizer: 'Org',
      category: 'Fika',
      latitude: null,
      longitude: null,
    };

    assert.equal(hasActivityCoordinates(withoutCoords), false);
    assert.equal(getActivitiesWithCoordinates([withoutCoords]).length, 0);
  });

  it('re-geocodes when place description changes on edit', () => {
    assert.equal(shouldGeocodePlace(true, true), true);
    assert.equal(shouldGeocodePlace(true, false), true);
    assert.equal(shouldGeocodePlace(false, false), true);
    assert.equal(shouldGeocodePlace(false, true), false);
  });
});