import { createHash } from 'crypto';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

import type { GeocodeConfig } from './geocode-types';
import type { GeocodeSearchHit } from './geocode-types';

export const GEOCODE_CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const GEOCODE_CACHE_COLLECTION = 'geocodeCache';

export type GeocodeCacheRecord = {
  hits: GeocodeSearchHit[];
  cachedAtMs: number;
  expiresAtMs: number;
};

export function normalizeGeocodeQueryForCache(query: string): string {
  return query
    .trim()
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('sv-SE');
}

export function buildGeocodeCacheDocId(
  config: Pick<GeocodeConfig, 'provider' | 'cacheVersion'>,
  normalizedQuery: string,
): string {
  const raw = `${config.provider}|${config.cacheVersion}|${normalizedQuery}`;
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

export async function readGeocodeCache(
  config: Pick<GeocodeConfig, 'provider' | 'cacheVersion'>,
  query: string,
): Promise<GeocodeSearchHit[] | null> {
  const normalizedQuery = normalizeGeocodeQueryForCache(query);
  const docId = buildGeocodeCacheDocId(config, normalizedQuery);
  const snapshot = await getFirestore().collection(GEOCODE_CACHE_COLLECTION).doc(docId).get();
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Partial<GeocodeCacheRecord> | undefined;
  const expiresAtMs = data?.expiresAtMs;
  if (typeof expiresAtMs !== 'number' || expiresAtMs <= Date.now()) {
    return null;
  }

  const hits = data?.hits;
  if (!Array.isArray(hits) || hits.length === 0) {
    return null;
  }

  return hits.filter(
    (hit): hit is GeocodeSearchHit =>
      typeof hit === 'object' &&
      hit !== null &&
      typeof hit.latitude === 'number' &&
      typeof hit.longitude === 'number' &&
      typeof hit.displayName === 'string',
  );
}

export async function writeGeocodeCache(
  config: Pick<GeocodeConfig, 'provider' | 'cacheVersion'>,
  query: string,
  hits: GeocodeSearchHit[],
): Promise<void> {
  if (hits.length === 0) {
    return;
  }

  const normalizedQuery = normalizeGeocodeQueryForCache(query);
  const docId = buildGeocodeCacheDocId(config, normalizedQuery);
  const now = Date.now();

  await getFirestore()
    .collection(GEOCODE_CACHE_COLLECTION)
    .doc(docId)
    .set({
      hits,
      normalizedQuery,
      cachedAtMs: now,
      expiresAtMs: now + GEOCODE_CACHE_TTL_MS,
      provider: config.provider,
      cacheVersion: config.cacheVersion,
      updatedAt: FieldValue.serverTimestamp(),
    });
}