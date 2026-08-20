import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import {
  ORGANIZER_APPLICATION_STATUS,
  type OrganizerApplicationFormInput,
  buildOrganizerApplicationDescription,
} from '@/constants/organizer-application';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';

export type SubmitOrganizerApplicationResult =
  | { ok: true; applicationId: string }
  | { ok: false; errorMessage: string };

export async function submitOrganizerApplication(
  input: OrganizerApplicationFormInput,
): Promise<SubmitOrganizerApplicationResult> {
  const name = input.contactPerson.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const organization = input.organization.trim();
  const description = buildOrganizerApplicationDescription(input);

  if (!name || !email || !phone || !organization || !description.trim()) {
    return { ok: false, errorMessage: 'Fyll i alla obligatoriska fält.' };
  }

  if (!isFirebaseConfigured()) {
    return { ok: false, errorMessage: 'Firebase är inte konfigurerat.' };
  }

  const db = getFirestoreDb();
  if (!db) {
    return { ok: false, errorMessage: 'Firestore kunde inte initieras.' };
  }

  try {
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.organizerApplications), {
      name,
      email,
      phone,
      organization,
      description,
      createdAt: serverTimestamp(),
      status: ORGANIZER_APPLICATION_STATUS.new,
    });

    return { ok: true, applicationId: docRef.id };
  } catch (error) {
    return {
      ok: false,
      errorMessage:
        error instanceof Error ? error.message : 'Kunde inte skicka ansökan. Försök igen senare.',
    };
  }
}
