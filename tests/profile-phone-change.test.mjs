import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isProfilePhoneChange,
  readStoredPhoneNormalized,
} from '../src/services/profile/profile-phone-change.ts';

describe('profile phone change detection', () => {
  it('treats the same formatted phone as unchanged', () => {
    const stored = { phone: '070-111 11 11', phoneNormalized: '0701111111' };
    assert.equal(isProfilePhoneChange(stored, '0701111111'), false);
    assert.equal(isProfilePhoneChange(stored, '070-111 11 11'), false);
  });

  it('detects an active phone change', () => {
    const stored = { phone: '0701111111', phoneNormalized: '0701111111' };
    assert.equal(isProfilePhoneChange(stored, '0705555555'), true);
  });

  it('reads normalized phone from legacy phone field', () => {
    assert.equal(readStoredPhoneNormalized({ phone: '073-756 92 32' }), '0737569232');
  });
});
