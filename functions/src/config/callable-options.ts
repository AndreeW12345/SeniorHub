import type { CallableOptions } from 'firebase-functions/v2/https';

const FUNCTIONS_REGION = 'europe-west1';

/** Skip App Check enforcement in the Functions emulator; enforce in deployed environments. */
export const ENFORCE_APP_CHECK = process.env.FUNCTIONS_EMULATOR !== 'true';

export function europeWest1CallableOptions(
  overrides: Partial<CallableOptions> = {},
): CallableOptions {
  return {
    region: FUNCTIONS_REGION,
    enforceAppCheck: ENFORCE_APP_CHECK,
    ...overrides,
  };
}
