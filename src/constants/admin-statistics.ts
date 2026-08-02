export type PopularActivityStat = {
  id: string;
  title: string;
  participantCount: number;
};

export type AdminMonthStatistics = {
  createdActivities: number;
  completedActivities: number;
  cancellations: number;
  waitlistPromotions: number;
};

/** Aggregated admin dashboard metrics computed from Firestore. */
export type AdminStatistics = {
  activeActivities: number;
  totalRegisteredParticipants: number;
  /** Rounded whole percent, or 0 when no limited activities exist. */
  averageOccupancyPercent: number;
  totalWaitlist: number;
  cancelledActivities: number;
  popularActivities: PopularActivityStat[];
  thisMonth: AdminMonthStatistics;
};

export const EMPTY_ADMIN_STATISTICS: AdminStatistics = {
  activeActivities: 0,
  totalRegisteredParticipants: 0,
  averageOccupancyPercent: 0,
  totalWaitlist: 0,
  cancelledActivities: 0,
  popularActivities: [],
  thisMonth: {
    createdActivities: 0,
    completedActivities: 0,
    cancellations: 0,
    waitlistPromotions: 0,
  },
};
