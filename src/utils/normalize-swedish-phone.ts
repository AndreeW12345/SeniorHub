/** Strips formatting and normalizes Swedish phone numbers to digits with a leading 0. */
export function normalizeSwedishPhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let working = trimmed.replace(/[\s\-().]/g, '');

  if (working.startsWith('+46')) {
    working = `0${working.slice(3)}`;
  } else if (working.startsWith('0046')) {
    working = `0${working.slice(4)}`;
  } else if (working.startsWith('46') && working.length > 2) {
    working = `0${working.slice(2)}`;
  }

  const digits = working.replace(/\D/g, '');
  if (!digits.startsWith('0')) {
    return null;
  }

  if (digits.length < 9 || digits.length > 10) {
    return null;
  }

  return digits;
}

export function isValidSwedishPhone(input: string): boolean {
  return normalizeSwedishPhone(input) !== null;
}
