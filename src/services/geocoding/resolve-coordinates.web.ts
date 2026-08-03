import type {
  ResolveCoordinatesInput,
  ResolveCoordinatesResult,
} from '@/services/geocoding/resolve-coordinates';

export type { ResolveCoordinatesInput, ResolveCoordinatesResult };

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

type NominatimResult = {
  lat: string;
  lon: string;
};

/**
 * Web geocoding via OpenStreetMap Nominatim (Expo web compatible).
 * Keep User-Agent identifiable per Nominatim usage policy.
 */
export async function resolveCoordinates(
  input: ResolveCoordinatesInput,
): Promise<ResolveCoordinatesResult> {
  const query = input.query.trim();

  if (!query) {
    return { ok: false, errorMessage: 'Ange en adress att söka efter.' };
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'se',
      'accept-language': 'sv',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SeniorHub/1.0 (activity-address-geocoding)',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        errorMessage: 'Kunde inte hämta koordinater just nu. Försök igen.',
      };
    }

    const results = (await response.json()) as NominatimResult[];

    if (!Array.isArray(results) || results.length === 0) {
      return {
        ok: false,
        errorMessage:
          'Adressen kunde inte hittas. Kontrollera gata, postnummer och ort och försök igen.',
      };
    }

    const latitude = Number(results[0].lat);
    const longitude = Number(results[0].lon);

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
