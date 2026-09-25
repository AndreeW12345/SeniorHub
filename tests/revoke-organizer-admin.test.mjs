import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSuperAdminAdminDocument,
  requireAuthenticatedUid,
} from '../functions/lib/utils/super-admin-policy.js';
import { readExistingAdminSnapshot } from '../functions/lib/utils/invite-organizer-admin-policy.js';
import {
  buildRevokeOrganizerAdminRateLimitPath,
  resolveRevokeOrganizerAdminDecision,
  revokeOrganizerAdminRejectedError,
  REVOKE_ORGANIZER_ADMIN_COOLDOWN_MS,
} from '../functions/lib/utils/revoke-organizer-admin-policy.js';
import {
  parseRevokeOrganizerAdminInput,
  readTargetAdminUid,
} from '../functions/lib/utils/revoke-organizer-admin-validation.js';
import { buildRevokeOrganizerAdminCallablePayload } from '../src/utils/organization-id-validation.ts';

function expectHttpsCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

describe('auth gate (revokeOrganizerAdmin)', () => {
  it('saknad auth nekas', () => {
    expectHttpsCode(() => requireAuthenticatedUid(undefined), 'unauthenticated');
  });

  it('vanlig org-admin nekas superadmin-kontroll', () => {
    expectHttpsCode(
      () =>
        assertSuperAdminAdminDocument(true, {
          role: 'admin',
          organizationId: 'spf-tyreso',
        }),
      'permission-denied',
    );
  });

  it('superadmin tillåts', () => {
    assert.doesNotThrow(() =>
      assertSuperAdminAdminDocument(true, {
        role: 'superadmin',
        organizationId: 'seniorhub',
      }),
    );
  });
});

describe('parseRevokeOrganizerAdminInput', () => {
  it('korrekt payload med organizationId och targetAdminUid', () => {
    assert.deepEqual(
      parseRevokeOrganizerAdminInput({
        organizationId: 'spf-tyreso',
        targetAdminUid: 'abc123xyz7890123456789012',
      }),
      {
        organizationId: 'spf-tyreso',
        targetAdminUid: 'abc123xyz7890123456789012',
      },
    );
  });

  it('ogiltigt organizationId nekas', () => {
    assert.equal(
      parseRevokeOrganizerAdminInput({
        organizationId: 'BAD ID',
        targetAdminUid: 'abc123xyz7890123456789012',
      }),
      null,
    );
  });

  it('ogiltigt targetAdminUid nekas', () => {
    assert.equal(readTargetAdminUid(''), null);
    assert.equal(readTargetAdminUid('short'), null);
    assert.equal(
      parseRevokeOrganizerAdminInput({
        organizationId: 'spf-tyreso',
        targetAdminUid: 'bad uid!',
      }),
      null,
    );
  });

  it('klient-payload matchar server (låst org)', () => {
    const payload = buildRevokeOrganizerAdminCallablePayload({
      lockedOrganizationId: 'spf-tyreso',
      targetAdminUid: 'abc123xyz7890123456789012',
    });
    assert.deepEqual(payload, {
      organizationId: 'spf-tyreso',
      targetAdminUid: 'abc123xyz7890123456789012',
    });
  });
});

describe('resolveRevokeOrganizerAdminDecision', () => {
  const superAdminUid = 'super1234567890123456789012';
  const targetUid = 'target123456789012345678901';
  const orgId = 'spf-tyreso';

  it('lyckad revoke för admin i rätt organisation', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: targetUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: orgId,
        email: 'anna@spf.se',
      }),
    });
    assert.equal(decision.kind, 'revoke');
  });

  it('self-revoke nekas', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: superAdminUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(true, {
        role: 'superadmin',
        organizationId: 'seniorhub',
      }),
    });
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'self_revoke');
  });

  it('superadmin-target nekas', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: targetUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(true, {
        role: 'superadmin',
        organizationId: 'seniorhub',
      }),
    });
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'superadmin_account');
  });

  it('endast role admin tillåts', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: targetUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(true, {
        role: 'organizer',
        organizationId: orgId,
      }),
    });
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'wrong_role');
  });

  it('fel organisation nekas', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: targetUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: 'other-org',
      }),
    });
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'wrong_organization');
  });

  it('saknat admin-dokument nekas', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: targetUid,
      targetOrganizationId: orgId,
      admin: readExistingAdminSnapshot(false, undefined),
    });
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'not_found');
  });
});

describe('felhantering (revokeOrganizerAdmin)', () => {
  it('avvisade beslut mappas till failed-precondition', () => {
    expectHttpsCode(() => {
      throw revokeOrganizerAdminRejectedError();
    }, 'failed-precondition');
  });

  it('lyckad revoke-logik (policy)', () => {
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid: 'super1234567890123456789012',
      targetAdminUid: 'target123456789012345678901',
      targetOrganizationId: 'spf-tyreso',
      admin: readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: 'spf-tyreso',
      }),
    });
    assert.equal(decision.kind, 'revoke');
  });
});

describe('rate limit configuration', () => {
  it('revoke rate limit path and cooldown', () => {
    assert.equal(
      buildRevokeOrganizerAdminRateLimitPath('super-uid'),
      'security/revokeOrganizerAdmin/attempts/super-uid',
    );
    assert.ok(REVOKE_ORGANIZER_ADMIN_COOLDOWN_MS >= 1_000);
  });
});
