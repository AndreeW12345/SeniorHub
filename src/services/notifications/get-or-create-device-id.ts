import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_STORAGE_KEY = '@seniorhub/device-id';

function createDeviceId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  const timePart = Date.now().toString(36);
  return `device_${timePart}_${randomPart}`;
}

/**
 * Stable installation id used as the Firestore "user" key for push tokens
 * (SeniorHub has no end-user Firebase Auth).
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (existing?.trim()) {
    return existing.trim();
  }

  const nextId = createDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, nextId);
  return nextId;
}
