import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PENDING_ACTIVITY_BOOKING_STORAGE_KEY,
  type PendingActivityBooking,
  type PendingActivityBookingMode,
} from '@/constants/auth';

export async function storePendingActivityBooking(
  activityId: string,
  mode: PendingActivityBookingMode,
): Promise<void> {
  const trimmedId = activityId.trim();
  if (!trimmedId) {
    return;
  }

  const payload: PendingActivityBooking = {
    activityId: trimmedId,
    mode,
  };

  await AsyncStorage.setItem(PENDING_ACTIVITY_BOOKING_STORAGE_KEY, JSON.stringify(payload));
}

export async function readPendingActivityBooking(): Promise<PendingActivityBooking | null> {
  const raw = await AsyncStorage.getItem(PENDING_ACTIVITY_BOOKING_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const activityId = typeof record.activityId === 'string' ? record.activityId.trim() : '';
    const mode = record.mode;

    if (!activityId) {
      return null;
    }

    if (mode !== 'registered' && mode !== 'waitlist') {
      return { activityId, mode: 'registered' };
    }

    return { activityId, mode };
  } catch {
    return null;
  }
}

export async function clearPendingActivityBooking(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_ACTIVITY_BOOKING_STORAGE_KEY);
}
