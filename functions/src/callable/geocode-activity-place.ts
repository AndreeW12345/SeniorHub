import { onCall, HttpsError } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { GOOGLE_GEOCODING_API_KEY } from '../config/secrets';
import { loadGeocodeConfig } from '../geocoding/geocode-config';
import { geocodeActivityPlaceCore } from '../geocoding/geocode-activity-place-core';
import { createGeocodeSearch } from '../geocoding/resolve-geocode-search';
import type { GeocodeAddressInput, GeocodeAddressResult } from '../geocoding/geocode-types';
import { assertActivityGeocoderAccess } from '../utils/assert-activity-geocoder-access';

type GeocodeActivityPlaceRequest = {
  placeName?: unknown;
  city?: unknown;
  street?: unknown;
  postalCode?: unknown;
};

function readStringField(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readGeocodeInput(payload: GeocodeActivityPlaceRequest): GeocodeAddressInput {
  return {
    placeName: readStringField(payload.placeName),
    city: readStringField(payload.city),
    street: readStringField(payload.street),
    postalCode: readStringField(payload.postalCode),
  };
}

export const geocodeActivityPlace = onCall(
  europeWest1CallableOptions({ timeoutSeconds: 55, secrets: [GOOGLE_GEOCODING_API_KEY] }),
  async (request): Promise<GeocodeAddressResult> => {
    const uid = request.auth?.uid?.trim();
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Du måste vara inloggad.');
    }

    await assertActivityGeocoderAccess(uid);

    const payload = (request.data ?? {}) as GeocodeActivityPlaceRequest;
    const input = readGeocodeInput(payload);

    const searchGeocode = createGeocodeSearch(GOOGLE_GEOCODING_API_KEY.value());

    return geocodeActivityPlaceCore(
      input,
      { uid },
      {
        loadConfig: loadGeocodeConfig,
        searchGeocode,
      },
    );
  },
);