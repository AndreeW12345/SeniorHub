import type { Activity } from '@/constants/activities';
import type { Organization } from '@/constants/organizations';
import { DEFAULT_REGISTRATION_METHOD } from '@/constants/membership';
import {
  resolveActivityMembershipOrganizationName,
  resolveActivityMembershipUrl,
} from '@/utils/activity-host';

export type ActivityRegistrationDisplay =
  | { kind: 'hidden' }
  | { kind: 'lines'; lines: string[]; isFull: boolean };

export type RegistrationAction =
  | { method: 'seniorhub' }
  | { method: 'external'; url: string }
  | { method: 'phone'; phone: string }
  | { method: 'email'; email: string };

export function isActivityRegistrationRequired(activity: Activity): boolean {
  return activity.registrationRequired === true;
}

export function isActivityMembershipRequired(activity: Activity): boolean {
  return activity.membershipRequired === true;
}

export function hasActivityParticipantLimit(activity: Activity): boolean {
  return activity.hasParticipantLimit === true;
}

export function getActivityMembershipOrganization(
  activity: Activity,
  organization?: Organization | null,
): string | null {
  return resolveActivityMembershipOrganizationName(activity, organization);
}

export function getActivityMembershipUrl(
  activity: Activity,
  organization?: Organization | null,
): string | null {
  return resolveActivityMembershipUrl(activity, organization);
}

export function getActivityParticipantCount(activity: Activity): number {
  if (
    typeof activity.participants === 'number' &&
    Number.isFinite(activity.participants) &&
    activity.participants >= 0
  ) {
    return Math.floor(activity.participants);
  }

  return 0;
}

export function getActivityMaxParticipants(activity: Activity): number | null {
  if (
    activity.hasParticipantLimit !== true ||
    typeof activity.maxParticipants !== 'number' ||
    !Number.isFinite(activity.maxParticipants) ||
    activity.maxParticipants <= 0
  ) {
    return null;
  }

  return Math.floor(activity.maxParticipants);
}

export function shouldShowActivityRegistrationSection(activity: Activity): boolean {
  return getActivityRegistrationDisplay(activity).kind !== 'hidden';
}

export function getActivityRegistrationSectionTitle(activity: Activity): string {
  const membership = isActivityMembershipRequired(activity);
  const registration = isActivityRegistrationRequired(activity);
  const limit = hasActivityParticipantLimit(activity);

  if (membership && registration) {
    return 'Så deltar du';
  }

  if (membership) {
    return 'Medlemskap';
  }

  if (registration) {
    return 'Anmälan';
  }

  if (limit) {
    return 'Platser';
  }

  return 'Information';
}

function getBookingStatusLines(
  participantCount: number,
  maxParticipants: number,
  options?: {
    waitlistCount?: number;
    waitlistAvailable?: boolean;
  },
): string[] {
  const remainingSeats = Math.max(0, maxParticipants - participantCount);
  const lines = [`${participantCount} av ${maxParticipants} platser bokade`];

  if (remainingSeats === 0) {
    lines.push('Fullbokad');

    const waitlistCount =
      typeof options?.waitlistCount === 'number' && Number.isFinite(options.waitlistCount)
        ? Math.max(0, Math.floor(options.waitlistCount))
        : null;

    if (waitlistCount !== null && waitlistCount > 0) {
      lines.push(
        `Väntelista: ${waitlistCount} ${waitlistCount === 1 ? 'person' : 'personer'}`,
      );
    } else if (options?.waitlistAvailable) {
      lines.push('Väntelista tillgänglig');
    }
  } else {
    lines.push(`${remainingSeats} ${remainingSeats === 1 ? 'plats' : 'platser'} kvar`);

    const waitlistCount =
      typeof options?.waitlistCount === 'number' && Number.isFinite(options.waitlistCount)
        ? Math.max(0, Math.floor(options.waitlistCount))
        : 0;

    if (waitlistCount > 0) {
      lines.push(
        `Väntelista: ${waitlistCount} ${waitlistCount === 1 ? 'person' : 'personer'}`,
      );
    }
  }

  return lines;
}

export type ActivityRegistrationDisplayOptions = {
  /** Prefer live registration count when available (status "registered"). */
  bookedCount?: number;
  /** Live waitlist size for SeniorHub activities. */
  waitlistCount?: number;
  /** Tenant organization profile used for membership copy when available. */
  organization?: Organization | null;
  /** When true, hide membership-required lines (user already confirmed). */
  confirmedMember?: boolean;
};

