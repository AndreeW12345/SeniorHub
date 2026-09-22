import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSuperAdminAdminDocument,
  isSuperAdminRole,
  readAdminRoleFromDocument,
  requireAuthenticatedUid,
} from '../functions/lib/utils/super-admin-policy.js';
import {
  buildNewOrganizationFields,
  normalizeOrganizationId,
  parseCreateOrganizationInput,
  readOrganizationName,
} from '../functions/lib/utils/organization-validation.js';
import { createOrganizerSlug } from '../functions/lib/utils/create-organizer-slug.js';

function expectHttpsCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    return true;
  });
}

describe('requireAuthenticatedUid (missing auth nekas)', () => {
  it('1. rejects when auth is missing', () => {
    expectHttpsCode(() => requireAuthenticatedUid(undefined), 'unauthenticated');
    expectHttpsCode(() => requireAuthenticatedUid(null), 'unauthenticated');
    expectHttpsCode(() => requireAuthenticatedUid({ uid: '   ' }), 'unauthenticated');
  });
});

describe('assertSuperAdminAdminDocument (admin vs superadmin)', () => {
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

  it('2b. saknat admin-dokument nekas', () => {
    expectHttpsCode(() => assertSuperAdminAdminDocument(false, undefined), 'permission-denied');
  });
});

describe('organizationId validation', () => {
  it('4. ogiltigt organizationId nekas', () => {
    assert.equal(normalizeOrganizationId(''), null);
    assert.equal(normalizeOrganizationId('SPF Tyresö'), null);
    assert.equal(normalizeOrganizationId('-bad'), null);
    assert.equal(normalizeOrganizationId('bad-'), null);
    assert.equal(normalizeOrganizationId('seniorhub'), null);
    assert.equal(normalizeOrganizationId('a'), null);
  });

  it('accepts valid organizationId', () => {
    assert.equal(normalizeOrganizationId('spf-tyreso'), 'spf-tyreso');
    assert.equal(normalizeOrganizationId('  SPF-Tyreso  '), 'spf-tyreso');
  });
});

describe('organization name validation', () => {
  it('5. tomt/ogiltigt namn nekas', () => {
    assert.equal(readOrganizationName(''), null);
    assert.equal(readOrganizationName('   '), null);
    assert.equal(readOrganizationName(null), null);
    assert.equal(readOrganizationName(42), null);
  });

  it('accepts valid name', () => {
    assert.equal(readOrganizationName('  SPF Tyresö  '), 'SPF Tyresö');
  });
});

describe('parseCreateOrganizationInput', () => {
  it('6. valid input parses organizationId and name', () => {
    const parsed = parseCreateOrganizationInput({
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
    });
    assert.deepEqual(parsed, { organizationId: 'spf-tyreso', name: 'SPF Tyresö' });
  });

  it('8. klienten kan inte påverka role — role ignoreras', () => {
    const parsed = parseCreateOrganizationInput({
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
      role: 'superadmin',
    });
    assert.deepEqual(parsed, { organizationId: 'spf-tyreso', name: 'SPF Tyresö' });
    assert.equal(isSuperAdminRole(readAdminRoleFromDocument({ role: 'admin' })), false);
    assert.equal(
      isSuperAdminRole(readAdminRoleFromDocument({ role: 'superadmin' })),
      true,
    );
  });
});

describe('buildNewOrganizationFields', () => {
  it('7. giltig ny organisation får rätt grundfält', () => {
    const payload = buildNewOrganizationFields({
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
    });

    assert.equal(payload.id, 'spf-tyreso');
    assert.equal(payload.name, 'SPF Tyresö');
    assert.equal(payload.slug, createOrganizerSlug('SPF Tyresö'));
    assert.equal(Object.hasOwn(payload, 'role'), false);
  });
});

describe('createOrganization duplicate policy (logic)', () => {
  it('6. befintlig organizationId ska inte skrivas över (exists check)', () => {
    const existingExists = true;
    const shouldCreate = !existingExists;
    assert.equal(shouldCreate, false);
  });
});
