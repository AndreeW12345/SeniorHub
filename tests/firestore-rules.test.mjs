import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../src/firebase/firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

const PROJECT_ID = 'seniorhub-rules-test';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedBaseData();
});

async function seedBaseData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, 'admins/admin1'), {
      email: 'admin@seniorhub.se',
      role: 'admin',
    });

    await setDoc(doc(db, 'users/user1'), {
      name: 'User One',
      email: 'user1@example.com',
      phone: '0701111111',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setDoc(doc(db, 'users/user2'), {
      name: 'User Two',
      email: 'user2@example.com',
      phone: '0702222222',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setDoc(doc(db, 'users/org-tyreso'), {
      name: 'Organizer Tyreso',
      email: 'org@spf-tyreso.se',
      phone: '0703333333',
      photoUrl: null,
      role: 'organizer',
      organizerOrganizationId: 'spf-tyreso',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await setDoc(doc(db, 'organizations/spf-tyreso'), {
      name: 'SPF Tyreso',
      status: 'active',
    });

    await setDoc(doc(db, 'organizations/spf-nacka'), {
      name: 'SPF Nacka',
      status: 'active',
    });

    await setDoc(doc(db, 'activities/act-tyreso'), {
      title: 'Fika',
      description: 'Beskrivning',
      date: '2026-08-01',
      time: '10:00',
      location: 'Centrum',
      organizer: 'SPF Tyreso',
      category: 'social',
      organizationId: 'spf-tyreso',
    });

    await setDoc(doc(db, 'activities/act-nacka'), {
      title: 'Dans',
      description: 'Beskrivning',
      date: '2026-08-01',
      time: '11:00',
      location: 'Centrum',
      organizer: 'SPF Nacka',
      category: 'social',
      organizationId: 'spf-nacka',
    });

    await setDoc(doc(db, 'activities/act-tyreso/registrations/user2'), {
      name: 'User Two',
      phone: '0702222222',
      registeredAt: new Date(),
      status: 'registered',
    });

    await setDoc(doc(db, 'activities/act-tyreso/announcements/ann1'), {
      title: 'Info',
      message: 'Meddelande',
      kind: 'manual',
      createdAt: new Date(),
    });
  });
}

function authedDb(uid, token = {}) {
  return testEnv
    .authenticatedContext(uid, {
      email: token.email ?? `${uid}@example.com`,
      email_verified: token.email_verified ?? true,
    })
    .firestore();
}

function registrationRef(db, activityId, registrationId) {
  return doc(db, 'activities', activityId, 'registrations', registrationId);
}

describe('registrations – user', () => {
  it('can read own registration but not someone else\'s', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });
    const user2Db = authedDb('user2', { email: 'user2@example.com' });

    await assertFails(getDoc(registrationRef(user1Db, 'act-tyreso', 'user2')));
    await assertSucceeds(getDoc(registrationRef(user2Db, 'act-tyreso', 'user2')));
  });

  it('cannot create a registration directly from the client', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      setDoc(registrationRef(user1Db, 'act-tyreso', 'user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      }),
    );
  });

  it('cannot create a registration with another uid as document id', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      setDoc(registrationRef(user1Db, 'act-tyreso', 'user2'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      }),
    );
  });

  it('cannot book the same activity twice via client create', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      setDoc(registrationRef(user1Db, 'act-tyreso', 'user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      }),
    );
  });

  it('can cancel own registration', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'activities/act-tyreso/registrations/user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      });
    });

    await assertSucceeds(
      updateDoc(registrationRef(user1Db, 'act-tyreso', 'user1'), {
        status: 'cancelled',
        cancelledAt: new Date(),
      }),
    );
  });
});

describe('registrations – organizer queries', () => {
  it('can list registrations for own organization activity', async () => {
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });
    const registrationsRef = collection(organizerDb, 'activities', 'act-tyreso', 'registrations');

    const snapshot = await assertSucceeds(getDocs(query(registrationsRef, orderBy('registeredAt', 'desc'))));
    assert.equal(snapshot.size, 1);
    assert.equal(snapshot.docs[0].id, 'user2');
  });

  it('cannot list registrations for another organization activity', async () => {
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });
    const registrationsRef = collection(organizerDb, 'activities', 'act-nacka', 'registrations');

    await assertFails(getDocs(registrationsRef));
  });

  it('cannot create a registration on behalf of another user', async () => {
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });

    await assertFails(
      setDoc(registrationRef(organizerDb, 'act-tyreso', 'user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      }),
    );
  });
});

describe('registrations – organizer activity scope', () => {
  it('cannot move an activity to another organization', async () => {
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });

    await assertFails(
      updateDoc(doc(organizerDb, 'activities', 'act-tyreso'), {
        organizationId: 'spf-nacka',
        title: 'Fika',
      }),
    );
  });
});

