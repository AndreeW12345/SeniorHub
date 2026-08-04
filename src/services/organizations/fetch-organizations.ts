import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

import type { Organization } from '@/constants/organizations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapOrganizationDocument } from '@/services/organizations/map-organization-document';

export async function fetchOrganizationByIdFromFirestore(
  organizationId: string,
): Promise<Organization | null> {
  const trimmed = organizationId.trim();
  if (!trimmed || !isFirebaseConfigured()) {
    return null;
  }

  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.organizations, trimmed));
  if (!snapshot.exists()) {
    return null;
  }

  return mapOrganizationDocument(snapshot.id, snapshot.data());
}

export async function fetchOrganizationsFromFirestore(): Promise<Organization[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = getFirestoreDb();
  if (!db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.organizations));

  return snapshot.docs
    .map((document) => mapOrganizationDocument(document.id, document.data()))
    .filter((organization): organization is Organization => organization !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}
