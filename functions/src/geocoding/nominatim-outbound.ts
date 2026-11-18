import { readGeocodeCache, writeGeocodeCache } from './geocode-cache';
import { reserveNominatimOutboundSlot } from './nominatim-rate-limit';
import type { GeocodeConfig } from './geocode-types';
import type { NominatimGeocodeHit } from './geocode-types';

type NominatimJsonHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: Record<string, string>;
};

const NOMINATIM_FETCH_TIMEOUT_MS = 15_000;

function parseNominatimJson(results: NominatimJsonHit[]): NominatimGeocodeHit[] {
  if (!Array.isArray(results)) {
    return [];
  }

  return results
    .map((hit) => {
      const latitude = Number(hit.lat);
      const longitude = Number(hit.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      const parsed: NominatimGeocodeHit = {
        latitude,
        longitude,
        displayName: hit.display_name?.trim() ?? '',
        ...(hit.address ? { address: hit.address } : {}),
      };
      return parsed;
    })
    .filter((hit): hit is NominatimGeocodeHit => hit !== null);
}

async function fetchNominatimUncached(
  config: GeocodeConfig,
  query: string,
  limit: number,
): Promise<NominatimGeocodeHit[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    format: 'jsonv2',
    limit: String(limit),
    countrycodes: 'se',
    'accept-language': 'sv',
    addressdetails: '1',
  });

  await reserveNominatimOutboundSlot();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NOMINATIM_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': config.userAgent,
        Referer: config.referer,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Nominatim svarade med HTTP ${response.status}`);
    }

    const results = (await response.json()) as NominatimJsonHit[];
    return parseNominatimJson(results);
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchNominatimSwedenServer(
  config: GeocodeConfig,
  query: string,
  limit = 5,
): Promise<NominatimGeocodeHit[]> {
  const cached = await readGeocodeCache(config, query);
  if (cached) {
    return cached.slice(0, limit);
  }

  const hits = await fetchNominatimUncached(config, query, limit);
  if (hits.length > 0) {
    await writeGeocodeCache(config, query, hits);
  }

  return hits.slice(0, limit);
}