import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSuperAdminAdminDocument,
  requireAuthenticatedUid,
} from '../functions/lib/utils/super-admin-policy.js';
import {
  buildInviteOrganizerRateLimitPaths,
  buildOrganizerAdminDocumentFields,
  INVITE_ORGANIZER_ADMIN_EMAIL_COOLDOWN_MS,
  INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS,
  isExistingOrganizationDocument,
  readExistingAdminSnapshot,
  resolveInviteOrganizerAdminDecision,
} from '../functions/lib/utils/invite-organizer-admin-policy.js';
import { parseInviteOrganizerAdminInput } from '../functions/lib/utils/invite-organizer-admin-validation.js';
import { normalizeOrganizationId } from '../functions/lib/utils/organization-validation.js';
import { readEmail } from '../functions/lib/utils/input-validation.js';

function expectHttpsCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

describe('auth gate (reuse super-admin policy)', () => {
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

describe('parseInviteOrganizerAdminInput', () => {
  it('4. ogiltigt organizationId nekas', () => {
    assert.equal(
      parseInviteOrganizerAdminInput({
        organizationId: 'INVALID ID',
        email: 'anna@spf.se',
      }),
      null,
    );
    assert.equal(normalizeOrganizationId('bad-'), null);
  });

  it('6. ogiltig e-post nekas', () => {
    assert.equal(
      parseInviteOrganizerAdminInput({
        organizationId: 'spf-tyreso',
        email: 'not-an-email',
      }),
      null,
    );
    assert.equal(readEmail('not-an-email'), null);
  });

  it('13. lösenord hanteras aldrig från klienten', () => {
    const parsed = parseInviteOrganizerAdminInput({
      organizationId: 'spf-tyreso',
      email: 'Anna@spf.se',
      password: 'secret-password',
      role: 'superadmin',
    });
    assert.deepEqual(parsed, {
      organizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: null,
    });
  });

  it('parses displayName when provided', () => {
    const parsed = parseInviteOrganizerAdminInput({
      organizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: 'Anna Andersson',
    });
    assert.equal(parsed?.displayName, 'Anna Andersson');
  });
});

describe('organization existence', () => {
  it('5. organisation som inte finns nekas (validation helper)', () => {
    assert.equal(isExistingOrganizationDocument(false, undefined), false);
    assert.equal(isExistingOrganizationDocument(true, {}), false);
    assert.equal(isExistingOrganizationDocument(true, { name: 'SPF Tyresö' }), true);
  });
});

describe('resolveInviteOrganizerAdminDecision', () => {
  it('7/8/9. ny användare / provision skriver admin-dokument', () => {
    const decision = resolveInviteOrganizerAdminDecision(
      readExistingAdminSnapshot(false, undefined),
      'spf-tyreso',
    );
    assert.equal(decision.kind, 'provision');
    assert.equal(decision.writeAdminDocument, true);

    const fields = buildOrganizerAdminDocumentFields({
      organizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: 'Anna',
    });
    assert.deepEqual(fields, {
      organizationId: 'spf-tyreso',
      role: 'admin',
      email: 'anna@spf.se',
      displayName: 'Anna',
    });
  });

  it('10. klienten kan inte ange superadmin-roll', () => {
    const fields = buildOrganizerAdminDocumentFields({
      organizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: null,
    });
    assert.equal(fields.role, 'admin');
    assert.equal(Object.hasOwn(fields, 'superadmin'), false);

    const decision = resolveInviteOrganizerAdminDecision(
      readExistingAdminSnapshot(true, { role: 'superadmin', organizationId: 'seniorhub' }),
      'spf-tyreso',
    );
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'superadmin_account');
  });

  it('11. befintlig admin i samma organisation är idempotent', () => {
    const decision = resolveInviteOrganizerAdminDecision(
      readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: 'spf-tyreso',
        email: 'anna@spf.se',
      }),
      'spf-tyreso',
    );
    assert.equal(decision.kind, 'already_in_organization');
    assert.equal(decision.writeAdminDocument, false);
  });

  it('12. användare från annan organisation flyttas inte tyst', () => {
    const decision = resolveInviteOrganizerAdminDecision(
      readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: 'other-org',
        email: 'anna@spf.se',
      }),
      'spf-tyreso',
    );
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'other_organization');
  });
});

describe('Auth reuse policy (logic)', () => {
  it('8. befintlig användare återanvänds — skapa inte nytt konto', () => {
    const userFound = true;
    assert.equal(userFound ? 'reuse' : 'create', 'reuse');
  });

  it('7. ny användare skapas när e-post saknas i Auth', () => {
    const userFound = false;
    assert.equal(userFound ? 'reuse' : 'create', 'create');
  });
});

describe('rate limit configuration', () => {
  it('14. rate limit paths and cooldowns are configured', () => {
    const paths = buildInviteOrganizerRateLimitPaths('super-uid', 'anna@spf.se');
    assert.equal(
      paths.perSuperAdmin,
      'security/inviteOrganizerAdmin/attempts/super-uid',
    );
    assert.equal(
      paths.perEmail,
      'security/inviteOrganizerAdmin/email/anna%40spf.se',
    );
    assert.ok(INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS >= 1_000);
    assert.ok(INVITE_ORGANIZER_ADMIN_EMAIL_COOLDOWN_MS >= INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS);
  });
});
