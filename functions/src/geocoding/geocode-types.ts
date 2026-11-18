export type GeocodeAddressInput = {
  placeName: string;
  city: string;
  street?: string;
  postalCode?: string;
};

export type GeocodeAddressSuccess = {
  fullAddress: string;
  latitude: number;
  longitude: number;
};

export type GeocodeAddressResult =
  | ({ ok: true } & GeocodeAddressSuccess)
  | { ok: false; errorMessage: string };

export type NominatimGeocodeHit = {
  latitude: number;
  longitude: number;
  displayName: string;
  address?: Record<string, string>;
};

export type GeocodeConfig = {
  provider: string;
  baseUrl: string;
  userAgent: string;
  referer: string;
  cacheVersion: number;
  contactUrl: string;
};

export const DEFAULT_GEOCODE_CONFIG: GeocodeConfig = {
  provider: 'nominatim',
  baseUrl: 'https://nominatim.openstreetmap.org/search',
  userAgent: 'SeniorHub/1.0 (activity-address-geocoding; contact: https://seniorhub.se/)',
  referer: 'https://seniorhub.se/',
  cacheVersion: 1,
  contactUrl: 'https://seniorhub.se/',
};