/** One-line availability label for activity list cards. */
export function getActivityCardAvailabilityLabel(
  activity: Activity,
  options?: Pick<ActivityRegistrationDisplayOptions, 'bookedCount'>,
): string | null {
  if (!hasActivityParticipantLimit(activity)) {
    return null;
  }

  const maxParticipants = getActivityMaxParticipants(activity);
  if (maxParticipants === null) {
    return null;
  }

  const participantCount =
    typeof options?.bookedCount === 'number' && Number.isFinite(options.bookedCount)
      ? Math.max(0, Math.floor(options.bookedCount))
      : getActivityParticipantCount(activity);
  const remainingSeats = Math.max(0, maxParticipants - participantCount);

  if (remainingSeats === 0) {
    return 'Fullbokad';
  }

  return `${remainingSeats} av ${maxParticipants} platser kvar`;
}

export function getActivityRegistrationDisplay(
  activity: Activity,
  options?: ActivityRegistrationDisplayOptions,
): ActivityRegistrationDisplay {
  const membershipRequired = isActivityMembershipRequired(activity);
  const registrationRequired = isActivityRegistrationRequired(activity);
  const hasParticipantLimit = hasActivityParticipantLimit(activity);
  const maxParticipants = getActivityMaxParticipants(activity);
  const organizationName = getActivityMembershipOrganization(activity, options?.organization);
  const lines: string[] = [];
  let isFull = false;

  if (!membershipRequired && !registrationRequired && !hasParticipantLimit) {
    return { kind: 'hidden' };
  }

  if (membershipRequired && organizationName && !options?.confirmedMember) {
    lines.push(`🔒 Endast för medlemmar i ${organizationName}`);
    lines.push('✏️ Medlemskap krävs');
  }

  if (registrationRequired) {
    lines.push('📝 Anmälan krävs');
  }

  if (hasParticipantLimit && maxParticipants !== null) {
    const participantCount =
      typeof options?.bookedCount === 'number' && Number.isFinite(options.bookedCount)
        ? Math.max(0, Math.floor(options.bookedCount))
        : getActivityParticipantCount(activity);
    isFull = participantCount >= maxParticipants;
    const waitlistAvailable =
      isFull && getActivityRegistrationAction(activity)?.method === 'seniorhub';

    lines.push(
      ...getBookingStatusLines(participantCount, maxParticipants, {
        waitlistCount: options?.waitlistCount,
        waitlistAvailable,
      }),
    );
  } else if (registrationRequired) {
    lines.push('Obegränsat antal platser');
  }

  if (lines.length === 0) {
    return { kind: 'hidden' };
  }

  return { kind: 'lines', lines, isFull };
}

/** Capacity check that can use a live booked count from registrations. */
export function isActivityFullWithBookedCount(
  activity: Activity,
  bookedCount?: number,
): boolean {
  if (!isActivityRegistrationRequired(activity) || !hasActivityParticipantLimit(activity)) {
    return false;
  }

  const maxParticipants = getActivityMaxParticipants(activity);
  if (maxParticipants === null) {
    return false;
  }

  const count =
    typeof bookedCount === 'number' && Number.isFinite(bookedCount)
      ? Math.max(0, Math.floor(bookedCount))
      : getActivityParticipantCount(activity);

  return count >= maxParticipants;
}

export function getActivityRegistrationAction(activity: Activity): RegistrationAction | null {
  const registrationRequired = isActivityRegistrationRequired(activity);
  const membershipRequired = isActivityMembershipRequired(activity);

  if (!registrationRequired && !membershipRequired) {
    return null;
  }

  // Membership-only activities still use the SeniorHub registration form after membership is confirmed.
  if (!registrationRequired && membershipRequired) {
    return { method: 'seniorhub' };
  }

  const method = activity.registrationMethod ?? DEFAULT_REGISTRATION_METHOD;

  if (method === 'external') {
    const url = activity.registrationUrl?.trim();
    return url ? { method: 'external', url } : null;
  }

  if (method === 'phone') {
    const phone = activity.registrationPhone?.trim();
    return phone ? { method: 'phone', phone } : null;
  }

  if (method === 'email') {
    const email = activity.registrationEmail?.trim();
    return email ? { method: 'email', email } : null;
  }

  return { method: 'seniorhub' };
}

export function getActivityParticipationHelperText(
  activity: Activity,
  isConfirmedMember: boolean,
  organization?: Organization | null,
): string | null {
  if (!isActivityMembershipRequired(activity)) {
    return null;
  }

  const organizationName = getActivityMembershipOrganization(activity, organization);
  if (!organizationName) {
    return null;
  }

  if (isConfirmedMember) {
    return null;
  }

  return 'För att delta behöver du först bli medlem.';
}
