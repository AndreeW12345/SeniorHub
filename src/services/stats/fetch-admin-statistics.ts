import { collection, getDocs } from 'firebase/firestore';

import {
  EMPTY_ADMIN_STATISTICS,
  type AdminStatistics,
  type PopularActivityStat,
} from '@/constants/admin-statistics';
import type { Activity } from '@/constants/activities';
import { FIRESTORE_COLLECTIONS } from '@/firebase/collections';
import { getFirestoreDb, isFirebaseConfigured } from '@/firebase/config';
import { mapActivityDocument } from '@/services/activities/map-activity-document';
import { mapRegistrationDocument } from '@/services/registrations/map-registration-document';
import {
  isActivityActive,
  isActivityCompleted,
  isActivityDateInLocalMonth,
  isDateInLocalMonth,
  parseFirestoreDate,
} from '@/utils/admin-statistics';

const POPULAR_ACTIVITIES_LIMIT = 8;

type ActivityStatsSource = {
  activity: Activity;
  createdAt: Date | null;
  isCancelledActivity: boolean;
};

function isCancelledActivityDocument(data: Record<string, unknown>): boolean {
  if (data.status === 'cancelled' || data.status === 'inställd' || data.status === 'installd') {
    return true;
  }

  if (data.cancelled === true || data.isCancelled === true) {
    return true;
  }

  return typeof data.cancelledAt === 'string' || parseFirestoreDate(data.cancelledAt) !== null;
}

/**
 * Loads admin statistics from existing Firestore activities and registrations.
 * No placeholder numbers – missing historical timestamps simply contribute 0.
 */
export async function fetchAdminStatistics(
  reference: Date = new Date(),
  options?: { organizationId?: string | null },
): Promise<AdminStatistics> {
  if (!isFirebaseConfigured()) {
    return EMPTY_ADMIN_STATISTICS;
  }

  const db = getFirestoreDb();
  if (!db) {
    return EMPTY_ADMIN_STATISTICS;
  }

  const organizationId = options?.organizationId?.trim() || null;

  const activitiesSnapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.activities));

  const activitySources: ActivityStatsSource[] = activitiesSnapshot.docs
    .map((document) => {
      const data = document.data() as Record<string, unknown>;
      const activity = mapActivityDocument(document.id, data);
      if (!activity) {
        return null;
      }

      if (organizationId && activity.organizationId?.trim() !== organizationId) {
        return null;
      }

      return {
        activity,
        createdAt: parseFirestoreDate(data.createdAt),
        isCancelledActivity: isCancelledActivityDocument(data),
      };
    })
    .filter((item): item is ActivityStatsSource => item !== null);

  const registrationSnapshots = await Promise.all(
    activitySources.map(async ({ activity }) => {
      const registrationsRef = collection(
        db,
        FIRESTORE_COLLECTIONS.activities,
        activity.id,
        FIRESTORE_COLLECTIONS.registrations,
      );

      try {
        const snapshot = await getDocs(registrationsRef);
        return snapshot.docs
          .map((document) => {
            const data = document.data() as Record<string, unknown>;
            const registration = mapRegistrationDocument(document.id, activity.id, data);
            if (!registration) {
              return null;
            }

            return {
              registration,
              cancelledAt: parseFirestoreDate(data.cancelledAt),
              promotedAt: parseFirestoreDate(data.promotedAt),
            };
          })
          .filter(
            (
              item,
            ): item is {
              registration: NonNullable<ReturnType<typeof mapRegistrationDocument>>;
              cancelledAt: Date | null;
              promotedAt: Date | null;
            } => item !== null,
          );
      } catch (error) {
        console.warn(
          '[SeniorHub] Kunde inte hämta anmälningar för statistik:',
          activity.id,
          error,
        );
        return [];
      }
    }),
  );

  let totalRegisteredParticipants = 0;
  let totalWaitlist = 0;
  let cancellationsThisMonth = 0;
  let waitlistPromotionsThisMonth = 0;
  let occupancySum = 0;
  let occupancyCount = 0;

  const popularCandidates: PopularActivityStat[] = [];

  activitySources.forEach((source, index) => {
    const rows = registrationSnapshots[index] ?? [];
    const registeredCount = rows.filter(
      (row) => row.registration.status === 'registered',
    ).length;
    const waitlistCount = rows.filter((row) => row.registration.status === 'waitlist').length;

    totalRegisteredParticipants += registeredCount;
    totalWaitlist += waitlistCount;

    for (const row of rows) {
      if (
        row.registration.status === 'cancelled' &&
        row.cancelledAt &&
        isDateInLocalMonth(row.cancelledAt, reference)
      ) {
        cancellationsThisMonth += 1;
      }

      if (row.promotedAt && isDateInLocalMonth(row.promotedAt, reference)) {
        waitlistPromotionsThisMonth += 1;
      }
    }

    const maxParticipants = source.activity.maxParticipants;
    const hasLimit =
      source.activity.hasParticipantLimit === true &&
      typeof maxParticipants === 'number' &&
      maxParticipants > 0;

    if (hasLimit) {
      occupancySum += Math.min(1, registeredCount / maxParticipants);
      occupancyCount += 1;
    }

    popularCandidates.push({
      id: source.activity.id,
      title: source.activity.title,
      participantCount: registeredCount,
    });
  });

  const activeActivities = activitySources.filter(
    (source) => !source.isCancelledActivity && isActivityActive(source.activity.date, reference),
  ).length;

  const cancelledActivities = activitySources.filter(
    (source) => source.isCancelledActivity,
  ).length;

  const createdActivitiesThisMonth = activitySources.filter(
    (source) => source.createdAt !== null && isDateInLocalMonth(source.createdAt, reference),
  ).length;

  const completedActivitiesThisMonth = activitySources.filter(
    (source) =>
      !source.isCancelledActivity &&
      isActivityDateInLocalMonth(source.activity.date, reference) &&
      isActivityCompleted(source.activity.date, reference),
  ).length;

  const averageOccupancyPercent =
    occupancyCount > 0 ? Math.round((occupancySum / occupancyCount) * 100) : 0;

  const popularActivities = [...popularCandidates]
    .filter((activity) => activity.participantCount >= 1)
    .sort((a, b) => {
      if (b.participantCount !== a.participantCount) {
        return b.participantCount - a.participantCount;
      }
      return a.title.localeCompare(b.title, 'sv');
    })
    .slice(0, POPULAR_ACTIVITIES_LIMIT);

  return {
    activeActivities,
    totalRegisteredParticipants,
    averageOccupancyPercent,
    totalWaitlist,
    cancelledActivities,
    popularActivities,
    thisMonth: {
      createdActivities: createdActivitiesThisMonth,
      completedActivities: completedActivitiesThisMonth,
      cancellations: cancellationsThisMonth,
      waitlistPromotions: waitlistPromotionsThisMonth,
    },
  };
}
