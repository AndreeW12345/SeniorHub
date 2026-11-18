import { callGeocodeActivityPlace } from '@/services/geocoding/geocode-activity-place-callable';
import type {
  GeocodeAddressInput,
  GeocodeAddressResult,
} from '@/services/geocoding/geocode-address-types';
import { validatePostalCodeInput } from '@/utils/swedish-postal-code';

export type {
  GeocodeAddressInput,
  GeocodeAddressResult,
  GeocodeAddressSuccess,
} from '@/services/geocoding/geocode-address-types';

export { validatePostalCodeInput } from '@/utils/swedish-postal-code';
export { selectReliableGeocodeHit } from '@/services/geocoding/geocode-quality';

/**
 * Central geocoding entry point for SeniorHub activities.
 * Uses the `geocodeActivityPlace` Cloud Function (server-side Nominatim).
 */
export async function geocodeAddress(
  input: GeocodeAddressInput,
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

  return callGeocodeActivityPlace({ placeName, city, street, postalCode });
}