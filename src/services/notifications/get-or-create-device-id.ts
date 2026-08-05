import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = '@seniorhub/device-id';

function createDeviceId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `device_${timePart}_${randomPart}`;
}

/** Reads a previously stored installation id without creating a new one. */
export async function readStoredDeviceId(): Promise<string | null> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  const trimmed = existing?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Stable installation id used for push-token documents and legacy profile migration.
 * User profiles now use Firebase Auth `uid` (`users/{uid}`).
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await readStoredDeviceId();
  if (existing) {
    return existing;
  }

  const nextId = createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}
