import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { isAdminEmailAllowed } from '@/services/admin/ensure-default-admin-account';

type NotifyOrganizerBookingInput = {
  activityId: string;
  registrationId: string;
  userName: string;
};

/**
 * Writes an organizer booking notification to Firestore inbox(es):
 * users/{adminUid}/notifications/{stableId}
 *
 * Mirrors the Cloud Function trigger so admins receive inbox entries even
 * before functions are deployed. Uses merge + stable id for deduplication.
 */
export async function notifyOrganizerBookingInFirestore(
  input: NotifyOrganizerBookingInput,
): Promise<void> {
  const activityId = input.activityId.trim();
  const registrationId = input.registrationId.trim();
  const userName = input.userName.trim() || 'Någon';

  if (!activityId || !registrationId || !isFirebaseConfigured()) {
    return;
  }

  const db = getFirestoreDb();
  if (!db) {
    return;
  }

  try {
    const activitySnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.activities, activityId));
    if (!activitySnap.exists()) {
      return;
    }

    const activityData = activitySnap.data();
    const organizationId =
      typeof activityData.organizationId === 'string' ? activityData.organizationId.trim() : '';

    if (!organizationId) {
      console.warn(
        '[SeniorHub] Kunde inte notifiera arrangör – aktiviteten saknar organizationId:',
        activityId,
      );
      return;
    }

    const activityTitle =
      typeof activityData.title === 'string' && activityData.title.trim().length > 0
        ? activityData.title.trim()
        : 'aktiviteten';

    const adminsSnap = await getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.admins),
        where('organizationId', '==', organizationId),
      ),
    );

    if (adminsSnap.empty) {
      console.warn(
        '[SeniorHub] Kunde inte notifiera arrangör – inga admins för organisation:',
        organizationId,
      );
      return;
    }

    const stableId = `organizer-booking-${activityId}-${registrationId}`;
    const title = '🎉 Ny bokning!';
    const description = `${userName} har bokat din aktivitet "${activityTitle}".`;

    await Promise.all(
      adminsSnap.docs.map(async (adminDoc) => {
        const adminUid = adminDoc.id.trim();
        if (!adminUid) {
          return;
        }

        const adminEmail =
          typeof adminDoc.data().email === 'string' ? adminDoc.data().email : null;

        if (!isAdminEmailAllowed(adminEmail)) {
          return;
        }

        await setDoc(
          doc(
            db,
            FIRESTORE_COLLECTIONS.users,
            adminUid,
            FIRESTORE_COLLECTIONS.userNotifications,
            stableId,
          ),
          {
            icon: '🎉',
            title,
            description,
            type: 'organizer_booking',
            read: false,
            createdAt: serverTimestamp(),
            activityId,
          },
          { merge: true },
        );
      }),
    );
  } catch (error) {
    console.warn('[SeniorHub] Kunde inte skriva arrangörsnotis till Firestore:', error);
  }
}
