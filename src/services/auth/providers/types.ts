import type { User } from 'firebase/auth';

import type { AuthProviderId } from '@/constants/auth';

export type AuthResult = { ok: true; user: User } | { ok: false; errorMessage: string };

export type AuthActionResult = { ok: true } | { ok: false; errorMessage: string };

/**
 * Common shape for auth providers so BankID / OAuth can be added later
 * without rewriting the Auth context.
 */
export type AuthProviderModule = {
  id: AuthProviderId;
  /** Human-readable Swedish label (for future provider picker UI). */
  label: string;
  /** True when this provider is fully implemented. */
  isAvailable: boolean;
};
