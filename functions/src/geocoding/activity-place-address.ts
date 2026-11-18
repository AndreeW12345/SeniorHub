import { formatSwedishPostalCode } from './swedish-postal-code';

export type ActivityPlaceParts = {
  placeName: string;
  city: string;
  street?: string;
  postalCode?: string;
};

function normalizePart(part: string): string {
  return part.trim();
}

function partsEqual(a: string, b: string): boolean {
  return normalizePart(a).localeCompare(normalizePart(b), 'sv-SE', { sensitivity: 'accent' }) === 0;
}

/** Builds the stored/display full address from place description and optional street/postal. */
export function buildActivityStoredFullAddress(parts: ActivityPlaceParts): string {
  const placeName = normalizePart(parts.placeName);
  const city = normalizePart(parts.city);
  const street = normalizePart(parts.street ?? '');
  const postal =
    parts.postalCode?.trim() && /^\d{5}$/.test(parts.postalCode.replace(/\s+/g, ''))
      ? formatSwedishPostalCode(parts.postalCode)
      : '';

  const labelParts: string[] = [];
  if (placeName) {
    labelParts.push(placeName);
  }
  if (street && !partsEqual(street, placeName)) {
    labelParts.push(street);
  }

  if (postal) {
    const prefix = labelParts.length > 0 ? `${labelParts.join(', ')}, ` : '';
    return `${prefix}${postal} ${city}`.trim();
  }

  if (labelParts.length > 0 && city) {
    return `${labelParts.join(', ')}, ${city}`;
  }

  return labelParts.join(', ') || city;
}

/** Query string for Sweden-focused geocoding (Nominatim). */
export function buildActivityGeocodeQuery(parts: ActivityPlaceParts): string {
  const placeName = normalizePart(parts.placeName);
  const city = normalizePart(parts.city);
  const street = normalizePart(parts.street ?? '');
  const postal =
    parts.postalCode?.trim() && /^\d{5}$/.test(parts.postalCode.replace(/\s+/g, ''))
      ? formatSwedishPostalCode(parts.postalCode)
      : '';

  const segments: string[] = [];
  if (placeName) {
    segments.push(placeName);
  }
  if (street && !partsEqual(street, placeName)) {
    segments.push(street);
  }
  if (postal) {
    segments.push(postal);
  }
  if (city) {
    segments.push(city);
  }
  segments.push('Sverige');

  return segments.join(', ');
}