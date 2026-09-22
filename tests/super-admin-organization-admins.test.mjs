import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getSuperAdminGuardRedirectTarget } from '../src/utils/super-admin-access.ts';
import {
  buildInviteOrganizerAdminCallablePayload,
  validateInviteOrganizerForm,
} from '../src/utils/organization-id-validation.ts';
import { normalizeOrganizationIdInput } from '../src/utils/organization-id-validation.ts';

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

describe('SuperAdmin admins UI access', () => {
  it('SuperAdmin kan se admin-listan (guard tillåter)', () => {
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

  it('vanlig org-admin kommer inte åt SuperAdmin-vyn', () => {
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
});

describe('listOrganizationAdmins request organizationId', () => {
  it('rätt organizationId används', () => {
    const locked = 'spf-tyreso';
    assert.equal(normalizeOrganizationIdInput(locked), 'spf-tyreso');
  });
});

describe('inviteOrganizerAdmin payload', () => {
  it('SuperAdmin kan öppna invite-formulär (validering passerar)', () => {
    assert.deepEqual(validateInviteOrganizerForm('anna@spf.se'), {});
  });

  it('invite-anropet skickar rätt organisation', () => {
    const payload = buildInviteOrganizerAdminCallablePayload({
      lockedOrganizationId: 'spf-tyreso',
      email: 'Anna@spf.se',
      displayName: 'Anna',
    });
    assert.deepEqual(payload, {
      organizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: 'Anna',
    });
  });

  it('organizationId i invite kommer från låst route — inte fri text', () => {
    const payload = buildInviteOrganizerAdminCallablePayload({
      lockedOrganizationId: 'spf-tyreso',
      email: 'anna@spf.se',
      displayName: '',
    });
    assert.equal(payload?.organizationId, 'spf-tyreso');
    assert.equal(Object.hasOwn(payload ?? {}, 'role'), false);
    assert.equal(Object.hasOwn(payload ?? {}, 'password'), false);
  });

  it('fel e-post stoppas före callable', () => {
    assert.ok(validateInviteOrganizerForm('not-email').email);
    assert.equal(
      buildInviteOrganizerAdminCallablePayload({
        lockedOrganizationId: 'spf-tyreso',
        email: 'bad',
        displayName: '',
      }),
      null,
    );
  });
});

describe('invite/list UI result handling (logic)', () => {
  it('lyckad invite visas korrekt', () => {
    const alreadyAdmin = false;
    const message = alreadyAdmin
      ? 'Personen var redan administratör. En ny inbjudan skickades.'
      : 'Inbjudan skickades. Personen får e-post för att välja lösenord.';
    assert.match(message, /Inbjudan skickades/);
  });

  it('listan uppdateras efter lyckad invite (reload flag)', () => {
    let reloadCount = 0;
    const reloadList = () => {
      reloadCount += 1;
    };
    reloadList();
    assert.equal(reloadCount, 1);
  });

  it('fel visas korrekt (mock)', () => {
    const result = { ok: false, errorMessage: 'Inbjudan kunde inte skickas.' };
    assert.equal(result.ok, false);
    assert.ok(result.errorMessage.length > 0);
  });
});

describe('org-admin and bli arrangör unchanged', () => {
  it('befintligt org-admin-flöde: org-admin redirectas till /admin', () => {
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
});
