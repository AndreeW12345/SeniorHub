/** Parses a manually entered coordinate string, or null when empty/invalid. */
export function parseCoordinateInput(value: string | undefined): number | null {
  if (!value?.trim()) {
    return null;
  }

  const normalized = value.trim().replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

/** Validates optional latitude/longitude pairs for activity forms. */
export function validateActivityCoordinates(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude === null && longitude === null) {
    return null;
  }

  if (latitude === null || longitude === null) {
    return 'Ange både latitud och longitud, eller lämna båda tomma.';
  }

  if (latitude < -90 || latitude > 90) {
    return 'Latitud måste vara mellan -90 och 90.';
  }

  if (longitude < -180 || longitude > 180) {
    return 'Longitud måste vara mellan -180 och 180.';
  }

  return null;
}

/** Default map region used when no activity coordinates are available yet. */
export const DEFAULT_MAP_REGION = {
  latitude: 59.23,
  longitude: 17.98,
  latitudeDelta: 0.18,
  longitudeDelta: 0.18,
} as const;
