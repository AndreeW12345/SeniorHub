import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const CURRENT_LEGAL_TERMS_VERSION = '2026-09-07';

function isValidPendingLegalConsent(consent) {
  if (!consent) {
    return false;
  }

  const acceptedAt = consent.acceptedAt?.trim();
  const version = consent.version?.trim();

  return version === CURRENT_LEGAL_TERMS_VERSION && acceptedAt.length > 0;
}

describe('legal consent helpers', () => {
  it('accepts pending consent with the current version', () => {
    assert.equal(
      isValidPendingLegalConsent({
        acceptedAt: '2026-09-07T12:00:00.000Z',
        version: CURRENT_LEGAL_TERMS_VERSION,
      }),
      true,
    );
  });

  it('rejects pending consent with an outdated version', () => {
    assert.equal(
      isValidPendingLegalConsent({
        acceptedAt: '2026-09-07T12:00:00.000Z',
        version: '2020-01-01',
      }),
      false,
    );
  });
});
