/** Registration statuses used by the booking system. */
export const REGISTRATION_STATUSES = ['registered', 'cancelled', 'waitlist'] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const DEFAULT_REGISTRATION_STATUS: RegistrationStatus = 'registered';

export type ActivityRegistration = {
  id: string;
  activityId: string;
  name: string;
  phone: string;
  registeredAt: Date;
  status: RegistrationStatus;
};

export function isRegistrationStatus(value: unknown): value is RegistrationStatus {
  return typeof value === 'string' && REGISTRATION_STATUSES.includes(value as RegistrationStatus);
}

export function normalizeRegistrationStatus(value: unknown): RegistrationStatus {
  return isRegistrationStatus(value) ? value : DEFAULT_REGISTRATION_STATUS;
}
