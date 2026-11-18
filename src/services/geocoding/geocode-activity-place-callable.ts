import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';

import type {
  GeocodeAddressInput,
  GeocodeAddressResult,
} from '@/services/geocoding/geocode-address-types';

/**
 * Forwards activity place geocoding to the server `geocodeActivityPlace` callable.
 */
export async function callGeocodeActivityPlace(
  input: GeocodeAddressInput,
): Promise<GeocodeAddressResult> {
  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<GeocodeAddressInput, GeocodeAddressResult>(
      prepared.functions,
      'geocodeActivityPlace',
    );

    const response = await callable({
      placeName: input.placeName.trim(),
      city: input.city.trim(),
      street: input.street?.trim() ?? '',
      postalCode: input.postalCode?.trim() ?? '',
    });

    const data = response.data;
    if (data && typeof data === 'object' && 'ok' in data) {
      return data;
    }

    return {
      ok: false,
      errorMessage: 'Kunde inte hämta koordinater just nu. Försök igen.',
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}