import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS, type ReminderKind } from '../notifications/types';
import { europeWest1CallableOptions } from '../config/callable-options';
import { assertRateLimit } from '../utils/rate-limit';

const DELETE_COOLDOWN_MS = 60_000;
const ANONYMIZED_NAME = 'Raderad användare';
const REMINDER_DELIVERY_KINDS: ReminderKind[] = ['day_before', 'one_hour_before'];

async function anonymizeUserRegistrations(uid: string): Promise<void> {
  const db = getFirestore();
  const activitiesSnapshot = await db.collection(COLLECTIONS.activities).get();

  let batch = db.batch();
  let batchSize = 0;

  for (const activityDoc of activitiesSnapshot.docs) {
    const registrationDoc = await activityDoc.ref
      .collection(COLLECTIONS.registrations)
      .doc(uid)
      .get();

    if (!registrationDoc.exists) {
      continue;
    }

    const registrationData = registrationDoc.data() ?? {};
    const status = typeof registrationData.status === 'string'
      ? registrationData.status.trim()
      : '';

    const updates: Record<string, unknown> = {
      name: ANONYMIZED_NAME,
      phone: FieldValue.delete(),
      anonymizedAt: FieldValue.serverTimestamp(),
    };

    if (status === 'registered' || status === 'waitlist') {
      updates.status = 'cancelled';
      updates.cancelledAt = FieldValue.serverTimestamp();
    }

    batch.update(registrationDoc.ref, updates);
    batchSize += 1;

    if (batchSize >= 400) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }
}

async function deleteUserReminderDeliveries(uid: string): Promise<void> {
  const db = getFirestore();
  const activitiesSnapshot = await db.collection(COLLECTIONS.activities).get();

  let batch = db.batch();
  let batchSize = 0;

  for (const activityDoc of activitiesSnapshot.docs) {
    const reminderDeliveriesRef = activityDoc.ref.collection(COLLECTIONS.reminderDeliveries);

    for (const kind of REMINDER_DELIVERY_KINDS) {
      const deliveryRef = reminderDeliveriesRef.doc(`${uid}_${kind}`);
      const deliveryDoc = await deliveryRef.get();

      if (!deliveryDoc.exists) {
        continue;
      }

      batch.delete(deliveryRef);
      batchSize += 1;

      if (batchSize >= 400) {
        await batch.commit();
        batch = db.batch();
        batchSize = 0;
      }
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }
}

async function deleteUserOrganizerApplications(uid: string): Promise<void> {
  const db = getFirestore();
  const snapshot = await db
    .collection(COLLECTIONS.organizerApplications)
    .where('applicantUid', '==', uid)
    .get();

  if (snapshot.empty) {
    return;
  }

  let batch = db.batch();
  let batchSize = 0;

  for (const applicationDoc of snapshot.docs) {
    batch.delete(applicationDoc.ref);
    batchSize += 1;

    if (batchSize >= 400) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }
}

async function deleteUserNotifications(uid: string): Promise<void> {
  const db = getFirestore();
  const notificationsRef = db
    .collection(COLLECTIONS.users)
    .doc(uid)
    .collection(COLLECTIONS.userNotifications);

  const snapshot = await notificationsRef.get();
  if (snapshot.empty) {
    return;
  }

  let batch = db.batch();
  let batchSize = 0;

  for (const notificationDoc of snapshot.docs) {
    batch.delete(notificationDoc.ref);
    batchSize += 1;

    if (batchSize >= 400) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }
}

async function deleteProfileAvatar(uid: string): Promise<void> {
  const bucket = getStorage().bucket();
  await bucket.file(`profiles/${uid}/avatar.jpg`).delete({ ignoreNotFound: true });
}

async function deleteSelfAdminDocument(uid: string): Promise<void> {
  const db = getFirestore();
  const adminRef = db.collection(COLLECTIONS.admins).doc(uid);
  const adminSnapshot = await adminRef.get();

  if (!adminSnapshot.exists) {
    return;
  }

  await adminRef.delete();
}

function readAuthErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }

  return 'unknown_error';
}

export type AccountDeletionFinalization = {
  deleteAuthUser: (uid: string) => Promise<void>;
  deleteUserDocument: () => Promise<void>;
  deleteSelfAdminDocument: (uid: string) => Promise<void>;
  userDocumentExists: () => Promise<boolean>;
};

/**
 * Auth removal, user profile delete, self admin doc delete, then verify profile is gone.
 */
export async function finalizeAccountDeletion(
  uid: string,
  finalization: AccountDeletionFinalization,
): Promise<{ ok: true }> {
  await finalization.deleteAuthUser(uid);

  try {
    await finalization.deleteUserDocument();
  } catch (error) {
    console.error(
      '[deleteUserAccount] Firestore user profile deletion failed after Auth removal.',
      readAuthErrorCode(error),
    );
    throw new HttpsError(
      'internal',
      'Kontot kunde inte tas bort helt. Kontakta support om problemet kvarstår.',
    );
  }

  await finalization.deleteSelfAdminDocument(uid);

  if (await finalization.userDocumentExists()) {
    console.error('[deleteUserAccount] User profile still exists after deletion.', uid);
    throw new HttpsError(
      'internal',
      'Kontot kunde inte tas bort helt. Kontakta support om problemet kvarstår.',
    );
  }

  return { ok: true as const };
}

/**
 * Deletes the Firebase Auth user. Fails closed except when the account is already gone.
 */
async function deleteAuthUser(uid: string): Promise<void> {
  try {
    await getAuth().deleteUser(uid);
  } catch (error) {
    const code = readAuthErrorCode(error);
    if (code === 'auth/user-not-found') {
      return;
    }

    console.error('[deleteUserAccount] Auth deletion failed.', code);
    throw new HttpsError(
      'internal',
      'Kunde inte ta bort inloggningen. Kontakta support om problemet kvarstår.',
    );
  }
}

/**
 * Cascading account deletion: anonymizes bookings, removes PII, then deletes Auth user.
 * Must be called while the user is still authenticated.
 */
export const deleteUserAccount = onCall(europeWest1CallableOptions(), async (request) => {
  const uid = request.auth?.uid?.trim();
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Du måste vara inloggad för att ta bort kontot.');
  }

  await assertRateLimit({
    docPath: `${COLLECTIONS.users}/${uid}/security/deleteAccount`,
    cooldownMs: DELETE_COOLDOWN_MS,
  });

  const db = getFirestore();
  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const userSnapshot = await userRef.get();
  const userData = userSnapshot.data();
  const phoneNormalized =
    typeof userData?.phoneNormalized === 'string' ? userData.phoneNormalized.trim() : '';

  await anonymizeUserRegistrations(uid);
  await deleteUserReminderDeliveries(uid);
  await deleteUserOrganizerApplications(uid);
  await deleteUserNotifications(uid);
  await deleteProfileAvatar(uid);

  if (phoneNormalized) {
    await db.collection('phoneIndex').doc(phoneNormalized).delete();
  }

  // Auth before users/{uid} so Auth failure leaves the profile intact and the user can retry.
  return finalizeAccountDeletion(uid, {
    deleteAuthUser,
    deleteUserDocument: async () => {
      await userRef.delete();
    },
    deleteSelfAdminDocument,
    userDocumentExists: async () => (await userRef.get()).exists,
  });
});
