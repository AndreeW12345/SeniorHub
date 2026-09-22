import { collection, doc, getDoc, getDocs, getDocsFromServer } from 'firebase/firestore';

import type { Organization } from '@/constants/organizations';
import type { FetchOrganizationsOptions } from '@/constants/organizations-refresh-fetch';
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

  const db = await getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.organizations, trimmed));
  if (!snapshot.exists()) {
    return null;
  }

  return mapOrganizationDocument(snapshot.id, snapshot.data());
}

export async function fetchOrganizationsFromFirestore(
  options?: FetchOrganizationsOptions,
): Promise<Organization[]> {
  if (!isFirebaseConfigured()) {
    return [];
  }

  const db = await getFirestoreDb();
  if (!db) {
    return [];
  }

  const organizationsRef = collection(db, FIRESTORE_COLLECTIONS.organizations);
  const snapshot =
    options?.source === 'server'
      ? await getDocsFromServer(organizationsRef)
      : await getDocs(organizationsRef);

  return snapshot.docs
    .map((document) => mapOrganizationDocument(document.id, document.data()))
    .filter((organization): organization is Organization => organization !== null)
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}
