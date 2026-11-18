export type NominatimGeocodeHit = {
  latitude: number;
  longitude: number;
  displayName: string;
  address?: Record<string, string>;
};

/**
 * Client-side Nominatim access is disabled (T3). Geocoding runs via `geocodeAddress` → callable.
 */
export async function searchNominatimSweden(
  _query: string,
  _limit = 5,
): Promise<NominatimGeocodeHit[]> {
  throw new Error(
    'Direct Nominatim-anrop är inaktiverade i klienten. Använd geocodeAddress.',
  );
}