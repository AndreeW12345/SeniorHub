import type { AdminAccount } from '@/constants/admin-account';

/** True when the Firestore admin profile has the superadmin role. */
export function isSuperAdminAdminAccount(account: AdminAccount | null | undefined): boolean {
  return account?.role === 'superadmin';
}

/** SuperAdmin platform link is visible only to signed-in superadmins. */
export function shouldShowSuperAdminPlatformLink(
  isAdmin: boolean,
  account: AdminAccount | null | undefined,
): boolean {
  return isAdmin && isSuperAdminAdminAccount(account);
}

export type SuperAdminGuardRedirect = '/admin/login' | '/admin';

/**
 * Resolves where to send the user when accessing superadmin routes.
 * Returns null when access is allowed or while auth/verification is still loading.
 */
export function getSuperAdminGuardRedirectTarget(params: {
  isInitializing: boolean;
  isVerifying: boolean;
  isAdmin: boolean;
  verifiedAccount: AdminAccount | null;
}): SuperAdminGuardRedirect | null {
  if (params.isInitializing || params.isVerifying) {
    return null;
  }

  if (!params.isAdmin) {
    return '/admin/login';
  }

  if (!isSuperAdminAdminAccount(params.verifiedAccount)) {
    return '/admin';
  }

  return null;
}
