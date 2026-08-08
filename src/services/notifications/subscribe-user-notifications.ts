import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe,
} from 'firebase/firestore';

import type { NotificationType } from '@/constants/notifications';
import { NOTIFICATION_TYPES } from '@/constants/notifications';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb } from '@/firebase/config';

export type RemoteUserNotification = {
  id: string;
  icon: string;
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
  type: NotificationType;
  activityId?: string;
};

function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && NOTIFICATION_TYPES.includes(value as NotificationType);
}

function readCreatedAt(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function mapRemoteNotification(
  id: string,
  data: Record<string, unknown>,
): RemoteUserNotification | null {
  const icon = typeof data.icon === 'string' ? data.icon : '';
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const type = isNotificationType(data.type) ? data.type : null;
  const createdAt = readCreatedAt(data.createdAt);
  const activityId =
    typeof data.activityId === 'string' && data.activityId.trim().length > 0
      ? data.activityId.trim()
      : undefined;

  if (!icon || !title || !description || !type || !createdAt) {
    return null;
  }

  return {
    id,
    icon,
    title,
    description,
    createdAt,
    read: data.read === true,
    type,
    activityId,
  };
}

/** Subscribes to server-delivered inbox notifications for a signed-in user. */
export function subscribeUserNotifications(
  userId: string,
  onChange: (notifications: RemoteUserNotification[]) => void,
): Unsubscribe | null {
  const db = getFirestoreDb();
  const trimmedId = userId.trim();

  if (!db || !trimmedId) {
    return null;
  }

  const notificationsRef = collection(
    db,
    FIRESTORE_COLLECTIONS.users,
    trimmedId,
    FIRESTORE_COLLECTIONS.userNotifications,
  );

  const notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    notificationsQuery,
    (snapshot) => {
      const notifications = snapshot.docs
        .map((document) => mapRemoteNotification(document.id, document.data()))
        .filter((item): item is RemoteUserNotification => item !== null);

      onChange(notifications);
    },
    (error) => {
      console.warn('[SeniorHub] Kunde inte prenumerera på fjärrnotiser:', error);
      onChange([]);
    },
  );
}
