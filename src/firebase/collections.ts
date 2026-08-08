/** Firestore collection names used by SeniorHub. */
export const FIRESTORE_COLLECTIONS = {
  activities: 'activities',
  organizers: 'organizers',
  /**
   * Device/installation docs and Auth user docs for push tokens + profile.
   * Document id = stable local device id or Firebase Auth uid.
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
  /** Subcollection under each user: users/{uid}/notifications */
  userNotifications: 'notifications',
  /** Tracks server-delivered reminders: activities/{id}/reminderDeliveries */
  reminderDeliveries: 'reminderDeliveries',
} as const;
