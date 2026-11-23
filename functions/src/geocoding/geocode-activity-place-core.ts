import {
  buildActivityGeocodeQuery,
  buildActivityStoredFullAddress,
  type ActivityPlaceParts,
} from './activity-place-address';
import {
  detectGeocodePiiViolation,
  GEOCODE_PII_FAILURE_MESSAGE,
  hashGeocodeFieldValue,
  type GeocodePiiFieldName,
} from './geocode-pii';
import {
  selectReliableGeocodeHit,
  type GeocodeCoordinate,
} from './geocode-quality';
import { validatePostalCodeInput } from './swedish-postal-code';
import type { GeocodeAddressInput, GeocodeAddressResult, GeocodeConfig } from './geocode-types';
import type { GeocodeSearchHit } from './geocode-types';

export type GeocodeActivityPlaceCoreDeps = {
  searchGeocode: (
    config: GeocodeConfig,
    query: string,
    limit: number,
  ) => Promise<GeocodeSearchHit[]>;
  loadConfig: () => Promise<GeocodeConfig>;
  logPiiBlocked?: (payload: {
    uid: string;
    field: GeocodePiiFieldName;
    reason: string;
    valueHash: string;
  }) => void;
};

export type GeocodeActivityPlaceCoreContext = {
  uid: string;
};

const DEFAULT_LOG_PII_BLOCKED: NonNullable<GeocodeActivityPlaceCoreDeps['logPiiBlocked']> = ({
  uid,
  field,
  reason,
  valueHash,
}) => {
  console.info('[SeniorHub] geocode pii_blocked', {
    uid,
    field,
    reason,
    valueHash,
  });
};

export async function geocodeActivityPlaceCore(
  input: GeocodeAddressInput,
  context: GeocodeActivityPlaceCoreContext,
  deps: GeocodeActivityPlaceCoreDeps,
): Promise<GeocodeAddressResult> {
  const placeName = input.placeName.trim();
  const city = input.city.trim();
  const street = input.street?.trim() ?? '';
  const postalCode = input.postalCode?.trim() ?? '';

  if (!placeName) {
    return { ok: false, errorMessage: 'Ange en platsbeskrivning.' };
  }

  if (!city) {
    return { ok: false, errorMessage: 'Ange ort.' };
  }

  const postalError = validatePostalCodeInput(postalCode);
  if (postalError) {
    return { ok: false, errorMessage: postalError };
  }

  const parts: ActivityPlaceParts = { placeName, city, street, postalCode };
  const piiResult = detectGeocodePiiViolation(parts);
  if (piiResult.blocked) {
    const blockedValue =
      piiResult.field === 'placeName'
        ? placeName
        : piiResult.field === 'street'
          ? street
          : piiResult.field === 'city'
            ? city
            : piiResult.field === 'postalCode'
              ? postalCode
              : buildActivityGeocodeQuery(parts);

    const logPiiBlocked = deps.logPiiBlocked ?? DEFAULT_LOG_PII_BLOCKED;
    logPiiBlocked({
      uid: context.uid,
      field: piiResult.field,
      reason: piiResult.reason,
      valueHash: hashGeocodeFieldValue(blockedValue),
    });

    return { ok: false, errorMessage: GEOCODE_PII_FAILURE_MESSAGE };
  }

  const config = await deps.loadConfig();
  const fullAddress = buildActivityStoredFullAddress(parts);
  const query = buildActivityGeocodeQuery(parts);

  let cityAnchor: GeocodeCoordinate | null = null;
  try {
    const anchorHits = await deps.searchGeocode(config, `${city}, Sverige`, 1);
    if (anchorHits[0]) {
      cityAnchor = {
        latitude: anchorHits[0].latitude,
        longitude: anchorHits[0].longitude,
      };
    }
  } catch (error) {
    console.warn('[SeniorHub] Stadens ankarpunkt kunde inte hämtas:', error);
  }

  let hits: GeocodeSearchHit[];
  try {
    hits = await deps.searchGeocode(config, query, 5);
  } catch (error) {
    console.error('[SeniorHub] Geocoding misslyckades:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte hämta koordinater just nu. Försök igen.',
    };
  }

  if (hits.length === 0) {
    return {
      ok: false,
      errorMessage:
        'Kartpositionen kunde inte fastställas säkert. Kontrollera plats och ort.',
    };
  }

  const reliable = selectReliableGeocodeHit(city, hits, cityAnchor);
  if (!reliable) {
    return {
      ok: false,
      errorMessage: GEOCODE_PII_FAILURE_MESSAGE,
    };
  }

  return {
    ok: true,
    fullAddress,
    latitude: reliable.latitude,
    longitude: reliable.longitude,
  };
}