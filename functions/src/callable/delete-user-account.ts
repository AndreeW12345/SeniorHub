import { getAuth } from 'firebase-admin/auth';
import { FieldPath, FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { COLLECTIONS } from '../notifications/types';
import { europeWest1CallableOptions } from '../config/callable-options';
import { assertRateLimit } from '../utils/rate-limit';

const DELETE_COOLDOWN_MS = 60_000;
const ANONYMIZED_NAME = 'Raderad användare';

async function anonymizeUserRegistrations(uid: string): Promise<void> {
  const db = getFirestore();
  const snapshot = await db
    .collectionGroup(COLLECTIONS.registrations)
    .where(FieldPath.documentId(), '==', uid)
    .get();

  if (snapshot.empty) {
    return;
  }

  let batch = db.batch();
  let batchSize = 0;

  for (const registrationDoc of snapshot.docs) {
    const status = typeof registrationDoc.data().status === 'string'
      ? registrationDoc.data().status.trim()
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

  await anonymizeUserRegistrations(uid);
  await deleteUserNotifications(uid);
  await deleteProfileAvatar(uid);
  await userRef.delete();

  try {
    await getAuth().deleteUser(uid);
  } catch (error) {
    console.error('[deleteUserAccount] Auth deletion failed:', error);
    throw new HttpsError(
      'internal',
      'Kunde inte ta bort inloggningen. Kontakta support om problemet kvarstår.',
    );
  }

  return { ok: true as const };
});
