import type { Activity } from '@/constants/activities';
import { createActivityAnnouncement } from '@/services/announcements';
import { fetchActivitiesBySeriesIdFromFirestore } from '@/services/activities/fetch-activities';
import type { ActivityFormInput } from '@/services/activities/activity-form-data';
import {
  buildActivityUpdateAnnouncementContent,
  detectImportantActivityChanges,
  type ImportantActivityFields,
} from '@/utils/activity-update-notifications';

function toImportantFields(input: {
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress?: string | null;
  isCancelled?: boolean | null;
}): ImportantActivityFields {
  return {
    title: input.title,
    date: input.date,
    time: input.time,
    location: input.location,
    fullAddress: input.fullAddress ?? null,
    isCancelled: input.isCancelled === true,
  };
}

function toImportantFieldsFromActivity(activity: Activity): ImportantActivityFields {
  return toImportantFields({
    title: activity.title,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    fullAddress: activity.fullAddress ?? activity.address ?? null,
    isCancelled: activity.isCancelled === true,
  });
}

async function createUpdateAnnouncementForActivity(
  activityId: string,
  previous: ImportantActivityFields,
  next: ImportantActivityFields,
): Promise<void> {
  const changes = detectImportantActivityChanges(previous, next);
  const content = buildActivityUpdateAnnouncementContent(next.title || previous.title, changes);

  if (!content) {
    return;
  }

  const result = await createActivityAnnouncement(activityId, {
    title: content.title,
    message: content.message,
    kind: 'activity_update',
    icon: content.icon,
  });

  if (!result.ok) {
    console.warn(
      '[SeniorHub] Kunde inte skapa aktivitetsuppdateringsnotis:',
      result.errorMessage,
    );
  }
}

export type NotifyActivityImportantUpdatesInput = {
  activityId: string;
  previous: ActivityFormInput;
  next: ActivityFormInput;
  /** When updating a whole series, create one announcement per affected occurrence. */
  seriesScope?: {
    seriesId: string;
  } | null;
};

/**
 * After a successful activity edit, creates announcement docs for important
 * field changes so booked participants can ingest them into Notiser.
 */
export async function notifyActivityImportantUpdates(
  input: NotifyActivityImportantUpdatesInput,
): Promise<void> {
  const previous = toImportantFields({
    title: input.previous.title,
    date: input.previous.date,
    time: input.previous.time,
    location: input.previous.location,
    fullAddress: input.previous.fullAddress ?? input.previous.address ?? null,
    isCancelled: input.previous.isCancelled === true,
  });
  const next = toImportantFields({
    title: input.next.title,
    date: input.next.date,
    time: input.next.time,
    location: input.next.location,
    fullAddress: input.next.fullAddress ?? input.next.address ?? null,
    isCancelled: input.next.isCancelled === true,
  });

  const seriesId = input.seriesScope?.seriesId?.trim();

  if (!seriesId) {
    await createUpdateAnnouncementForActivity(input.activityId, previous, next);
    return;
  }

  const seriesActivities = await fetchActivitiesBySeriesIdFromFirestore(seriesId);
  if (seriesActivities.length === 0) {
    await createUpdateAnnouncementForActivity(input.activityId, previous, next);
    return;
  }

  await Promise.all(
    seriesActivities.map(async (activity) => {
      if (activity.isRecurrenceException === true && activity.id !== input.activityId) {
        return;
      }

      const isOpenedOccurrence = activity.id === input.activityId;
      const previousFields = toImportantFieldsFromActivity(activity);
      const nextFields: ImportantActivityFields = {
        title: next.title,
        // Series updates keep each occurrence's own date except the opened one.
        date: isOpenedOccurrence ? next.date : activity.date,
        time: next.time,
        location: next.location,
        fullAddress: next.fullAddress,
        isCancelled: next.isCancelled,
      };

      await createUpdateAnnouncementForActivity(activity.id, previousFields, nextFields);
    }),
  );
}
