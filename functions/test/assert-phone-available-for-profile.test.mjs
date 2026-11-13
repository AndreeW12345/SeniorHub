import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HttpsError } from 'firebase-functions/v2/https';

import {
  PHONE_ALREADY_IN_USE,
  assertPhoneIndexAvailableForUser,
} from '../lib/callable/assert-phone-available-for-profile.js';

describe('assertPhoneIndexAvailableForUser', () => {
  it('allows an unused phone number', async () => {
    await assertPhoneIndexAvailableForUser('user1', '0701234567', async () => null);
  });

  it('allows when the phone index belongs to the same user', async () => {
    await assertPhoneIndexAvailableForUser('user1', '0701234567', async () => 'user1');
  });

  it('rejects when another user owns the phone index', async () => {
    await assert.rejects(
      () => assertPhoneIndexAvailableForUser('user1', '0701234567', async () => 'user2'),
      (error) =>
        error instanceof HttpsError &&
        error.code === 'failed-precondition' &&
        error.message === PHONE_ALREADY_IN_USE,
    );
  });
});
