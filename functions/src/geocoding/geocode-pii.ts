import { createHash } from 'crypto';

import { buildActivityGeocodeQuery } from './activity-place-address';
import type { ActivityPlaceParts } from './activity-place-address';

export const GEOCODE_PII_MAX_LENGTHS = {
  placeName: 120,
  street: 160,
  city: 80,
  geocodeQuery: 300,
} as const;

export type GeocodePiiFieldName = 'placeName' | 'street' | 'city' | 'postalCode' | 'geocodeQuery';

export type GeocodePiiBlock = {
  blocked: true;
  field: GeocodePiiFieldName;
  reason: string;
};

export type GeocodePiiCheckResult = GeocodePiiBlock | { blocked: false };

const EMAIL_PATTERN = /@[^\s@]+\.[^\s@]+/i;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function hasSwedishPhonePattern(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length === 0) {
    return false;
  }

  if (/^(\+?46|0)/.test(value.replace(/\s/g, ''))) {
    const normalized = digits.startsWith('46') ? digits : digits;
    if (normalized.length >= 10 && normalized.length <= 13) {
      return true;
    }
  }

  if (digits.length >= 10 && digits.length <= 13 && /^0/.test(value.trim())) {
    return true;
  }

  return false;
}

function hasEightOrMoreConsecutiveDigits(value: string, isPostalField: boolean): boolean {
  const trimmed = value.trim();
  if (isPostalField && /^\d{5}$/.test(trimmed.replace(/\s+/g, ''))) {
    return false;
  }

  return /\d{8,}/.test(value.replace(/[^\d]/g, ''));
}

function isPlausiblePersonnummerDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  return true;
}

function matchesPersonnummerPattern(value: string): boolean {
  const compact = value.replace(/\s/g, '');

  const tenDigit = compact.match(/^(\d{2})(\d{2})(\d{2})[-]?(\d{4})$/);
  if (tenDigit) {
    const y = Number(tenDigit[1]);
    const m = Number(tenDigit[2]);
    let d = Number(tenDigit[3]);
    if (d >= 61 && d <= 91) {
      d -= 60;
    }
    if (isPlausiblePersonnummerDate(y, m, d) && swedishPersonnummerLuhnValid(`${tenDigit[1]}${tenDigit[2]}${tenDigit[3]}${tenDigit[4]}`)) {
      return true;
    }
  }

  const twelveDigit = compact.match(/^(\d{4})(\d{2})(\d{2})[-]?(\d{4})$/);
  if (twelveDigit) {
    const y = Number(twelveDigit[1]) % 100;
    const m = Number(twelveDigit[2]);
    let d = Number(twelveDigit[3]);
    if (d >= 61 && d <= 91) {
      d -= 60;
    }
    if (isPlausiblePersonnummerDate(y, m, d)) {
      const lastTen = `${twelveDigit[2]}${twelveDigit[3]}${twelveDigit[4]}`;
      if (swedishPersonnummerLuhnValid(lastTen)) {
        return true;
      }
    }
  }

  return false;
}

export function swedishPersonnummerLuhnValid(tenDigits: string): boolean {
  if (!/^\d{10}$/.test(tenDigits)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    let digit = Number(tenDigits[index]);
    if (index % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === Number(tenDigits[9]);
}

function hasTwelveConsecutiveDigits(value: string): boolean {
  return /\d{12}/.test(digitsOnly(value));
}

function exceedsMaxLength(value: string, max: number): boolean {
  return value.trim().length > max;
}

function scanFieldForPii(
  field: GeocodePiiFieldName,
  value: string,
  options: { isPostalField?: boolean } = {},
): GeocodePiiCheckResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { blocked: false };
  }

  const isPostalField = options.isPostalField === true;

  if (EMAIL_PATTERN.test(trimmed)) {
    return { blocked: true, field, reason: 'email' };
  }

  if (matchesPersonnummerPattern(trimmed) || hasTwelveConsecutiveDigits(trimmed)) {
    return { blocked: true, field, reason: 'personnummer' };
  }

  if (hasSwedishPhonePattern(trimmed) || hasEightOrMoreConsecutiveDigits(trimmed, isPostalField)) {
    return { blocked: true, field, reason: 'phone_or_digits' };
  }

  const maxLength =
    field === 'placeName'
      ? GEOCODE_PII_MAX_LENGTHS.placeName
      : field === 'street'
        ? GEOCODE_PII_MAX_LENGTHS.street
        : field === 'city'
          ? GEOCODE_PII_MAX_LENGTHS.city
          : null;

  if (maxLength !== null && exceedsMaxLength(trimmed, maxLength)) {
    return { blocked: true, field, reason: 'max_length' };
  }

  return { blocked: false };
}

export function detectGeocodePiiViolation(parts: ActivityPlaceParts): GeocodePiiCheckResult {
  const placeName = parts.placeName?.trim() ?? '';
  const city = parts.city?.trim() ?? '';
  const street = parts.street?.trim() ?? '';
  const postalCode = parts.postalCode?.trim() ?? '';

  const fieldChecks: Array<{ field: GeocodePiiFieldName; value: string; isPostalField?: boolean }> =
    [
      { field: 'placeName', value: placeName },
      { field: 'street', value: street },
      { field: 'city', value: city },
      { field: 'postalCode', value: postalCode, isPostalField: true },
    ];

  for (const check of fieldChecks) {
    const result = scanFieldForPii(check.field, check.value, {
      isPostalField: check.isPostalField,
    });
    if (result.blocked) {
      return result;
    }
  }

  const geocodeQuery = buildActivityGeocodeQuery({
    placeName,
    city,
    street,
    postalCode,
  });

  if (exceedsMaxLength(geocodeQuery, GEOCODE_PII_MAX_LENGTHS.geocodeQuery)) {
    return { blocked: true, field: 'geocodeQuery', reason: 'max_length' };
  }

  const queryCheck = scanFieldForPii('geocodeQuery', geocodeQuery);
  if (queryCheck.blocked) {
    return queryCheck;
  }

  return { blocked: false };
}

export function hashGeocodeFieldValue(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export const GEOCODE_PII_FAILURE_MESSAGE =
  'Kartpositionen kunde inte fastställas säkert utifrån angivna uppgifter.';