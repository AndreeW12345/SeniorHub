import { appleProvider } from '@/services/auth/providers/apple';
import { bankIdProvider } from '@/services/auth/providers/bankid';
import { emailLinkProvider } from '@/services/auth/providers/email-link';
import { googleProvider } from '@/services/auth/providers/google';
import { microsoftProvider } from '@/services/auth/providers/microsoft';
import { passwordAdminProvider } from '@/services/auth/providers/password-admin';
import type { AuthProviderModule } from '@/services/auth/providers/types';

/** Registry of auth providers – add future providers here without rewriting Auth. */
export const AUTH_PROVIDERS: AuthProviderModule[] = [
  emailLinkProvider,
  passwordAdminProvider,
  bankIdProvider,
  googleProvider,
  appleProvider,
  microsoftProvider,
];

export function getAvailableAuthProviders(): AuthProviderModule[] {
  return AUTH_PROVIDERS.filter((provider) => provider.isAvailable);
}

export {
  completeMagicLinkSignIn,
  clearEmailForSignIn,
  clearPendingRegistration,
  isAuthEmailLink,
  readEmailForSignIn,
  readPendingRegistration,
  sendMagicLink,
  storeEmailForSignIn,
  storePendingRegistration,
} from '@/services/auth/providers/email-link';
export { signInWithPasswordAdmin } from '@/services/auth/providers/password-admin';
export type {
  AuthActionResult,
  AuthProviderModule,
  AuthResult,
} from '@/services/auth/providers/types';
