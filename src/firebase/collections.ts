/** Firestore collection names used by SeniorHub. */
export const FIRESTORE_COLLECTIONS = {
  activities: 'activities',
  organizers: 'organizers',
  /**
   * Device/installation docs for Expo push tokens (no end-user Auth).
   * Document id = stable local device id.
   */
  users: 'users',
  /**
   * Signed-in admin profiles (document id = Firebase Auth uid).
   * Holds organizationId + role for multi-tenant admin filtering.
   */
  admins: 'admins',
  /** Tenant organizations (municipalities, associations). */
  organizations: 'organizations',
  /** Subcollection under each activity: activities/{id}/registrations */
  registrations: 'registrations',
  /** Subcollection under each activity: activities/{id}/announcements */
  announcements: 'announcements',
} as const;
