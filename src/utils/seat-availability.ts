import type { Activity } from '@/constants/activities';
import {
  getActivityMaxParticipants,
  getActivityParticipantCount,
  hasActivityParticipantLimit,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';

export type SeatAvailability =
  | { kind: 'hidden' }
  | { kind: 'unlimited'; label: string; isFull: false }
  | {
      kind: 'limited';
      booked: number;
      max: number;
      remaining: number;
      isFull: boolean;
      label: string;
    };

function getLimitedSeatLabel(booked: number, max: number): string {
  const remaining = Math.max(0, max - booked);

  if (remaining === 0) {
    return `0 av ${max} platser kvar – Fullbokad`;
  }

  return `${remaining} av ${max} platser kvar`;
}

/**
 * Builds seat availability for UI from an activity + booked count.
 * `bookedCount` should come from registrations with status "registered" when available.
 */
export function getSeatAvailability(
  activity: Activity,
  bookedCount?: number,
): SeatAvailability {
  const booked =
    typeof bookedCount === 'number' && Number.isFinite(bookedCount)
      ? Math.max(0, Math.floor(bookedCount))
      : getActivityParticipantCount(activity);

  if (hasActivityParticipantLimit(activity)) {
    const max = getActivityMaxParticipants(activity);
    if (max === null) {
      return { kind: 'hidden' };
    }

    const remaining = Math.max(0, max - booked);
    const isFull = remaining === 0;

    return {
      kind: 'limited',
      booked,
      max,
      remaining,
      isFull,
      label: getLimitedSeatLabel(booked, max),
    };
  }

  if (isActivityRegistrationRequired(activity)) {
    return {
      kind: 'unlimited',
      label: 'Obegränsat antal platser',
      isFull: false,
    };
  }

  return { kind: 'hidden' };
}

export function isSeatAvailabilityFull(availability: SeatAvailability): boolean {
  return availability.kind === 'limited' && availability.isFull;
}
