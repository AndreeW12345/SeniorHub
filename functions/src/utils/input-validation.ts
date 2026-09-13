const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_ACTIVITY_ID_LENGTH = 128;
const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readBoundedString(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

export function readRegistrationName(value: unknown): string | null {
  return readBoundedString(value, MAX_NAME_LENGTH);
}

export function readRegistrationPhone(value: unknown): string | null {
  return readBoundedString(value, MAX_PHONE_LENGTH);
}

export function readActivityId(value: unknown): string | null {
  return readBoundedString(value, MAX_ACTIVITY_ID_LENGTH);
}

export function readEmail(value: unknown): string | null {
  const email = readBoundedString(value, MAX_EMAIL_LENGTH);
  if (!email) {
    return null;
  }

  const normalized = email.toLowerCase();
  return EMAIL_PATTERN.test(normalized) ? normalized : null;
}
