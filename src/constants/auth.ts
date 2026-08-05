/** Pluggable auth provider identifiers for current and future sign-in methods. */
export const AUTH_PROVIDER_IDS = [
  'email_link',
  'password_admin',
  'bankid',
  'google',
  'apple',
  'microsoft',
] as const;

export type AuthProviderId = (typeof AUTH_PROVIDER_IDS)[number];

/** AsyncStorage key for the email used with Magic Link sign-in. */
export const EMAIL_FOR_SIGN_IN_STORAGE_KEY = '@seniorhub/emailForSignIn';

/** AsyncStorage key for pending registration details until Magic Link is opened. */
export const PENDING_REGISTRATION_STORAGE_KEY = '@seniorhub/pendingRegistration';

export type PendingRegistration = {
  firstName: string;
  lastName: string;
  email: string;
};
