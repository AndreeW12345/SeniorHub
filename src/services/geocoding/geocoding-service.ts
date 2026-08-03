import { buildFullAddress } from '@/utils/address-format';
import { resolveCoordinates } from '@/services/geocoding/resolve-coordinates';

export type GeocodeAddressInput = {
  street: string;
  postalCode: string;
  city: string;
};

export type GeocodeAddressSuccess = {
  fullAddress: string;
  latitude: number;
  longitude: number;
};

export type GeocodeAddressResult =
  | ({ ok: true } & GeocodeAddressSuccess)
  | { ok: false; errorMessage: string };

/**
 * Central geocoding entry point for SeniorHub activities.
 * Builds `fullAddress` and resolves coordinates via the platform geocoder
 * (Expo Location on native, Nominatim on web).
 */
export async function geocodeAddress(
  input: GeocodeAddressInput,
): Promise<GeocodeAddressResult> {
  const street = input.street.trim();
  const postalCode = input.postalCode.trim();
  const city = input.city.trim();

  if (!street) {
    return { ok: false, errorMessage: 'Ange gatuadress.' };
  }

  if (!postalCode) {
    return { ok: false, errorMessage: 'Ange postnummer.' };
  }

  if (!city) {
    return { ok: false, errorMessage: 'Ange ort.' };
  }

  const fullAddress = buildFullAddress(street, postalCode, city);
  const query = `${fullAddress}, Sverige`;

  const resolved = await resolveCoordinates({ query });

  if (!resolved.ok) {
    return resolved;
  }

  return {
    ok: true,
    fullAddress,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
  };
}
