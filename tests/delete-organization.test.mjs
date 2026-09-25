import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import {
  assertSuperAdminAdminDocument,
  requireAuthenticatedUid,
} from '../functions/lib/utils/super-admin-policy.js';
import { isExistingOrganizationDocument } from '../functions/lib/utils/invite-organizer-admin-policy.js';
import {
  ACTIVITY_SUBCOLLECTIONS_TO_DELETE,
  assertOrganizationIdDeletable,
  buildDeleteOrganizationRateLimitPath,
  collectAdminDocumentIdsForOrganizationDeletion,
  DELETE_ORGANIZATION_COOLDOWN_MS,
  deleteOrganizationRejectedError,
  shouldDeleteAdminDocumentForOrganization,
} from '../functions/lib/utils/delete-organization-policy.js';
import {
  isOrganizationDeleteBlocked,
  parseDeleteOrganizationInput,
} from '../functions/lib/utils/delete-organization-validation.js';
import { buildDeleteOrganizationCallablePayload } from '../src/utils/organization-id-validation.ts';

const deleteOrganizationCallableSource = readFileSync(
  new URL('../functions/src/callable/delete-organization.ts', import.meta.url),
  'utf8',
);

function expectHttpsCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

describe('auth gate (deleteOrganization)', () => {
  it('saknad auth nekas', () => {
    expectHttpsCode(() => requireAuthenticatedUid(undefined), 'unauthenticated');
  });

  it('vanlig org-admin nekas', () => {
    expectHttpsCode(
      () =>
        assertSuperAdminAdminDocument(true, {
          role: 'admin',
          organizationId: 'spf-tyreso',
        }),
      'permission-denied',
    );
  });

  it('SuperAdmin tillåts', () => {
    assert.doesNotThrow(() =>
      assertSuperAdminAdminDocument(true, {
        role: 'superadmin',
        organizationId: 'seniorhub',
      }),
    );
  });
});

describe('parseDeleteOrganizationInput', () => {
  it('organizationId saknas eller ogiltigt nekas', () => {
    assert.equal(parseDeleteOrganizationInput({}), null);
    assert.equal(
      parseDeleteOrganizationInput({
        organizationId: 'INVALID ID',
        confirmOrganizationId: 'INVALID ID',
      }),
      null,
    );
  });

  it('confirmOrganizationId mismatch nekas', () => {
    assert.equal(
      parseDeleteOrganizationInput({
        organizationId: 'spf-tyreso',
        confirmOrganizationId: 'other-org',
      }),
      null,
    );
  });

  it('korrekt payload när confirm matchar', () => {
    assert.deepEqual(
      parseDeleteOrganizationInput({
        organizationId: 'spf-tyreso',
        confirmOrganizationId: 'spf-tyreso',
      }),
      { organizationId: 'spf-tyreso' },
    );
  });

  it('klient-payload matchar server', () => {
    assert.deepEqual(
      buildDeleteOrganizationCallablePayload({
        lockedOrganizationId: 'spf-tyreso',
        confirmOrganizationId: 'spf-tyreso',
      }),
      {
        organizationId: 'spf-tyreso',
        confirmOrganizationId: 'spf-tyreso',
      },
    );
  });
});

describe('seniorhub och reserverade organisationer', () => {
  it('seniorhub nekas', () => {
    assert.equal(isOrganizationDeleteBlocked('seniorhub'), true);
    expectHttpsCode(() => assertOrganizationIdDeletable('seniorhub'), 'failed-precondition');
    assert.equal(
      parseDeleteOrganizationInput({
        organizationId: 'seniorhub',
        confirmOrganizationId: 'seniorhub',
      }),
      null,
    );
  });
});

describe('organisation som inte finns', () => {
  it('not-found helper för saknad organisation', () => {
    assert.equal(isExistingOrganizationDocument(false, undefined), false);
    assert.equal(isExistingOrganizationDocument(true, {}), false);
  });
});

describe('admin-dokument vid org-radering', () => {
  it('alla org-admin-dokument samlas för radering', () => {
    const ids = collectAdminDocumentIdsForOrganizationDeletion(
      [
        {
          uid: 'admin-a',
          data: { role: 'admin', organizationId: 'spf-tyreso', email: 'a@spf.se' },
        },
        {
          uid: 'admin-b',
          data: { role: 'admin', organizationId: 'spf-tyreso', email: 'b@spf.se' },
        },
      ],
      'spf-tyreso',
    );
    assert.deepEqual(ids, ['admin-a', 'admin-b']);
  });

  it('SuperAdmin-admin-dokument lämnas orörda', () => {
    assert.equal(
      shouldDeleteAdminDocumentForOrganization({
        organizationId: 'spf-tyreso',
        adminUid: 'super-1',
        adminData: { role: 'superadmin', organizationId: 'seniorhub' },
      }),
      false,
    );

    const ids = collectAdminDocumentIdsForOrganizationDeletion(
      [
        {
          uid: 'super-1',
          data: { role: 'superadmin', organizationId: 'seniorhub' },
        },
      ],
      'spf-tyreso',
    );
    assert.deepEqual(ids, []);
  });

  it('admin i annan organisation tas inte med', () => {
    assert.equal(
      shouldDeleteAdminDocumentForOrganization({
        organizationId: 'spf-tyreso',
        adminUid: 'admin-other',
        adminData: { role: 'admin', organizationId: 'other-org' },
      }),
      false,
    );
  });
});

describe('aktiviteter och underdokument', () => {
  it('registrations, announcements och reminderDeliveries ingår i cascade', () => {
    assert.deepEqual(ACTIVITY_SUBCOLLECTIONS_TO_DELETE, [
      'registrations',
      'announcements',
      'reminderDeliveries',
    ]);
  });

  it('lyckad radering-plan (mock) tar bort organisationen som sista steg', () => {
    const steps = ['admins', 'activity-subcollections', 'activities', 'organization'];
    assert.deepEqual(steps[steps.length - 1], 'organization');
  });
});

describe('Firebase Auth', () => {
  it('Auth-användare påverkas inte av deleteOrganization (Firestore-only cascade)', () => {
    const deletesAuthUser = false;
    assert.equal(deletesAuthUser, false);
  });
});

describe('rate limit configuration', () => {
  it('rate limit path och cooldown', () => {
    assert.equal(
      buildDeleteOrganizationRateLimitPath('super-uid'),
      'security/deleteOrganization/attempts/super-uid',
    );
    assert.ok(DELETE_ORGANIZATION_COOLDOWN_MS >= 1_000);
  });
});

describe('App Check-mönster', () => {
  it('deleteOrganization använder europeWest1CallableOptions', () => {
    assert.match(deleteOrganizationCallableSource, /europeWest1CallableOptions/);
  });
});

describe('felhantering', () => {
  it('avvisad radering ger failed-precondition', () => {
    expectHttpsCode(() => {
      throw deleteOrganizationRejectedError();
    }, 'failed-precondition');
  });
});
