import { getFirestore } from 'firebase-admin/firestore';

import {
  DEFAULT_GEOCODE_CONFIG,
  LEGACY_NOMINATIM_GEOCODE_CONFIG,
  type GeocodeConfig,
  type GeocodeProvider,
} from './geocode-types';

const SYSTEM_GEOCODING_DOC = 'system/geocoding';

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function readCacheVersion(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number.parseInt(value.trim(), 10);
    return parsed >= 1 ? parsed : fallback;
  }
  return fallback;
}

export function mergeGeocodeConfig(
  data: Record<string, unknown> | undefined,
): GeocodeConfig {
  const base = DEFAULT_GEOCODE_CONFIG;
  const contactUrl = readString(data?.contactUrl, base.contactUrl);
  const customUserAgent = readString(data?.userAgent, '');

  const providerRaw = readString(data?.provider, base.provider);
  const provider: GeocodeProvider =
    providerRaw === 'nominatim' ? 'nominatim' : 'google';
  const providerDefaults =
    provider === 'nominatim' ? LEGACY_NOMINATIM_GEOCODE_CONFIG : DEFAULT_GEOCODE_CONFIG;

  const configuredBaseUrl = readString(data?.baseUrl, providerDefaults.baseUrl);
  const baseUrl =
    provider === 'google' && configuredBaseUrl.includes('nominatim.openstreetmap.org')
      ? providerDefaults.baseUrl
      : configuredBaseUrl;

  return {
    provider,
    baseUrl,
    userAgent:
      customUserAgent.length > 0
        ? customUserAgent
        : `SeniorHub/1.0 (activity-address-geocoding; contact: ${contactUrl})`,
    referer: readString(data?.referer, base.referer),
    cacheVersion: readCacheVersion(data?.cacheVersion, base.cacheVersion),
    contactUrl,
  };
}

/** Reads geocoding provider configuration from Firestore with documented defaults. */
export async function loadGeocodeConfig(): Promise<GeocodeConfig> {
  const snapshot = await getFirestore().doc(SYSTEM_GEOCODING_DOC).get();
  if (!snapshot.exists) {
    return { ...DEFAULT_GEOCODE_CONFIG };
  }

  return mergeGeocodeConfig(snapshot.data() as Record<string, unknown> | undefined);
}