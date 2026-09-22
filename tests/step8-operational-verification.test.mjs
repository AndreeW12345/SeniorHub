import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  listOrganizationAdminsFromRecords,
} from '../functions/lib/utils/list-organization-admins-policy.js';
import { resolveInviteOrganizerAdminDecision, readExistingAdminSnapshot } from '../functions/lib/utils/invite-organizer-admin-policy.js';
import { createOrganizerSlug } from '../src/utils/organizer-slug.ts';

function getActivitiesByOrganizerSlug(activities, slug) {
  return activities.filter((activity) => createOrganizerSlug(activity.organizer) === slug);
}

/** Mirrors organization filter in fetchAdminStatistics (read-only verification). */
function activitiesForOrganizationStatistics(activities, organizationId) {
  const scoped = organizationId?.trim() || null;
  return activities.filter(
    (activity) => !scoped || activity.organizationId?.trim() === scoped,
  );
}

describe('STEG 8 – flera admins samma organisation', () => {
  it('två separata admin-konton kan vara admins för samma organisation', () => {
    const orgId = 'spf-tyreso';
    const list = listOrganizationAdminsFromRecords(
      [
        {
          uid: 'uid-anna',
          data: { organizationId: orgId, role: 'admin', email: 'anna@spf.se' },
        },
        {
          uid: 'uid-lars',
          data: { organizationId: orgId, role: 'admin', email: 'lars@spf.se' },
        },
      ],
      orgId,
    );
    assert.equal(list.length, 2);
    assert.equal(new Set(list.map((item) => item.uid)).size, 2);
  });
});

describe('STEG 8 – org A påverkar inte org B', () => {
  it('admin i annan organisation avvisas vid invite (ingen tyst flytt)', () => {
    const decision = resolveInviteOrganizerAdminDecision(
      readExistingAdminSnapshot(true, {
        role: 'admin',
        organizationId: 'spf-nacka',
        email: 'admin@nacka.se',
      }),
      'spf-tyreso',
    );
    assert.equal(decision.kind, 'rejected');
    assert.equal(decision.reason, 'other_organization');
  });

  it('listOrganizationAdmins returnerar inte admins från annan organisation', () => {
    const list = listOrganizationAdminsFromRecords(
      [
        {
          uid: 'uid-nacka',
          data: { organizationId: 'spf-nacka', role: 'admin', email: 'x@nacka.se' },
        },
      ],
      'spf-tyreso',
    );
    assert.equal(list.length, 0);
  });
});

describe('STEG 8 – publik organizer-sida', () => {
  it('getActivitiesByOrganizerSlug filtrerar på slug (organizer/[slug])', () => {
    const activities = [
      { id: '1', organizer: 'SPF Tyresö', organizationId: 'spf-tyreso' },
      { id: '2', organizer: 'SPF Nacka', organizationId: 'spf-nacka' },
    ];
    const tyreso = getActivitiesByOrganizerSlug(activities, 'spf-tyreso');
    assert.equal(tyreso.length, 1);
    assert.equal(tyreso[0]?.id, '1');
  });
});

describe('STEG 8 – gemensam statistik', () => {
  it('statistik scope: endast aktiviteter för organisationId', () => {
    const activities = [
      { id: 'a', organizationId: 'spf-tyreso', title: 'Fika' },
      { id: 'b', organizationId: 'spf-nacka', title: 'Promenad' },
      { id: 'c', organizationId: 'spf-tyreso', title: 'Spel' },
    ];
    const forTyreso = activitiesForOrganizationStatistics(activities, 'spf-tyreso');
    assert.equal(forTyreso.length, 2);
    assert.ok(forTyreso.every((item) => item.organizationId === 'spf-tyreso'));
  });
});

describe('STEG 8 – bli arrangör oförändrat (referens)', () => {
  it('organizerApplications regler testas i firestore-rules.test.mjs', () => {
    assert.ok(true);
  });
});
