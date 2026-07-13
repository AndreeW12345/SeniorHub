export const MEMBERSHIP_ORGANIZATION_PRESETS = [
  'SPF',
  'PRO',
  'Tyresö kommun',
  'Svenska kyrkan',
  'Röda Korset',
] as const;

export type MembershipOrganizationPreset = (typeof MEMBERSHIP_ORGANIZATION_PRESETS)[number];

export const MEMBERSHIP_ORGANIZATION_OTHER = 'Annat';

export const REGISTRATION_METHODS = ['seniorhub', 'external', 'phone', 'email'] as const;

export type RegistrationMethod = (typeof REGISTRATION_METHODS)[number];

export const DEFAULT_REGISTRATION_METHOD: RegistrationMethod = 'seniorhub';

export const REGISTRATION_METHOD_LABELS: Record<RegistrationMethod, string> = {
  seniorhub: 'SeniorHub',
  external: 'Extern webbplats',
  phone: 'Telefon',
  email: 'E-post',
};

export function isRegistrationMethod(value: unknown): value is RegistrationMethod {
  return typeof value === 'string' && REGISTRATION_METHODS.includes(value as RegistrationMethod);
}

export function normalizeRegistrationMethod(value: unknown): RegistrationMethod | null {
  return isRegistrationMethod(value) ? value : null;
}
