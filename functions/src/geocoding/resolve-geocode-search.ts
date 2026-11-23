import { searchGoogleGeocodeSwedenServer } from './google-geocoding-outbound';
import { searchNominatimSwedenServer } from './nominatim-outbound';
import type { GeocodeConfig, GeocodeSearchHit } from './geocode-types';

export type GeocodeSearchFn = (
  config: GeocodeConfig,
  query: string,
  limit: number,
) => Promise<GeocodeSearchHit[]>;

/** Routes geocode queries to the configured provider; Google requires a server-side API key. */
export function createGeocodeSearch(apiKey: string | undefined): GeocodeSearchFn {
  return async (config, query, limit) => {
    if (config.provider === 'nominatim') {
      return searchNominatimSwedenServer(config, query, limit);
    }

    const trimmedKey = apiKey?.trim();
    if (!trimmedKey) {
      throw new Error('Google Geocoding API-nyckel saknas.');
    }

    return searchGoogleGeocodeSwedenServer(config, query, limit, trimmedKey);
  };
}