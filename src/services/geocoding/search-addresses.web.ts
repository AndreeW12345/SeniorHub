import type { AddressSuggestion, SearchAddressesResult } from '@/services/geocoding/search-addresses';

export type { AddressSuggestion, SearchAddressesResult };

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

/** Web fallback using OpenStreetMap Nominatim (fetch-based, Expo web compatible). */
export async function searchAddresses(query: string): Promise<SearchAddressesResult> {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return { ok: true, suggestions: [] };
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      limit: '5',
      countrycodes: 'se',
      'accept-language': 'sv',
    });

    const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SeniorHub/1.0',
      },
    });

    if (!response.ok) {
      return { ok: false, errorMessage: 'Kunde inte söka efter adressen just nu. Försök igen.' };
    }

    const results = (await response.json()) as NominatimResult[];
    const suggestions: AddressSuggestion[] = results
      .map((result) => {
        const latitude = Number(result.lat);
        const longitude = Number(result.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null;
        }

        return {
          id: String(result.place_id),
          label: result.display_name,
          latitude,
          longitude,
        };
      })
      .filter((suggestion): suggestion is AddressSuggestion => suggestion !== null);

    return { ok: true, suggestions };
  } catch (error) {
    console.error('[SeniorHub] Adresssökning misslyckades:', error);
    return {
      ok: false,
      errorMessage: 'Kunde inte söka efter adressen just nu. Försök igen.',
    };
  }
}
