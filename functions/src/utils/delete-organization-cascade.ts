import type { CollectionReference, DocumentReference, Firestore, Query } from 'firebase-admin/firestore';

import { COLLECTIONS } from '../notifications/types';
import { ORGANIZER_ADMIN_ROLE } from './invite-organizer-admin-policy';
import {
  ACTIVITY_SUBCOLLECTIONS_TO_DELETE,
  collectAdminDocumentIdsForOrganizationDeletion,
} from './delete-organization-policy';

const BATCH_LIMIT = 400;

async function deleteQueryBatch(
  db: Firestore,
  query: Query,
): Promise<number> {
  const snapshot = await query.limit(BATCH_LIMIT).get();
  if (snapshot.empty) {
    return 0;
  }

  let batch = db.batch();
  let batchSize = 0;

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    batchSize += 1;

    if (batchSize >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  return snapshot.size;
}

async function deleteEntireCollection(
  db: Firestore,
  collectionRef: CollectionReference,
): Promise<void> {
  let deleted = BATCH_LIMIT;

  while (deleted >= BATCH_LIMIT) {
    deleted = await deleteQueryBatch(db, collectionRef);
  }
}

async function deleteActivitySubcollections(
  db: Firestore,
  activityRef: DocumentReference,
): Promise<void> {
  for (const subcollectionName of ACTIVITY_SUBCOLLECTIONS_TO_DELETE) {
    await deleteEntireCollection(db, activityRef.collection(subcollectionName));
  }
}

export type DeleteOrganizationCascadeResult = {
  deletedAdminCount: number;
  deletedActivityCount: number;
};

/**
 * Deletes org admins (Firestore only), activities with subcollections, then the org document.
 * Does not modify Firebase Auth users.
 */
export async function deleteOrganizationCascade(
  db: Firestore,
  organizationId: string,
): Promise<DeleteOrganizationCascadeResult> {
  const adminsSnapshot = await db
    .collection(COLLECTIONS.admins)
    .where('organizationId', '==', organizationId)
    .where('role', '==', ORGANIZER_ADMIN_ROLE)
    .get();

  const adminIds = collectAdminDocumentIdsForOrganizationDeletion(
    adminsSnapshot.docs.map((document) => ({
      uid: document.id,
      data: document.data(),
    })),
    organizationId,
  );

  let batch = db.batch();
  let batchSize = 0;

  for (const adminUid of adminIds) {
    batch.delete(db.collection(COLLECTIONS.admins).doc(adminUid));
    batchSize += 1;

    if (batchSize >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }

  if (batchSize > 0) {
    await batch.commit();
  }

  const activitiesSnapshot = await db
    .collection(COLLECTIONS.activities)
    .where('organizationId', '==', organizationId)
    .get();

  for (const activityDoc of activitiesSnapshot.docs) {
    await deleteActivitySubcollections(db, activityDoc.ref);
    await activityDoc.ref.delete();
  }

  await db.collection(COLLECTIONS.organizations).doc(organizationId).delete();

  return {
    deletedAdminCount: adminIds.length,
    deletedActivityCount: activitiesSnapshot.size,
  };
}
