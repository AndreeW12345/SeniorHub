import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSuperAdminAdminDocument,
  requireAuthenticatedUid,
} from '../functions/lib/utils/super-admin-policy.js';
import { isExistingOrganizationDocument } from '../functions/lib/utils/invite-organizer-admin-policy.js';
import {
  buildListOrganizationAdminsRateLimitPath,
  listOrganizationAdminsFromRecords,
  mapAdminDocumentToListItem,
  sanitizeOrganizationAdminListItem,
} from '../functions/lib/utils/list-organization-admins-policy.js';
import { parseListOrganizationAdminsInput } from '../functions/lib/utils/list-organization-admins-validation.js';

function expectHttpsCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

describe('auth gate', () => {
  it('1. saknad auth nekas', () => {
    expectHttpsCode(() => requireAuthenticatedUid(undefined), 'unauthenticated');
  });

  it('2. vanlig admin nekas', () => {
    expectHttpsCode(
      () =>
        assertSuperAdminAdminDocument(true, {
          role: 'admin',
          organizationId: 'spf-tyreso',
        }),
      'permission-denied',
    );
  });

  it('3. superadmin tillåts', () => {
    assert.doesNotThrow(() =>
      assertSuperAdminAdminDocument(true, {
        role: 'superadmin',
        organizationId: 'seniorhub',
      }),
    );
  });
});

describe('parseListOrganizationAdminsInput', () => {
  it('4. ogiltigt organizationId nekas', () => {
    assert.equal(parseListOrganizationAdminsInput({ organizationId: 'Bad Id' }), null);
    assert.equal(parseListOrganizationAdminsInput({}), null);
  });

  it('accepts valid organizationId', () => {
    assert.deepEqual(parseListOrganizationAdminsInput({ organizationId: 'spf-tyreso' }), {
      organizationId: 'spf-tyreso',
    });
  });
});

describe('organization existence', () => {
  it('5. organisation som inte finns nekas (helper)', () => {
    assert.equal(isExistingOrganizationDocument(false, undefined), false);
    assert.equal(isExistingOrganizationDocument(true, { description: 'x' }), false);
  });
});

describe('listOrganizationAdminsFromRecords', () => {
  const orgId = 'spf-tyreso';

  it('6. admins från rätt organisation returneras', () => {
    const list = listOrganizationAdminsFromRecords(
      [
        {
          uid: 'uid-a',
          data: {
            organizationId: orgId,
            role: 'admin',
            email: 'anna@spf.se',
            displayName: 'Anna',
          },
        },
        {
          uid: 'uid-b',
          data: {
            organizationId: orgId,
            role: 'admin',
            email: 'lars@spf.se',
          },
        },
      ],
      orgId,
    );

    assert.equal(list.length, 2);
    assert.equal(list[0]?.email, 'anna@spf.se');
    assert.equal(list[1]?.email, 'lars@spf.se');
  });

  it('7. admins från andra organisationer returneras inte', () => {
    const list = listOrganizationAdminsFromRecords(
      [
        {
          uid: 'uid-other',
          data: {
            organizationId: 'other-org',
            role: 'admin',
            email: 'other@example.se',
          },
        },
      ],
      orgId,
    );
    assert.equal(list.length, 0);
  });

  it('8. superadmin räknas inte som org-admin i listan', () => {
    const item = mapAdminDocumentToListItem(
      'super-uid',
      {
        organizationId: orgId,
        role: 'superadmin',
        email: 'boss@seniorhub.se',
      },
      orgId,
    );
    assert.equal(item, null);

    const list = listOrganizationAdminsFromRecords(
      [
        {
          uid: 'super-uid',
          data: {
            organizationId: orgId,
            role: 'superadmin',
            email: 'boss@seniorhub.se',
          },
        },
        {
          uid: 'uid-a',
          data: { organizationId: orgId, role: 'admin', email: 'anna@spf.se' },
        },
      ],
      orgId,
    );
    assert.equal(list.length, 1);
    assert.equal(list[0]?.uid, 'uid-a');
  });

  it('9. känsliga uppgifter returneras inte', () => {
    const item = mapAdminDocumentToListItem(
      'uid-a',
      {
        organizationId: orgId,
        role: 'admin',
        email: 'anna@spf.se',
        password: 'secret',
        resetLink: 'https://example.test/reset',
        fcmToken: 'token-value',
      },
      orgId,
    );
    assert.ok(item);
    assert.deepEqual(Object.keys(item).sort(), [
      'displayName',
      'email',
      'organizationId',
      'role',
      'uid',
    ]);
    assert.equal(Object.hasOwn(item, 'password'), false);
    assert.equal(Object.hasOwn(item, 'resetLink'), false);

    const sanitized = sanitizeOrganizationAdminListItem(item);
    assert.deepEqual(Object.keys(sanitized).sort(), [
      'displayName',
      'email',
      'organizationId',
      'role',
      'uid',
    ]);
  });
});

describe('rate limit configuration', () => {
  it('rate limit path is scoped per superadmin', () => {
    assert.equal(
      buildListOrganizationAdminsRateLimitPath('super-uid'),
      'security/listOrganizationAdmins/attempts/super-uid',
    );
  });
});
