const EARTH_RADIUS_KM = 6371;
export const MAX_GEOCODE_DISTANCE_FROM_CITY_KM = 60;

export type GeocodeCoordinate = {
  latitude: number;
  longitude: number;
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(a: GeocodeCoordinate, b: GeocodeCoordinate): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function foldSwedishDiacritics(value: string): string {
  return value
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o');
}

function normalizeCityToken(value: string): string {
  return foldSwedishDiacritics(
    value
      .trim()
      .toLowerCase()
      .replace(/\s+kommun$/i, '')
      .replace(/\s+/g, ' '),
  );
}

export function cityNamesMatch(expectedCity: string, candidate: string): boolean {
  const expected = normalizeCityToken(expectedCity);
  const actual = normalizeCityToken(candidate);
  if (!expected || !actual) {
    return false;
  }
  return expected === actual || actual.includes(expected) || expected.includes(actual);
}

export function nominatimResultMatchesCity(
  expectedCity: string,
  displayName: string,
  address?: Record<string, string>,
): boolean {
  const tokens = [
    address?.city,
    address?.town,
    address?.municipality,
    address?.village,
    address?.hamlet,
    address?.suburb,
    address?.county,
    displayName,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return tokens.some((token) => cityNamesMatch(expectedCity, token));
}

export function isWithinDistanceOfAnchor(
  result: GeocodeCoordinate,
  anchor: GeocodeCoordinate,
  maxKm = MAX_GEOCODE_DISTANCE_FROM_CITY_KM,
): boolean {
  return haversineDistanceKm(result, anchor) <= maxKm;
}

export function selectReliableGeocodeHit(
  expectedCity: string,
  hits: Array<GeocodeCoordinate & { displayName: string; address?: Record<string, string> }>,
  cityAnchor: GeocodeCoordinate | null,
): (GeocodeCoordinate & { displayName: string }) | null {
  for (const hit of hits) {
    const matchesCity = nominatimResultMatchesCity(expectedCity, hit.displayName, hit.address);
    if (!matchesCity) {
      continue;
    }

    if (cityAnchor && !isWithinDistanceOfAnchor(hit, cityAnchor)) {
      continue;
    }

    return hit;
  }

  return null;
}