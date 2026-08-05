/**
 * Compatibility layer for existing imports.
 * Prefer importing from `@/services/auth` or provider modules directly.
 */
export { signInWithPasswordAdmin as signInAdmin } from '@/services/auth/providers/password-admin';
export {
  signOutCurrentUser as signOutAdmin,
  subscribeToAuthState,
} from '@/services/auth/session';
export type {
  AuthResult as SignInResult,
  AuthActionResult as SignOutResult,
} from '@/services/auth/providers/types';
export { getAuthErrorCode, getSwedishAuthErrorMessage } from '@/services/auth/errors';
