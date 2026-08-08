import { getFirestore } from 'firebase-admin/firestore';

import { deliverNotificationToMany } from './send-fcm';
import { isAdminEmailAllowed } from './admin-allowlist';
import {
  activityCancelledPush,
  activityUpdatedPush,
  buildActivityUpdateStableId,
  organizerBookingPush,
} from './templates';
import type { ImportantActivityChange, PushPayload } from './types';
import { COLLECTIONS } from './types';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function fetchOrganizerUserIds(organizationId: string): Promise<string[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(COLLECTIONS.admins)
    .where('organizationId', '==', organizationId)
    .get();

  return snapshot.docs
    .map((document) => {
      const email =
        typeof document.data().email === 'string' ? document.data().email : null;
      const uid = document.id.trim();
      if (!uid || !email || !isAdminEmailAllowed(email)) {
        return null;
      }
      return uid;
    })
    .filter((uid): uid is string => uid !== null);
}

async function fetchRegisteredUserIds(activityId: string): Promise<string[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(COLLECTIONS.activities)
    .doc(activityId)
    .collection(COLLECTIONS.registrations)
    .where('status', '==', 'registered')
    .get();

  const userIds = new Set<string>();

  for (const document of snapshot.docs) {
    const userId = readString(document.data().userId);
    if (userId) {
      userIds.add(userId);
    }
  }

  return [...userIds];
}

export async function notifyOrganizerAboutBooking(params: {
  activityId: string;
  registrationId: string;
  activityTitle: string;
  organizationId: string;
  userName: string;
}): Promise<void> {
  const organizerUserIds = await fetchOrganizerUserIds(params.organizationId);
  if (organizerUserIds.length === 0) {
    return;
  }

  const content = organizerBookingPush(params.userName, params.activityTitle);
  const stableId = `organizer-booking-${params.activityId}-${params.registrationId}`;

  const payloads: PushPayload[] = organizerUserIds.map((userId) => ({
    userId,
    title: content.title,
    body: content.body,
    preferenceKey: 'organizerBookings',
    inbox: {
      stableId,
      icon: content.icon,
      title: content.title,
      description: content.description,
      type: content.type,
      activityId: params.activityId,
    },
    data: {
      activityId: params.activityId,
    },
  }));

  await deliverNotificationToMany(payloads);
}

export async function notifyRegisteredUsersAboutActivityChange(params: {
  activityId: string;
  activityTitle: string;
  change: ImportantActivityChange;
}): Promise<void> {
  const userIds = await fetchRegisteredUserIds(params.activityId);
  if (userIds.length === 0) {
    return;
  }

  const content =
    params.change === 'cancelled'
      ? activityCancelledPush(params.activityTitle)
      : activityUpdatedPush(params.activityTitle);

  const stableId = buildActivityUpdateStableId(params.activityId, params.change);

  const payloads: PushPayload[] = userIds.map((userId) => ({
    userId,
    title: content.title,
    body: content.body,
    preferenceKey: 'activityUpdates',
    inbox: {
      stableId,
      icon: content.icon,
      title: content.title,
      description: content.description,
      type: content.type,
      activityId: params.activityId,
    },
    data: {
      activityId: params.activityId,
      change: params.change,
    },
  }));

  await deliverNotificationToMany(payloads);
}

export async function fetchRegisteredUserIdsForActivity(activityId: string): Promise<string[]> {
  return fetchRegisteredUserIds(activityId);
}
