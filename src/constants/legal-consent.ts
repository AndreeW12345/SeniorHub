/**
 * Bump when användarvillkor or integritetspolicy change materially.
 * Must match `currentLegalTermsVersion()` in src/firebase/firestore.rules.
 */
export const CURRENT_LEGAL_TERMS_VERSION = '2026-09-07';

export type PendingLegalConsent = {
  /** ISO-8601 timestamp captured client-side when the user checked the box. */
  acceptedAt: string;
  version: string;
};

export type StoredLegalConsent = {
  termsAccepted: true;
  termsAcceptedVersion: string;
};

export function isValidPendingLegalConsent(
  consent: PendingLegalConsent | undefined | null,
): consent is PendingLegalConsent {
  if (!consent) {
    return false;
  }

  const acceptedAt = consent.acceptedAt?.trim();
  const version = consent.version?.trim();

  return version === CURRENT_LEGAL_TERMS_VERSION && acceptedAt.length > 0;
}

export function readStoredLegalConsent(
  data: Record<string, unknown> | undefined,
): StoredLegalConsent | null {
  if (!data) {
    return null;
  }

  if (data.termsAccepted !== true) {
    return null;
  }

  const version =
    typeof data.termsAcceptedVersion === 'string' ? data.termsAcceptedVersion.trim() : '';

  if (version !== CURRENT_LEGAL_TERMS_VERSION) {
    return null;
  }

  return {
    termsAccepted: true,
    termsAcceptedVersion: version,
  };
}
