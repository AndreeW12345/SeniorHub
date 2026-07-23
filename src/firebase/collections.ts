/** Firestore collection names used by SeniorHub. */
export const FIRESTORE_COLLECTIONS = {
  activities: 'activities',
  organizers: 'organizers',
  /**
   * Device/installation docs for Expo push tokens (no end-user Auth).
   * Document id = stable local device id.
   */
  users: 'users',
  /** Subcollection under each activity: activities/{id}/registrations */
  registrations: 'registrations',
} as const;
