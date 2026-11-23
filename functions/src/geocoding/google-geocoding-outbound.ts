import { readGeocodeCache, writeGeocodeCache } from './geocode-cache';
import { reserveNominatimOutboundSlot } from './nominatim-rate-limit';
import type { GeocodeConfig, GeocodeSearchHit } from './geocode-types';

const GOOGLE_GEOCODE_FETCH_TIMEOUT_MS = 15_000;

type GoogleAddressComponent = {
  long_name?: string;
  short_name?: string;
  types?: string[];
};

type GoogleGeocodeResult = {
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  address_components?: GoogleAddressComponent[];
};

type GoogleGeocodeResponse = {
  status?: string;
  results?: GoogleGeocodeResult[];
  error_message?: string;
};

function hasType(component: GoogleAddressComponent, type: string): boolean {
  return Array.isArray(component.types) && component.types.includes(type);
}

export function mapGoogleAddressComponents(
  components: GoogleAddressComponent[] | undefined,
): Record<string, string> | undefined {
  if (!Array.isArray(components) || components.length === 0) {
    return undefined;
  }

  const address: Record<string, string> = {};

  for (const component of components) {
    const longName = component.long_name?.trim();
    if (!longName) {
      continue;
    }

    if (hasType(component, 'locality')) {
      address.city = longName;
    } else if (hasType(component, 'postal_town') && !address.city) {
      address.city = longName;
    } else if (hasType(component, 'administrative_area_level_2')) {
      address.municipality = longName;
    } else if (hasType(component, 'administrative_area_level_1')) {
      address.county = longName;
    } else if (hasType(component, 'postal_code')) {
      address.postalCode = longName;
    } else if (
      (hasType(component, 'sublocality') || hasType(component, 'sublocality_level_1')) &&
      !address.suburb
    ) {
      address.suburb = longName;
    }
  }

  return Object.keys(address).length > 0 ? address : undefined;
}

export function parseGoogleGeocodeResults(
  results: GoogleGeocodeResult[] | undefined,
): GeocodeSearchHit[] {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((result) => {
      const latitude = result.geometry?.location?.lat;
      const longitude = result.geometry?.location?.lng;
      if (typeof latitude !== 'number' || !Number.isFinite(latitude)) {
        return null;
      }
      if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
        return null;
      }

      return {
        latitude,
        longitude,
        displayName: result.formatted_address?.trim() ?? '',
        ...(result.address_components
          ? { address: mapGoogleAddressComponents(result.address_components) }
          : {}),
      } satisfies GeocodeSearchHit;
    })
    .filter((hit): hit is GeocodeSearchHit => hit !== null);
}

function geocodeStatusError(status: string, errorMessage?: string): Error {
  const detail = errorMessage?.trim() ? ` (${errorMessage.trim()})` : '';
  return new Error(`Google Geocoding svarade med status ${status}${detail}`);
}

/** HTTP call to Google Geocoding API only (no cache / rate limit) — for unit tests. */
export async function requestGoogleGeocodeFromApi(
  config: GeocodeConfig,
  query: string,
  limit: number,
  apiKey: string,
): Promise<GeocodeSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    address: trimmed,
    key: apiKey,
    region: 'se',
    components: 'country:SE',
    language: 'sv',
  });

  const url = `${config.baseUrl}?${params.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_GEOCODE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Google Geocoding svarade med HTTP ${response.status}`);
    }

    const payload = (await response.json()) as GoogleGeocodeResponse;
    const status = payload.status?.trim() ?? 'UNKNOWN';

    if (status === 'OK') {
      return parseGoogleGeocodeResults(payload.results).slice(0, limit);
    }

    if (status === 'ZERO_RESULTS') {
      return [];
    }

    throw geocodeStatusError(status, payload.error_message);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGoogleGeocodeUncached(
  config: GeocodeConfig,
  query: string,
  limit: number,
  apiKey: string,
): Promise<GeocodeSearchHit[]> {
  await reserveNominatimOutboundSlot();
  return requestGoogleGeocodeFromApi(config, query, limit, apiKey);
}

export async function searchGoogleGeocodeSwedenServer(
  config: GeocodeConfig,
  query: string,
  limit = 5,
  apiKey: string,
): Promise<GeocodeSearchHit[]> {
  const cached = await readGeocodeCache(config, query);
  if (cached) {
    return cached.slice(0, limit);
  }

  const hits = await fetchGoogleGeocodeUncached(config, query, limit, apiKey);
  if (hits.length > 0) {
    await writeGeocodeCache(config, query, hits);
  }

  return hits.slice(0, limit);
}