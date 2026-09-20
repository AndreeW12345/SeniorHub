import { collection, onSnapshot, orderBy, query, type Unsubscribe } from 'firebase/firestore';

import type { ActivityAnnouncement } from '@/constants/announcements';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapAnnouncementDocument } from '@/services/announcements/map-announcement-document';

function mapAnnouncementDocs(
  activityId: string,
  docs: { id: string; data: () => Record<string, unknown> }[],
): ActivityAnnouncement[] {
  return docs
    .map((document) => mapAnnouncementDocument(document.id, activityId, document.data()))
    .filter((announcement): announcement is ActivityAnnouncement => announcement !== null);
}

/** Live subscription to an activity's announcements subcollection. */
export function subscribeActivityAnnouncements(
  activityId: string,
  onUpdate: (announcements: ActivityAnnouncement[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const trimmedActivityId = activityId.trim();

  if (!trimmedActivityId || !isFirebaseConfigured()) {
    onUpdate([]);
    return () => undefined;
  }

  let activeUnsub: Unsubscribe | null = null;
  let cancelled = false;

  void getFirestoreDb()
    .then((db) => {
      if (cancelled) {
        return;
      }

      if (!db) {
        onUpdate([]);
        return;
      }

      const announcementsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.activities,
        trimmedActivityId,
        FIRESTORE_COLLECTIONS.announcements,
      );

      const subscribeUnordered = () => {
        activeUnsub = onSnapshot(
          announcementsRef,
          (snapshot) => {
            const mapped = mapAnnouncementDocs(trimmedActivityId, snapshot.docs).sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            );
            onUpdate(mapped);
          },
          (fallbackError) => {
            console.warn('[SeniorHub] Kunde inte lyssna på meddelanden:', fallbackError);
            onError?.(fallbackError);
            onUpdate([]);
          },
        );
      };

      activeUnsub = onSnapshot(
        query(announcementsRef, orderBy('createdAt', 'desc')),
        (snapshot) => {
          onUpdate(mapAnnouncementDocs(trimmedActivityId, snapshot.docs));
        },
        (error) => {
          console.warn(
            '[SeniorHub] Live-hämtning av meddelanden med sortering misslyckades, faller tillbaka:',
            error,
          );
          activeUnsub?.();
          subscribeUnordered();
        },
      );
    })
    .catch((error) => {
      if (cancelled) {
        return;
      }

      onError?.(error instanceof Error ? error : new Error(String(error)));
      onUpdate([]);
    });

  return () => {
    cancelled = true;
    activeUnsub?.();
  };
}
