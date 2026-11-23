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

/** Normalized geocoding hit from any outbound provider (Google, legacy Nominatim). */
export type GeocodeSearchHit = {
  latitude: number;
  longitude: number;
  displayName: string;
  address?: Record<string, string>;
};

/** @deprecated Use GeocodeSearchHit */
export type NominatimGeocodeHit = GeocodeSearchHit;

export type GeocodeProvider = 'google' | 'nominatim';

export type GeocodeConfig = {
  provider: GeocodeProvider;
  baseUrl: string;
  userAgent: string;
  referer: string;
  cacheVersion: number;
  contactUrl: string;
};

export const DEFAULT_GEOCODE_CONFIG: GeocodeConfig = {
  provider: 'google',
  baseUrl: 'https://maps.googleapis.com/maps/api/geocode/json',
  userAgent: 'SeniorHub/1.0 (activity-address-geocoding; contact: https://seniorhub.se/)',
  referer: 'https://seniorhub.se/',
  cacheVersion: 2,
  contactUrl: 'https://seniorhub.se/',
};

export const LEGACY_NOMINATIM_GEOCODE_CONFIG: GeocodeConfig = {
  provider: 'nominatim',
  baseUrl: 'https://nominatim.openstreetmap.org/search',
  userAgent: DEFAULT_GEOCODE_CONFIG.userAgent,
  referer: DEFAULT_GEOCODE_CONFIG.referer,
  cacheVersion: 1,
  contactUrl: DEFAULT_GEOCODE_CONFIG.contactUrl,
};