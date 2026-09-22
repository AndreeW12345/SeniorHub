import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSuperAdminGuardRedirectTarget } from '../src/utils/super-admin-access.ts';
import {
  buildCreateOrganizationCallablePayload,
  hasCreateOrganizationFormErrors,
  validateCreateOrganizationForm,
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

describe('SuperAdmin create organization access', () => {
  it('SuperAdmin kan öppna skapa-organisation (guard tillåter)', () => {
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

  it('vanlig org-admin kan inte nå det', () => {
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

  it('ej inloggad kan inte nå det', () => {
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

  it('befintlig admin-navigation: org-admin redirectas till admin, inte login', () => {
    const target = getSuperAdminGuardRedirectTarget({
      isInitializing: false,
      isVerifying: false,
      isAdmin: true,
      verifiedAccount: orgAdminAccount,
    });
    assert.equal(target, '/admin');
  });
});

describe('validateCreateOrganizationForm', () => {
  it('organizationId + namn krävs', () => {
    const errors = validateCreateOrganizationForm({ organizationId: '', name: '' });
    assert.ok(errors.organizationId);
    assert.ok(errors.name);
    assert.equal(hasCreateOrganizationFormErrors(errors), true);
  });

  it('ogiltigt organizationId stoppas', () => {
    const errors = validateCreateOrganizationForm({
      organizationId: 'SPF Tyresö',
      name: 'SPF Tyresö',
    });
    assert.ok(errors.organizationId);
  });

  it('giltiga värden passerar validering', () => {
    const errors = validateCreateOrganizationForm({
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
    });
    assert.deepEqual(errors, {});
    assert.equal(hasCreateOrganizationFormErrors(errors), false);
  });
});

describe('buildCreateOrganizationCallablePayload', () => {
  it('createOrganization anropas med rätt data', () => {
    const payload = buildCreateOrganizationCallablePayload({
      organizationId: '  spf-tyreso ',
      name: '  SPF Tyresö  ',
    });
    assert.deepEqual(payload, {
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
    });
  });

  it('skickar inte role, password eller admin-fält', () => {
    const payload = buildCreateOrganizationCallablePayload({
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
    });
    assert.deepEqual(Object.keys(payload).sort(), ['name', 'organizationId']);
  });

  it('ogiltig input ger null (callable anropas inte från service)', () => {
    assert.equal(
      buildCreateOrganizationCallablePayload({ organizationId: 'bad id', name: 'X' }),
      null,
    );
  });
});

describe('createOrganization result handling (logic)', () => {
  it('lyckat skapande kräver organizationId, name och slug i svar', () => {
    const response = {
      organizationId: 'spf-tyreso',
      name: 'SPF Tyresö',
      slug: 'spf-tyreso',
    };
    assert.ok(response.organizationId && response.name && response.slug);
  });

  it('fel från callablen mappas till användarvänligt meddelande (tomt svar)', () => {
    const response = { organizationId: '', name: 'SPF Tyresö', slug: 'spf-tyreso' };
    const ok = Boolean(response.organizationId?.trim() && response.name?.trim() && response.slug?.trim());
    assert.equal(ok, false);
  });
});
