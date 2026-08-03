/**
 * One-off seed: ensure organizations/seniorhub exists, stamp
 * organizationId on admins (and optionally activities missing the field).
 *
 * Usage: node --env-file=.env scripts/seed-seniorhub-org.mjs
 */
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

const ORGANIZATION_ID = 'seniorhub';
const ORGANIZATION_NAME = 'SeniorHub';

function requireConfig() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error(
      'Firebase env vars missing. Run with: node --env-file=.env scripts/seed-seniorhub-org.mjs',
    );
  }
}

async function main() {
  requireConfig();

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const changed = [];

  const orgRef = doc(db, 'organizations', ORGANIZATION_ID);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    await setDoc(orgRef, {
      id: ORGANIZATION_ID,
      name: ORGANIZATION_NAME,
    });
    changed.push(`CREATED organizations/${ORGANIZATION_ID}`);
  } else {
    changed.push(`SKIPPED organizations/${ORGANIZATION_ID} (already exists)`);
  }

  const adminsSnap = await getDocs(collection(db, 'admins'));

  if (adminsSnap.empty) {
    changed.push(
      'NOTE: no documents in admins/ yet – app will create admins/{uid} with organizationId "seniorhub" on next admin login.',
    );
  } else {
    for (const adminDoc of adminsSnap.docs) {
      const data = adminDoc.data();
      const currentOrg =
        typeof data.organizationId === 'string' ? data.organizationId.trim() : '';

      if (currentOrg === ORGANIZATION_ID) {
        changed.push(`SKIPPED admins/${adminDoc.id} (organizationId already set)`);
        continue;
      }

      if (currentOrg) {
        changed.push(
          `SKIPPED admins/${adminDoc.id} (keeps existing organizationId "${currentOrg}")`,
        );
        continue;
      }

      await updateDoc(adminDoc.ref, {
        organizationId: ORGANIZATION_ID,
      });
      changed.push(`UPDATED admins/${adminDoc.id} (added organizationId: "${ORGANIZATION_ID}")`);
    }
  }

  const activitiesSnap = await getDocs(collection(db, 'activities'));
  let stampedActivities = 0;

  for (const activityDoc of activitiesSnap.docs) {
    const data = activityDoc.data();
    const currentOrg =
      typeof data.organizationId === 'string' ? data.organizationId.trim() : '';

    if (currentOrg) {
      continue;
    }

    await updateDoc(activityDoc.ref, {
      organizationId: ORGANIZATION_ID,
    });
    stampedActivities += 1;
  }

  if (stampedActivities > 0) {
    changed.push(
      `UPDATED ${stampedActivities} activities (added organizationId: "${ORGANIZATION_ID}")`,
    );
  } else {
    changed.push('SKIPPED activities (all already had organizationId, or none found)');
  }

  console.log(changed.join('\n'));
}

main().catch((error) => {
  console.error('[seed-seniorhub-org] failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
