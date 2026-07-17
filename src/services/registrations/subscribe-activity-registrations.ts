import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

import type { ActivityRegistration, RegistrationStatus } from '@/constants/registrations';
import { DEFAULT_REGISTRATION_STATUS } from '@/constants/registrations';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapRegistrationDocument } from '@/services/registrations/map-registration-document';

export type SubscribeActivityRegistrationsOptions = {
  includeStatuses?: RegistrationStatus[];
};

function mapRegistrationDocs(
  activityId: string,
  docs: { id: string; data: () => Record<string, unknown> }[],
  includeStatuses: RegistrationStatus[],
): ActivityRegistration[] {
  return docs
    .map((document) => mapRegistrationDocument(document.id, activityId, document.data()))
    .filter((registration): registration is ActivityRegistration => registration !== null)
    .filter((registration) => includeStatuses.includes(registration.status));
}

/**
 * Live subscription to an activity's registrations subcollection.
 * Used by admin lists and seat availability so UI updates without reload.
 */
export function subscribeActivityRegistrations(
  activityId: string,
  onUpdate: (registrations: ActivityRegistration[]) => void,
  onError?: (error: Error) => void,
  options?: SubscribeActivityRegistrationsOptions,
): Unsubscribe {
  const trimmedActivityId = activityId.trim();
  const includeStatuses = options?.includeStatuses ?? [DEFAULT_REGISTRATION_STATUS];

  if (!trimmedActivityId || !isFirebaseConfigured()) {
    onUpdate([]);
    return () => undefined;
  }

  const db = getFirestoreDb();
  if (!db) {
    onUpdate([]);
    return () => undefined;
  }

  const registrationsRef = collection(
    db,
    FIRESTORE_COLLECTIONS.activities,
    trimmedActivityId,
    FIRESTORE_COLLECTIONS.registrations,
  );

  let activeUnsub: Unsubscribe | null = null;

  const subscribeUnordered = () => {
    activeUnsub = onSnapshot(
      registrationsRef,
      (snapshot) => {
        const mapped = mapRegistrationDocs(trimmedActivityId, snapshot.docs, includeStatuses).sort(
          (a, b) => b.registeredAt.getTime() - a.registeredAt.getTime(),
        );
        onUpdate(mapped);
      },
      (fallbackError) => {
        console.warn('[SeniorHub] Kunde inte lyssna på anmälningar:', fallbackError);
        onError?.(fallbackError);
        onUpdate([]);
      },
    );
  };

  activeUnsub = onSnapshot(
    query(registrationsRef, orderBy('registeredAt', 'desc')),
    (snapshot) => {
      onUpdate(mapRegistrationDocs(trimmedActivityId, snapshot.docs, includeStatuses));
    },
    (error) => {
      console.warn(
        '[SeniorHub] Live-hämtning med sortering misslyckades, faller tillbaka:',
        error,
      );
      activeUnsub?.();
      subscribeUnordered();
    },
  );

  return () => {
    activeUnsub?.();
  };
}
