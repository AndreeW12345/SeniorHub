import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { shouldAutoRedirectSignedInLogin } from '../src/utils/should-auto-redirect-signed-in-login.ts';

describe('shouldAutoRedirectSignedInLogin', () => {
  it('redirects when signed in without an open magic-link flow', () => {
    assert.equal(
      shouldAutoRedirectSignedInLogin({
        isSignedIn: true,
        linkSent: false,
        hasStoredMagicLinkEmail: false,
      }),
      true,
    );
  });

  it('does not redirect during an unfinished magic-link flow', () => {
    assert.equal(
      shouldAutoRedirectSignedInLogin({
        isSignedIn: true,
        linkSent: false,
        hasStoredMagicLinkEmail: true,
      }),
      false,
    );
  });

  it('does not redirect while the user is waiting for a new link email', () => {
    assert.equal(
      shouldAutoRedirectSignedInLogin({
        isSignedIn: true,
        linkSent: true,
        hasStoredMagicLinkEmail: false,
      }),
      false,
    );
  });
});
