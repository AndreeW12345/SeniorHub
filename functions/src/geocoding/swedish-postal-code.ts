/** Returns true when the value is exactly five digits (optional space after third digit). */
export function isValidSwedishPostalCode(postalCode: string): boolean {
  const digits = postalCode.replace(/\s+/g, '');
  return /^\d{5}$/.test(digits);
}

export function validatePostalCodeInput(postalCode: string | undefined): string | null {
  const trimmed = postalCode?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (!isValidSwedishPostalCode(trimmed)) {
    return 'Postnummer måste bestå av fem siffror.';
  }
  return null;
}

/** Normalizes a valid Swedish postal code to `NNN NN`. */
export function formatSwedishPostalCode(postalCode: string): string {
  const digits = postalCode.replace(/\s+/g, '');
  if (/^\d{5}$/.test(digits)) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return postalCode.trim();
}