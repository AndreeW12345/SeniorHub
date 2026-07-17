import type { Activity } from '@/constants/activities';
import { DEFAULT_REGISTRATION_METHOD, type RegistrationMethod } from '@/constants/membership';

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

export function getActivityMembershipOrganization(activity: Activity): string | null {
  const organization = activity.membershipOrganization?.trim();
  return organization && organization.length > 0 ? organization : null;
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

export function isActivityAtCapacity(activity: Activity): boolean {
  const maxParticipants = getActivityMaxParticipants(activity);
  if (maxParticipants === null) {
    return false;
  }

  return getActivityParticipantCount(activity) >= maxParticipants;
}

export function isActivityFull(activity: Activity): boolean {
  if (!isActivityRegistrationRequired(activity) || !hasActivityParticipantLimit(activity)) {
    return false;
  }

  return isActivityAtCapacity(activity);
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

function getBookingStatusText(participantCount: number, maxParticipants: number): string {
  const remainingSeats = Math.max(0, maxParticipants - participantCount);

  if (remainingSeats === 0) {
    return `0 av ${maxParticipants} platser kvar – Fullbokad`;
  }

  return `${remainingSeats} av ${maxParticipants} platser kvar`;
}

export type ActivityRegistrationDisplayOptions = {
  /** Prefer live registration count when available (status "registered"). */
  bookedCount?: number;
};

export function getActivityRegistrationDisplay(
  activity: Activity,
  options?: ActivityRegistrationDisplayOptions,
): ActivityRegistrationDisplay {
  const membershipRequired = isActivityMembershipRequired(activity);
  const registrationRequired = isActivityRegistrationRequired(activity);
  const hasParticipantLimit = hasActivityParticipantLimit(activity);
  const maxParticipants = getActivityMaxParticipants(activity);
  const organization = getActivityMembershipOrganization(activity);
  const lines: string[] = [];
  let isFull = false;

  if (!membershipRequired && !registrationRequired && !hasParticipantLimit) {
    return { kind: 'hidden' };
  }

  if (membershipRequired && organization) {
    lines.push(`🔒 Endast för ${organization}-medlemmar`);
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

    lines.push(getBookingStatusText(participantCount, maxParticipants));
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
  if (!isActivityRegistrationRequired(activity)) {
    return null;
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

export function getActivityMembershipUrl(activity: Activity): string | null {
  const url = activity.membershipUrl?.trim();
  return url && url.length > 0 ? url : null;
}

export function getActivityParticipationHelperText(
  activity: Activity,
  isConfirmedMember: boolean,
): string | null {
  if (!isActivityMembershipRequired(activity)) {
    return null;
  }

  const organization = getActivityMembershipOrganization(activity);
  if (!organization) {
    return null;
  }

  if (isConfirmedMember) {
    return 'Du uppfyller medlemskravet. Nästa steg är att anmäla dig.';
  }

  return `För att delta behöver du vara medlem i ${organization}. Därefter kan du anmäla dig till aktiviteten.`;
}
