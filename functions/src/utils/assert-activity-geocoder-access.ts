import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

import { COLLECTIONS } from '../notifications/types';

function isOrganizerUser(data: Record<string, unknown> | undefined): boolean {
  const role = data?.role;
  const organizationId = data?.organizerOrganizationId;
  return (
    role === 'organizer' &&
    typeof organizationId === 'string' &&
    organizationId.trim().length > 0
  );
}

/**
 * Ensures the caller can geocode activity locations (organizer or platform admin).
 */
export async function assertActivityGeocoderAccess(uid: string): Promise<void> {
  const db = getFirestore();

  const adminSnapshot = await db.collection(COLLECTIONS.admins).doc(uid).get();
  if (adminSnapshot.exists) {
    return;
  }

  const userSnapshot = await db.collection(COLLECTIONS.users).doc(uid).get();
  if (userSnapshot.exists && isOrganizerUser(userSnapshot.data() as Record<string, unknown>)) {
    return;
  }

  throw new HttpsError('permission-denied', 'Du har inte behörighet för den här åtgärden.');
}