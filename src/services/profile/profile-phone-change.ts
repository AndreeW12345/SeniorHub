import { normalizeSwedishPhone } from '@/utils/normalize-swedish-phone';

/** Best-effort normalized phone from stored user fields (legacy profiles may lack phoneNormalized). */
export function readStoredPhoneNormalized(data: Record<string, unknown> | undefined): string | null {
  if (!data) {
    return null;
  }

  const fromField =
    typeof data.phoneNormalized === 'string' ? data.phoneNormalized.trim() : '';
  if (fromField) {
    return fromField;
  }

  const phone = typeof data.phone === 'string' ? data.phone.trim() : '';
  return phone ? normalizeSwedishPhone(phone) : null;
}

/** True when the normalized phone value changes (including clearing the number). */
export function isProfilePhoneChange(
  storedUserData: Record<string, unknown> | undefined,
  nextPhone: string,
): boolean {
  const previousNormalized = readStoredPhoneNormalized(storedUserData);
  const trimmed = nextPhone.trim();
  const nextNormalized = trimmed ? normalizeSwedishPhone(trimmed) : null;

  return (previousNormalized ?? null) !== (nextNormalized ?? null);
}
