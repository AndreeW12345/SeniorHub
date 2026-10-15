import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { saveUserProfile } from '../src/services/profile/save-user-profile.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = resolve(__dirname, '../src/firebase/firestore.rules');
const rules = readFileSync(rulesPath, 'utf8');

const PROJECT_ID = 'seniorhub-save-profile-test';

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
});

function authedDb(uid, token = {}) {
  return testEnv
    .authenticatedContext(uid, {
      email: token.email ?? `${uid}@example.com`,
      email_verified: token.email_verified ?? true,
    })
    .firestore();
}

async function seedUser(uid, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', uid), data);
  });
}

async function seedPhoneIndex(normalizedPhone, uid) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'phoneIndex', normalizedPhone), {
      uid,
      createdAt: new Date(),
    });
  });
}

async function readUser(db, uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));
  return snapshot.exists() ? snapshot.data() : null;
}

async function readPhoneIndex(db, normalizedPhone) {
  const snapshot = await getDoc(doc(db, 'phoneIndex', normalizedPhone));
  return snapshot.exists() ? snapshot.data() : null;
}

function profileUpdateForUser1(phone) {
  return {
    name: 'User One',
    phone,
    email: 'user1@example.com',
  };
}

describe('saveUserProfile integration (Firestore emulator)', () => {
  it('changes phone on an existing profile and moves phoneIndex atomically', async () => {
    await seedUser('user1', {
      name: 'User One',
      email: 'user1@example.com',
      phone: '0701111111',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await seedPhoneIndex('0701111111', 'user1');

    const db = authedDb('user1', { email: 'user1@example.com' });
    const result = await saveUserProfile('user1', profileUpdateForUser1('0705555555'), {
      firestore: db,
      platform: 'integration-test',
    });

    assert.equal(result.ok, true);

    const newIndex = await readPhoneIndex(db, '0705555555');
    assert.ok(newIndex);
    assert.equal(newIndex.uid, 'user1');

    const oldIndex = await readPhoneIndex(db, '0701111111');
    assert.equal(oldIndex, null);

    const user = await readUser(db, 'user1');
    assert.equal(user.phone, '0705555555');
    assert.equal(user.phoneNormalized, '0705555555');
  });

  it('fails when the target number is already indexed for another user', async () => {
    await seedUser('user1', {
      name: 'User One',
      email: 'user1@example.com',
      phone: '0701111111',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await seedPhoneIndex('0705555555', 'user2');

    const db = authedDb('user1', { email: 'user1@example.com' });
    const result = await saveUserProfile('user1', profileUpdateForUser1('0705555555'), {
      firestore: db,
      platform: 'integration-test',
    });

    assert.equal(result.ok, false);

    const ownerDb = authedDb('user2', { email: 'user2@example.com' });
    const occupiedIndex = await readPhoneIndex(ownerDb, '0705555555');
    assert.equal(occupiedIndex.uid, 'user2');

    const user = await readUser(db, 'user1');
    assert.equal(user.phone, '0701111111');
    assert.equal(user.phoneNormalized, undefined);
  });

  it('leaves user profile and phoneIndex unchanged after a failed save', async () => {
    await seedUser('user1', {
      name: 'User One',
      email: 'user1@example.com',
      phone: '0701111111',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await seedPhoneIndex('0701111111', 'user1');
    await seedPhoneIndex('0705555555', 'user2');

    const db = authedDb('user1', { email: 'user1@example.com' });
    const beforeUser = await readUser(db, 'user1');
    const beforeOwnIndex = await readPhoneIndex(db, '0701111111');
    const beforeTargetIndex = await readPhoneIndex(
      authedDb('user2', { email: 'user2@example.com' }),
      '0705555555',
    );

    const result = await saveUserProfile('user1', profileUpdateForUser1('0705555555'), {
      firestore: db,
      platform: 'integration-test',
    });

    assert.equal(result.ok, false);

    const afterUser = await readUser(db, 'user1');
    assert.deepEqual(afterUser, beforeUser);

    const afterOwnIndex = await readPhoneIndex(db, '0701111111');
    assert.deepEqual(afterOwnIndex, beforeOwnIndex);

    const afterTargetIndex = await readPhoneIndex(
      authedDb('user2', { email: 'user2@example.com' }),
      '0705555555',
    );
    assert.deepEqual(afterTargetIndex, beforeTargetIndex);
  });

  it('creates phoneIndex when a legacy profile saves the same phone without an index', async () => {
    await seedUser('user1', {
      name: 'User One',
      email: 'user1@example.com',
      phone: '0701111111',
      photoUrl: null,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const db = authedDb('user1', { email: 'user1@example.com' });
    const result = await saveUserProfile('user1', profileUpdateForUser1('070-111 11 11'), {
      firestore: db,
      platform: 'integration-test',
    });

    assert.equal(result.ok, true);

    const index = await readPhoneIndex(db, '0701111111');
    assert.ok(index);
    assert.equal(index.uid, 'user1');

    const user = await readUser(db, 'user1');
    assert.equal(user.phoneNormalized, '0701111111');
  });
});
