import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, it } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storageRulesPath = resolve(__dirname, '../src/firebase/storage.rules');
const firestoreRulesPath = resolve(__dirname, '../src/firebase/firestore.rules');
const storageRules = readFileSync(storageRulesPath, 'utf8');
const firestoreRules = readFileSync(firestoreRulesPath, 'utf8');

const PROJECT_ID = 'seniorhub-storage-rules-test';

/** @type {import('@firebase/rules-unit-testing').RulesTestEnvironment} */
let testEnv;

function jpegBlob() {
  return new Blob(['fake-jpeg-bytes'], { type: 'image/jpeg' });
}

function authedStorage(uid, token = {}) {
  return testEnv
    .authenticatedContext(uid, {
      email: token.email ?? `${uid}@example.com`,
      email_verified: token.email_verified ?? true,
    })
    .storage();
}

function anonStorage() {
  return testEnv.unauthenticatedContext().storage();
}

async function seedFirestore() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await db.collection('admins').doc('admin1').set({
      email: 'admin@seniorhub.se',
      role: 'admin',
      organizationId: 'spf-tyreso',
    });

    await db.collection('users').doc('user1').set({
      name: 'User One',
      email: 'user1@example.com',
      role: 'user',
    });

    await db.collection('users').doc('user2').set({
      name: 'User Two',
      email: 'user2@example.com',
      role: 'user',
    });

    await db.collection('users').doc('org-tyreso').set({
      name: 'Organizer Tyreso',
      email: 'org@spf-tyreso.se',
      role: 'organizer',
      organizerOrganizationId: 'spf-tyreso',
    });

    await db.collection('users').doc('org-nacka').set({
      name: 'Organizer Nacka',
      email: 'org@spf-nacka.se',
      role: 'organizer',
      organizerOrganizationId: 'spf-nacka',
    });
  });
}

async function seedActivityImage() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage();
    await storage.ref('activities/act-tyreso/cover.jpg').put(jpegBlob());
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: firestoreRules,
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: storageRules,
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
  await seedFirestore();
  await seedActivityImage();
});

describe('activities/**', () => {
  it('allows unauthenticated read', async () => {
    const storage = anonStorage();
    await assertSucceeds(storage.ref('activities/act-tyreso/cover.jpg').getMetadata());
  });

  it('allows signed-in user read', async () => {
    const storage = authedStorage('user1');
    await assertSucceeds(storage.ref('activities/act-tyreso/cover.jpg').getMetadata());
  });

  it('denies signed-in user write', async () => {
    const storage = authedStorage('user1');
    await assertFails(storage.ref('activities/new-act/cover.jpg').put(jpegBlob()));
  });

  it('allows admin write', async () => {
    const storage = authedStorage('admin1');
    await assertSucceeds(storage.ref('activities/admin-act/cover.jpg').put(jpegBlob()));
  });

  it('allows organizer write', async () => {
    const storage = authedStorage('org-tyreso');
    await assertSucceeds(storage.ref('activities/org-act/cover.jpg').put(jpegBlob()));
  });
});

describe('profiles/{uid}/avatar.jpg', () => {
  it('allows user to write own avatar', async () => {
    const storage = authedStorage('user1');
    await assertSucceeds(storage.ref('profiles/user1/avatar.jpg').put(jpegBlob()));
  });

  it('denies user writing another profile avatar', async () => {
    const storage = authedStorage('user1');
    await assertFails(storage.ref('profiles/user2/avatar.jpg').put(jpegBlob()));
  });

  it('allows admin to read another user profile avatar', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.storage().ref('profiles/user1/avatar.jpg').put(jpegBlob());
    });

    const storage = authedStorage('admin1');
    await assertSucceeds(storage.ref('profiles/user1/avatar.jpg').getMetadata());
  });
});

describe('organizations/{orgId}/logo.jpg', () => {
  it('allows admin write for own organization', async () => {
    const storage = authedStorage('admin1');
    await assertSucceeds(storage.ref('organizations/spf-tyreso/logo.jpg').put(jpegBlob()));
  });

  it('allows organizer write for own organization', async () => {
    const storage = authedStorage('org-tyreso');
    await assertSucceeds(storage.ref('organizations/spf-tyreso/logo.jpg').put(jpegBlob()));
  });

  it('denies organizer write for another organization', async () => {
    const storage = authedStorage('org-tyreso');
    await assertFails(storage.ref('organizations/spf-nacka/logo.jpg').put(jpegBlob()));
  });
});

describe('other paths', () => {
  it('denies read and write on arbitrary paths', async () => {
    const userStorage = authedStorage('user1');
    const adminStorage = authedStorage('admin1');
    const path = 'uploads/random-file.jpg';

    await assertFails(userStorage.ref(path).getMetadata());
    await assertFails(userStorage.ref(path).put(jpegBlob()));
    await assertFails(adminStorage.ref(path).put(jpegBlob()));
  });
});
