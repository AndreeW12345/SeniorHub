import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

import { isPushEnabled, normalizeNotificationPreferences } from './preferences';
import type { PushPayload } from './types';
import { COLLECTIONS } from './types';

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function collectTokens(data: FirebaseFirestore.DocumentData | undefined): string[] {
  if (!data) {
    return [];
  }

  const tokens = new Set<string>();
  const single = readString(data.fcmToken);
  if (single) {
    tokens.add(single);
  }

  if (Array.isArray(data.fcmTokens)) {
    for (const token of data.fcmTokens) {
      const normalized = readString(token);
      if (normalized) {
        tokens.add(normalized);
      }
    }
  }

  return [...tokens];
}

async function writeInboxNotification(payload: PushPayload): Promise<void> {
  if (payload.allowInbox === false) {
    return;
  }

  const db = getFirestore();
  const notificationRef = db
    .collection(COLLECTIONS.users)
    .doc(payload.userId)
    .collection(COLLECTIONS.userNotifications)
    .doc(payload.inbox.stableId);

  await notificationRef.set(
    {
      icon: payload.inbox.icon,
      title: payload.inbox.title,
      description: payload.inbox.description,
      type: payload.inbox.type,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      ...(payload.inbox.activityId ? { activityId: payload.inbox.activityId } : {}),
    },
    { merge: true },
  );
}

async function sendPushToUser(payload: PushPayload): Promise<void> {
  const db = getFirestore();
  const userDoc = await db.collection(COLLECTIONS.users).doc(payload.userId).get();
  const preferences = normalizeNotificationPreferences(userDoc.data()?.notificationPreferences);

  await writeInboxNotification(payload);

  if (payload.allowPush === false) {
    return;
  }

  if (!isPushEnabled(preferences, payload.preferenceKey)) {
    return;
  }

  const tokens = collectTokens(userDoc.data());
  if (tokens.length === 0) {
    return;
  }

  const messaging = getMessaging();

  await Promise.all(
    tokens.map(async (token) => {
      try {
        await messaging.send({
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            type: payload.inbox.type,
            ...(payload.inbox.activityId ? { activityId: payload.inbox.activityId } : {}),
            ...(payload.data ?? {}),
          },
        });
      } catch (error) {
        const code =
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code: unknown }).code)
            : '';

        if (code.includes('registration-token-not-registered')) {
          await db
            .collection(COLLECTIONS.users)
            .doc(payload.userId)
            .set(
              {
                fcmToken: FieldValue.delete(),
                fcmTokens: FieldValue.arrayRemove(token),
              },
              { merge: true },
            );
        }

        console.warn('[SeniorHub] FCM send failed:', payload.userId, error);
      }
    }),
  );
}

export async function deliverNotification(payload: PushPayload): Promise<void> {
  await sendPushToUser(payload);
}

export async function deliverNotificationToMany(payloads: PushPayload[]): Promise<void> {
  await Promise.all(payloads.map((payload) => deliverNotification(payload)));
}
