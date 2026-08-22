/**
 * Migrates legacy auto-ID registration documents to UID-based document IDs:
 * activities/{activityId}/registrations/{authUid}
 *
 * Usage:
 *   node scripts/migrate-registration-ids.mjs [--dry-run]
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin default credentials.
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const dryRun = process.argv.includes('--dry-run');

function readString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function initAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
    });
  }

  return getFirestore();
}

async function migrateRegistrations(db) {
  const activitiesSnap = await db.collection('activities').get();
  let migrated = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const activityDoc of activitiesSnap.docs) {
    const activityId = activityDoc.id;
    const registrationsRef = db
      .collection('activities')
      .doc(activityId)
      .collection('registrations');

    const registrationsSnap = await registrationsRef.get();

    for (const registrationDoc of registrationsSnap.docs) {
      const registrationId = registrationDoc.id;
      const data = registrationDoc.data();
      const legacyUserId = readString(data.userId);

      // Already UID-based when document id equals stored userId, or id looks like a Firebase uid path target.
      if (legacyUserId && registrationId === legacyUserId) {
        skipped += 1;
        continue;
      }

      if (!legacyUserId) {
        skipped += 1;
        continue;
      }

      const targetRef = registrationsRef.doc(legacyUserId);
      const targetSnap = await targetRef.get();

      if (targetSnap.exists) {
        console.warn(
          `[migrate] Conflict: ${activityId}/registrations/${legacyUserId} already exists; legacy doc ${registrationId} kept for manual review.`,
        );
        conflicts += 1;
        continue;
      }

      const { userId: _removed, ...rest } = data;

      console.log(
        `[migrate] ${dryRun ? 'DRY RUN ' : ''}${activityId}/registrations/${registrationId} -> ${legacyUserId}`,
      );

      if (!dryRun) {
        await targetRef.set(rest);
        await registrationDoc.ref.delete();
      }

      migrated += 1;
    }
  }

  return { migrated, skipped, conflicts };
}

async function main() {
  const db = initAdmin();
  const result = await migrateRegistrations(db);

  console.log(
    JSON.stringify(
      {
        dryRun,
        ...result,
        completedAt: FieldValue.serverTimestamp(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[migrate] Failed:', error);
  process.exitCode = 1;
});
