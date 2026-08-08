/** Legacy device-wide inbox key – must not be shared between Firebase users. */
export const LEGACY_NOTIFICATIONS_STORAGE_KEY = '@seniorhub/notifications';

const USER_NOTIFICATIONS_STORAGE_PREFIX = '@seniorhub/notifications/';

/** Returns the AsyncStorage key for a signed-in user's inbox, or null when signed out. */
export function getNotificationsStorageKey(userId: string | null | undefined): string | null {
  const trimmed = userId?.trim();
  return trimmed ? `${USER_NOTIFICATIONS_STORAGE_PREFIX}${trimmed}` : null;
}
