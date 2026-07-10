export type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type SearchAddressesResult =
  | { ok: true; suggestions: AddressSuggestion[] }
  | { ok: false; errorMessage: string };

function buildSuggestionId(latitude: number, longitude: number, index: number): string {
  return `${latitude.toFixed(6)}-${longitude.toFixed(6)}-${index}`;
}

function formatPlaceLabel(
  place: {
    name?: string | null;
    street?: string | null;
    postalCode?: string | null;
    city?: string | null;
    region?: string | null;
    country?: string | null;
  },
  fallback: string,
): string {
  const parts = [place.name, place.street, place.postalCode, place.city, place.region, place.country]
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter((part, index, array) => part.length > 0 && array.indexOf(part) === index);

  return parts.length > 0 ? parts.join(', ') : fallback;
}

/** Searches for address suggestions using Expo Location geocoding. */
export async function searchAddresses(query: string): Promise<SearchAddressesResult> {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return { ok: true, suggestions: [] };
  }

  try {
    const Location = await import('expo-location');
    const results = await Location.geocodeAsync(trimmed);

    if (results.length === 0) {
      return { ok: true, suggestions: [] };
    }

    const suggestions = await Promise.all(
      results.slice(0, 5).map(async (result, index) => {
        let label = trimmed;

        try {
          const places = await Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude,
          });

          if (places[0]) {
            label = formatPlaceLabel(places[0], trimmed);
          }
        } catch {
          label = trimmed;
        }

        return {
          id: buildSuggestionId(result.latitude, result.longitude, index),
          label,
          latitude: result.latitude,
          longitude: result.longitude,
        };
      }),
    );

    return { ok: true, suggestions };
  } catch (error) {
    console.error('[SeniorHub] Adresssökning misslyckades:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte söka efter adressen just nu. Försök igen.',
    };
  }
}
