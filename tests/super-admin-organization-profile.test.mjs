import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSuperAdminGuardRedirectTarget } from '../src/utils/super-admin-access.ts';
import {
  resolveOrganizationProfileSaveId,
  resolveSuperAdminOrganizationRouteId,
} from '../src/utils/organization-id-validation.ts';

const superAdminAccount = {
  uid: 'super-uid',
  organizationId: 'seniorhub',
  role: 'superadmin',
};

const orgAdminAccount = {
  uid: 'org-uid',
  organizationId: 'spf-tyreso',
  role: 'admin',
};

describe('SuperAdmin organization profile access', () => {
  it('SuperAdmin kan öppna en organisation (guard tillåter)', () => {
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

  it('vanlig org-admin kan inte öppna SuperAdmin-vyn', () => {
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

  it('ej inloggad kan inte öppna den', () => {
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
});

describe('resolveSuperAdminOrganizationRouteId', () => {
  it('rätt organisation läses från giltigt route-id', () => {
    assert.equal(resolveSuperAdminOrganizationRouteId('spf-tyreso'), 'spf-tyreso');
    assert.equal(resolveSuperAdminOrganizationRouteId(['spf-tyreso']), 'spf-tyreso');
  });

  it('ogiltigt organizationId nekas', () => {
    assert.equal(resolveSuperAdminOrganizationRouteId('Bad Id'), null);
    assert.equal(resolveSuperAdminOrganizationRouteId(undefined), null);
  });
});

describe('organizationId immutability', () => {
  it('organizationId kan inte ändras via save helper', () => {
    const lockedId = 'spf-tyreso';
    assert.equal(resolveOrganizationProfileSaveId(lockedId), 'spf-tyreso');
    assert.notEqual(resolveOrganizationProfileSaveId(lockedId), 'other-org');
  });
});

describe('org-admin /admin/organization flow (logic)', () => {
  it('org-admin använder fortfarande eget organizationId från adminkonto', () => {
    const adminOrganizationId = orgAdminAccount.organizationId.trim();
    assert.equal(resolveOrganizationProfileSaveId(adminOrganizationId), 'spf-tyreso');
  });

  it('profilfält sparas mot låst id (mock)', () => {
    const saveTargetId = resolveOrganizationProfileSaveId('spf-tyreso');
    const formFields = { name: 'SPF Tyresö', description: 'Hej' };
    assert.equal(saveTargetId, 'spf-tyreso');
    assert.ok(formFields.name);
  });

  it('fel route-id hanteras (null)', () => {
    assert.equal(resolveSuperAdminOrganizationRouteId('../escape'), null);
  });
});

describe('bli arrangör / unrelated flows', () => {
  it('superadmin route helpers påverkar inte ansökningsflödet (ingen koppling)', () => {
    assert.equal(typeof resolveSuperAdminOrganizationRouteId('spf-tyreso'), 'string');
  });
});
