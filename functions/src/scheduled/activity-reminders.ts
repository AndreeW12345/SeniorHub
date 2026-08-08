import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

import {
  addDays,
  formatDateKey,
  parseActivityStartDate,
  readImportantActivityFields,
} from '../notifications/activity-fields';
import { deliverNotificationToMany } from '../notifications/send-fcm';
import {
  buildReminderStableId,
  reminderDayBeforePush,
  reminderOneHourPush,
} from '../notifications/templates';
import type { PushPayload, ReminderKind } from '../notifications/types';
import { COLLECTIONS } from '../notifications/types';
import { fetchRegisteredUserIdsForActivity } from '../notifications/deliver-events';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const DAY_BEFORE_WINDOW_MS = 2 * HOUR_MS;
const ONE_HOUR_WINDOW_MS = 15 * 60 * 1000;

async function wasReminderDelivered(
  activityId: string,
  userId: string,
  kind: ReminderKind,
): Promise<boolean> {
  const db = getFirestore();
  const deliveryId = `${userId}_${kind}`;
  const snap = await db
    .collection(COLLECTIONS.activities)
    .doc(activityId)
    .collection(COLLECTIONS.reminderDeliveries)
    .doc(deliveryId)
    .get();

  return snap.exists;
}

async function markReminderDelivered(
  activityId: string,
  userId: string,
  kind: ReminderKind,
): Promise<void> {
  const db = getFirestore();
  const deliveryId = `${userId}_${kind}`;

  await db
    .collection(COLLECTIONS.activities)
    .doc(activityId)
    .collection(COLLECTIONS.reminderDeliveries)
    .doc(deliveryId)
    .set({
      userId,
      kind,
      deliveredAt: FieldValue.serverTimestamp(),
    });
}

function isWithinWindow(targetMs: number, nowMs: number, windowMs: number): boolean {
  const delta = targetMs - nowMs;
  return delta >= 0 && delta <= windowMs;
}

async function processActivityReminders(
  activityId: string,
  fields: ReturnType<typeof readImportantActivityFields>,
  now: Date,
): Promise<void> {
  if (fields.isCancelled) {
    return;
  }

  const startDate = parseActivityStartDate(fields);
  if (!startDate) {
    return;
  }

  const nowMs = now.getTime();
  const startMs = startDate.getTime();
  const activityTitle = fields.title || 'aktiviteten';

  const userIds = await fetchRegisteredUserIdsForActivity(activityId);
  if (userIds.length === 0) {
    return;
  }

  const payloads: PushPayload[] = [];

  const dayBeforeTargetMs = startMs - DAY_MS;
  if (isWithinWindow(dayBeforeTargetMs, nowMs, DAY_BEFORE_WINDOW_MS)) {
    const content = reminderDayBeforePush(activityTitle);

    for (const userId of userIds) {
      if (await wasReminderDelivered(activityId, userId, 'day_before')) {
        continue;
      }

      payloads.push({
        userId,
        title: content.title,
        body: content.body,
        preferenceKey: 'dayBefore',
        inbox: {
          stableId: buildReminderStableId(activityId, 'day_before', userId),
          icon: content.icon,
          title: content.title,
          description: content.description,
          type: content.type,
          activityId,
        },
        data: { activityId, reminder: 'day_before' },
      });
    }
  }

  const oneHourTargetMs = startMs - HOUR_MS;
  if (isWithinWindow(oneHourTargetMs, nowMs, ONE_HOUR_WINDOW_MS)) {
    const content = reminderOneHourPush(activityTitle);

    for (const userId of userIds) {
      if (await wasReminderDelivered(activityId, userId, 'one_hour_before')) {
        continue;
      }

      payloads.push({
        userId,
        title: content.title,
        body: content.body,
        preferenceKey: 'oneHourBefore',
        inbox: {
          stableId: buildReminderStableId(activityId, 'one_hour_before', userId),
          icon: content.icon,
          title: content.title,
          description: content.description,
          type: content.type,
          activityId,
        },
        data: { activityId, reminder: 'one_hour_before' },
      });
    }
  }

  if (payloads.length > 0) {
    await deliverNotificationToMany(payloads);

    for (const payload of payloads) {
      const reminder = payload.data?.reminder;
      const userId = payload.userId;

      if (reminder === 'day_before') {
        await markReminderDelivered(activityId, userId, 'day_before');
      }

      if (reminder === 'one_hour_before') {
        await markReminderDelivered(activityId, userId, 'one_hour_before');
      }
    }
  }
}

export const scheduledActivityReminders = onSchedule('every 15 minutes', async () => {
  const db = getFirestore();
  const now = new Date();

  const todayKey = formatDateKey(now);
  const tomorrowKey = formatDateKey(addDays(now, 1));
  const dayAfterTomorrowKey = formatDateKey(addDays(now, 2));

  const dateKeys = [todayKey, tomorrowKey, dayAfterTomorrowKey];
  const snapshots = await Promise.all(
    dateKeys.map((dateKey) => db.collection(COLLECTIONS.activities).where('date', '==', dateKey).get()),
  );

  const seenActivityIds = new Set<string>();

  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      if (seenActivityIds.has(document.id)) {
        continue;
      }

      seenActivityIds.add(document.id);
      await processActivityReminders(document.id, readImportantActivityFields(document.data()), now);
    }
  }
});
