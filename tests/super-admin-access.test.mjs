import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getSuperAdminGuardRedirectTarget,
  isSuperAdminAdminAccount,
  shouldShowSuperAdminPlatformLink,
} from '../src/utils/super-admin-access.ts';

const superAdminAccount = {
  uid: 'super-uid',
  organizationId: 'seniorhub',
  role: 'superadmin',
  email: 'boss@seniorhub.se',
};

const orgAdminAccount = {
  uid: 'org-uid',
  organizationId: 'spf-tyreso',
  role: 'admin',
  email: 'anna@spf.se',
};

describe('isSuperAdminAdminAccount', () => {
  it('superadmin får åtkomst', () => {
    assert.equal(isSuperAdminAdminAccount(superAdminAccount), true);
  });

  it('vanlig admin nekas', () => {
    assert.equal(isSuperAdminAdminAccount(orgAdminAccount), false);
  });

  it('ej inloggad / saknat konto nekas', () => {
    assert.equal(isSuperAdminAdminAccount(null), false);
    assert.equal(isSuperAdminAdminAccount(undefined), false);
  });
});

describe('shouldShowSuperAdminPlatformLink', () => {
  it('länken visas endast för superadmin', () => {
    assert.equal(shouldShowSuperAdminPlatformLink(true, superAdminAccount), true);
    assert.equal(shouldShowSuperAdminPlatformLink(true, orgAdminAccount), false);
    assert.equal(shouldShowSuperAdminPlatformLink(false, superAdminAccount), false);
  });
});

describe('getSuperAdminGuardRedirectTarget', () => {
  it('ej inloggad nekas (admin login)', () => {
    assert.equal(
      getSuperAdminGuardRedirectTarget({
        isInitializing: false,
        isVerifying: false,
        isAdmin: false,
        verifiedAccount: null,
      }),
      '/admin/login',
    );
  });

  it('vanlig admin nekas (tillbaka till admin-fliken)', () => {
    assert.equal(
      getSuperAdminGuardRedirectTarget({
        isInitializing: false,
        isVerifying: false,
        isAdmin: true,
        verifiedAccount: orgAdminAccount,
      }),
      '/admin',
    );
  });

  it('superadmin tillåts', () => {
    assert.equal(
      getSuperAdminGuardRedirectTarget({
        isInitializing: false,
        isVerifying: false,
        isAdmin: true,
        verifiedAccount: superAdminAccount,
      }),
      null,
    );
  });

  it('befintlig admin-navigation: vanlig admin redirectas inte till login', () => {
    const target = getSuperAdminGuardRedirectTarget({
      isInitializing: false,
      isVerifying: false,
      isAdmin: true,
      verifiedAccount: orgAdminAccount,
    });
    assert.equal(target, '/admin');
    assert.notEqual(target, '/admin/login');
  });

  it('väntar med redirect medan Firestore-verifiering pågår', () => {
    assert.equal(
      getSuperAdminGuardRedirectTarget({
        isInitializing: false,
        isVerifying: true,
        isAdmin: true,
        verifiedAccount: null,
      }),
      null,
    );
  });
});