describe('admin access', () => {
  it('has full access to registrations', async () => {
    const adminDb = authedDb('admin1', { email: 'admin@seniorhub.se' });

    await assertSucceeds(getDoc(registrationRef(adminDb, 'act-tyreso', 'user2')));
    await assertSucceeds(
      updateDoc(registrationRef(adminDb, 'act-tyreso', 'user2'), {
        status: 'cancelled',
        cancelledAt: new Date(),
      }),
    );
  });
});

describe('unauthenticated access', () => {
  it('is denied sensitive operations', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(registrationRef(anonDb, 'act-tyreso', 'user2')));
    await assertFails(
      setDoc(registrationRef(anonDb, 'act-tyreso', 'anon'), {
        name: 'Anon',
        phone: '0700000000',
        registeredAt: new Date(),
        status: 'registered',
      }),
    );
    await assertFails(getDoc(doc(anonDb, 'organizerApplications', 'app1')));
  });
});

describe('announcements', () => {
  it('is readable for registered participants and organizers', async () => {
    const user2Db = authedDb('user2', { email: 'user2@example.com' });
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });
    const outsiderDb = authedDb('user1', { email: 'user1@example.com' });
    const anonDb = testEnv.unauthenticatedContext().firestore();

    await assertSucceeds(getDoc(doc(user2Db, 'activities', 'act-tyreso', 'announcements', 'ann1')));
    await assertSucceeds(getDoc(doc(organizerDb, 'activities', 'act-tyreso', 'announcements', 'ann1')));
    await assertFails(getDoc(doc(outsiderDb, 'activities', 'act-tyreso', 'announcements', 'ann1')));
    await assertFails(getDoc(doc(anonDb, 'activities', 'act-tyreso', 'announcements', 'ann1')));
  });
});

describe('reminderDeliveries', () => {
  it('cannot be written by clients', async () => {
    const adminDb = authedDb('admin1', { email: 'admin@seniorhub.se' });
    const userDb = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      setDoc(doc(userDb, 'activities', 'act-tyreso', 'reminderDeliveries', 'delivery1'), {
        sentAt: new Date(),
      }),
    );

    await assertFails(
      setDoc(doc(adminDb, 'activities', 'act-tyreso', 'reminderDeliveries', 'delivery1'), {
        sentAt: new Date(),
      }),
    );
  });
});

describe('organizerApplications', () => {
  it('requires verified email and matching applicantUid', async () => {
    const unverifiedDb = authedDb('user1', {
      email: 'user1@example.com',
      email_verified: false,
    });

    await assertFails(
      setDoc(doc(unverifiedDb, 'organizerApplications', 'app1'), {
        name: 'User One',
        email: 'user1@example.com',
        phone: '0701111111',
        organization: 'Forening',
        description: 'Vi vill arrangera fika.',
        applicantUid: 'user1',
        createdAt: new Date(),
        status: 'Ny',
      }),
    );

    const userDb = authedDb('user1', { email: 'user1@example.com' });

    await assertSucceeds(
      setDoc(doc(userDb, 'organizerApplications', 'app1'), {
        name: 'User One',
        email: 'user1@example.com',
        phone: '0701111111',
        organization: 'Forening',
        description: 'Vi vill arrangera fika.',
        applicantUid: 'user1',
        createdAt: new Date(),
        status: 'Ny',
      }),
    );
  });
});

describe('security hardening', () => {
  it('denies a user from updating another user registration', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      updateDoc(registrationRef(user1Db, 'act-tyreso', 'user2'), {
        status: 'cancelled',
        cancelledAt: new Date(),
      }),
    );
  });

  it('denies a user from changing registration name or phone', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'activities/act-tyreso/registrations/user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      });
    });

    await assertFails(
      updateDoc(registrationRef(user1Db, 'act-tyreso', 'user1'), {
        name: 'Changed Name',
      }),
    );
  });

  it('denies a user from deleting their registration document', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'activities/act-tyreso/registrations/user1'), {
        name: 'User One',
        phone: '0701111111',
        registeredAt: new Date(),
        status: 'registered',
      });
    });

    await assertFails(deleteDoc(registrationRef(user1Db, 'act-tyreso', 'user1')));
  });

  it('denies a regular user from creating an admin document', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(
      setDoc(doc(user1Db, 'admins', 'user1'), {
        organizationId: 'seniorhub',
        role: 'admin',
        email: 'user1@example.com',
      }),
    );
  });

  it('denies a user from reading another user profile', async () => {
    const user1Db = authedDb('user1', { email: 'user1@example.com' });

    await assertFails(getDoc(doc(user1Db, 'users', 'user2')));
  });

  it('denies an organizer from changing activity organizationId', async () => {
    const organizerDb = authedDb('org-tyreso', { email: 'org@spf-tyreso.se' });

    await assertFails(
      updateDoc(doc(organizerDb, 'activities', 'act-tyreso'), {
        organizationId: 'spf-nacka',
      }),
    );
  });
});
