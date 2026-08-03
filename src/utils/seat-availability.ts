import type { Activity } from '@/constants/activities';
import {
  getActivityMaxParticipants,
  getActivityParticipantCount,
  hasActivityParticipantLimit,
  isActivityRegistrationRequired,
} from '@/utils/activity-registration';
import { formatWaitlistCountLabel } from '@/utils/waitlist';

export type SeatAvailability =
  | { kind: 'hidden' }
  | { kind: 'unlimited'; label: string; lines: string[]; isFull: false }
  | {
      kind: 'limited';
      booked: number;
      max: number;
      remaining: number;
      isFull: boolean;
      label: string;
      lines: string[];
    };

type LimitedSeatLabelOptions = {
  /** Live waitlist size; when omitted, full activities only show "Väntelista tillgänglig". */
  waitlistCount?: number;
  /** When true, advertise waitlist on full SeniorHub activities even if count is 0. */
  waitlistAvailable?: boolean;
};

/** Builds the seat/waitlist status lines shown on activity cards and detail. */
function getLimitedSeatLines(
  booked: number,
  max: number,
  options?: LimitedSeatLabelOptions,
): string[] {
  const remaining = Math.max(0, max - booked);
  const lines = [`${booked} av ${max} platser bokade`];

  if (remaining === 0) {
    lines.push('Fullbokad');

    const waitlistCount =
      typeof options?.waitlistCount === 'number' && Number.isFinite(options.waitlistCount)
        ? Math.max(0, Math.floor(options.waitlistCount))
        : null;

    if (waitlistCount !== null && waitlistCount > 0) {
      lines.push(formatWaitlistCountLabel(waitlistCount));
    } else if (options?.waitlistAvailable) {
      lines.push('Väntelista tillgänglig');
    }
  } else {
    lines.push(`${remaining} ${remaining === 1 ? 'plats' : 'platser'} kvar`);

    const waitlistCount =
      typeof options?.waitlistCount === 'number' && Number.isFinite(options.waitlistCount)
        ? Math.max(0, Math.floor(options.waitlistCount))
        : 0;

    if (waitlistCount > 0) {
      lines.push(formatWaitlistCountLabel(waitlistCount));
    }
  }

  return lines;
}

function getLimitedSeatLabel(booked: number, max: number, options?: LimitedSeatLabelOptions): string {
  return getLimitedSeatLines(booked, max, options).join(' · ');
}

/**
 * Builds seat availability for UI from an activity + booked count.
 * `bookedCount` should come from registrations with status "registered" when available.
 */
export function getSeatAvailability(
  activity: Activity,
  bookedCount?: number,
  options?: LimitedSeatLabelOptions,
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
    const lines = getLimitedSeatLines(booked, max, options);

    return {
      kind: 'limited',
      booked,
      max,
      remaining,
      isFull,
      label: getLimitedSeatLabel(booked, max, options),
      lines,
    };
  }

  if (isActivityRegistrationRequired(activity)) {
    return {
      kind: 'unlimited',
      label: 'Obegränsat antal platser',
      lines: ['Obegränsat antal platser'],
      isFull: false,
    };
  }

  return { kind: 'hidden' };
}

export function isSeatAvailabilityFull(availability: SeatAvailability): boolean {
  return availability.kind === 'limited' && availability.isFull;
}
