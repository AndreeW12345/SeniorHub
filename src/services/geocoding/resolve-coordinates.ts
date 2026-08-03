export type ResolveCoordinatesInput = {
  query: string;
};

export type ResolveCoordinatesResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; errorMessage: string };

/**
 * Resolves coordinates for a full address query using Expo Location.
 * Platform-specific: web uses Nominatim via `resolve-coordinates.web.ts`.
 */
export async function resolveCoordinates(
  input: ResolveCoordinatesInput,
): Promise<ResolveCoordinatesResult> {
  const query = input.query.trim();

  if (!query) {
    return { ok: false, errorMessage: 'Ange en adress att söka efter.' };
  }

  try {
    const Location = await import('expo-location');
    const results = await Location.geocodeAsync(query);

    if (results.length === 0) {
      return {
        ok: false,
        errorMessage:
          'Adressen kunde inte hittas. Kontrollera gata, postnummer och ort och försök igen.',
      };
    }

    const { latitude, longitude } = results[0];

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return {
        ok: false,
        errorMessage:
          'Adressen kunde inte hittas. Kontrollera gata, postnummer och ort och försök igen.',
      };
    }

    return { ok: true, latitude, longitude };
  } catch (error) {
    console.error('[SeniorHub] Geocoding misslyckades:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte hämta koordinater just nu. Försök igen.',
    };
  }
}
