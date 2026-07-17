/** Firestore collection names used by SeniorHub. */
export const FIRESTORE_COLLECTIONS = {
  activities: 'activities',
  organizers: 'organizers',
  /** Subcollection under each activity: activities/{id}/registrations */
  registrations: 'registrations',
} as const;
