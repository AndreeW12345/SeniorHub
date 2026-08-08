/** Only these emails may receive organizer admin notifications. */
export const ADMIN_EMAIL_ALLOWLIST = ['andree.wester@outlook.com'] as const;

export function isAdminEmailAllowed(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return ADMIN_EMAIL_ALLOWLIST.some(
    (allowedEmail) => allowedEmail.toLowerCase() === normalized,
  );
}
