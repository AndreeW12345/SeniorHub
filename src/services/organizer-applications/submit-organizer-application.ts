import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import {
  ORGANIZER_APPLICATION_STATUS,
  type OrganizerApplicationFormInput,
  buildOrganizerApplicationDescription,
} from '@/constants/organizer-application';
import { getFirebaseAuth } from '@/firebase';
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

  const auth = getFirebaseAuth();
  const currentUser = auth?.currentUser;
  if (!currentUser?.uid) {
    return { ok: false, errorMessage: 'Du måste vara inloggad för att skicka en ansökan.' };
  }

  const applicantUid = currentUser.uid.trim();

  if (!currentUser.emailVerified) {
    return {
      ok: false,
      errorMessage: 'Verifiera din e-postadress innan du skickar en arrangörsansökan.',
    };
  }

  const authEmail = currentUser.email?.trim().toLowerCase();
  if (!authEmail || authEmail !== email.toLowerCase()) {
    return {
      ok: false,
      errorMessage: 'Ansökan måste skickas med samma e-postadress som ditt inloggade konto.',
    };
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
      applicantUid,
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
