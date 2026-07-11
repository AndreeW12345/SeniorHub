const SWEDISH_COUNTRY_NAMES = new Set(['sweden', 'sverige']);

const STREET_PATTERN =
  /\d|(?:^|\s)(?:gatan|vägen|väg|gränd|plan|torg|allé|alle|stig|backe|torget)(?:\s|$)/i;

function normalizePart(part: string): string {
  return part.trim();
}

function isPostalCode(part: string): boolean {
  return /^\d{3}\s?\d{2}$/.test(normalizePart(part));
}

function isCountry(part: string): boolean {
  return SWEDISH_COUNTRY_NAMES.has(normalizePart(part).toLowerCase());
}

function isCounty(part: string): boolean {
  const lower = normalizePart(part).toLowerCase();
  return lower.endsWith(' län') || lower.endsWith(' county') || lower.endsWith(' region');
}

function isStreet(part: string): boolean {
  return STREET_PATTERN.test(normalizePart(part));
}

function stripKommunSuffix(part: string): string {
  const match = /^(.+?)\s+kommun$/i.exec(normalizePart(part));
  return match ? match[1].trim() : normalizePart(part);
}

function partsEqual(a: string, b: string): boolean {
  return normalizePart(a).localeCompare(normalizePart(b), 'sv-SE', { sensitivity: 'accent' }) === 0;
}

function dedupeParts(parts: string[]): string[] {
  return parts.filter((part, index) => {
    const normalized = normalizePart(part).toLowerCase();
    return (
      parts.findIndex((candidate) => normalizePart(candidate).toLowerCase() === normalized) === index
    );
  });
}

function findMunicipality(parts: string[]): string | null {
  for (const part of parts) {
    if (/kommun$/i.test(normalizePart(part))) {
      return stripKommunSuffix(part);
    }
  }

  const nonStreets = parts.filter((part) => !isStreet(part));
  if (nonStreets.length > 0) {
    return stripKommunSuffix(nonStreets[nonStreets.length - 1]);
  }

  return parts.length > 0 ? stripKommunSuffix(parts[parts.length - 1]) : null;
}

function looksLikeGeocodedAddress(text: string): boolean {
  const parts = text.split(',').map(normalizePart).filter(Boolean);
  return parts.some((part) => isPostalCode(part) || isCountry(part) || isCounty(part));
}

/**
 * Shortens a stored geocoded address for display, e.g.
 * "Tyresö Centrum, Tyresövägen, 135 40, Tyresö, Stockholms län, Sweden"
 * → "Tyresö Centrum, Tyresö".
 *
 * Plain venue labels such as "Stadsparken, huvudentrén" are returned unchanged.
 */
export function formatAddressDisplay(text: string): string {
  const trimmed = text.trim();
  if (!trimmed || !looksLikeGeocodedAddress(trimmed)) {
    return trimmed;
  }

  const parts = dedupeParts(
    trimmed
      .split(',')
      .map(normalizePart)
      .filter((part) => part.length > 0 && !isPostalCode(part) && !isCountry(part) && !isCounty(part)),
  );

  if (parts.length === 0) {
    return trimmed;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const placeName = parts[0];
  const municipality = findMunicipality(parts.slice(1));

  if (!municipality || partsEqual(placeName, municipality)) {
    return placeName;
  }

  return `${placeName}, ${municipality}`;
}
