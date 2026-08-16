export {
  getAvailableAuthProviders,
  AUTH_PROVIDERS,
  completeMagicLinkSignIn,
  clearEmailForSignIn,
  clearPendingRegistration,
  isAuthEmailLink,
  readEmailForSignIn,
  readPendingRegistration,
  sendMagicLink,
  signInWithPasswordAdmin,
  storeEmailForSignIn,
  storePendingRegistration,
  type AuthActionResult,
  type AuthProviderModule,
  type AuthResult,
} from '@/services/auth/providers';
export {
  clearPendingActivityBooking,
  readPendingActivityBooking,
  storePendingActivityBooking,
} from '@/services/auth/pending-activity-booking';
export {
  getCurrentAuthUser,
  signOutCurrentUser,
  subscribeToAuthState,
} from '@/services/auth/session';
export { deleteCurrentAuthUser } from '@/services/auth/delete-auth-user';

/** @deprecated Prefer signInWithPasswordAdmin */
export { signInWithPasswordAdmin as signInAdmin } from '@/services/auth/providers/password-admin';
/** @deprecated Prefer signOutCurrentUser */
export { signOutCurrentUser as signOutAdmin } from '@/services/auth/session';
export type { AuthResult as SignInResult, AuthActionResult as SignOutResult } from '@/services/auth/providers/types';
