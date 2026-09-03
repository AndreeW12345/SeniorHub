/** Comma-separated in EXPO_PUBLIC_ADMIN_EMAIL_ALLOWLIST (client-side gate only; Firestore rules enforce admin docs). */
function readAdminEmailAllowlist(): readonly string[] {
  const raw = process.env.EXPO_PUBLIC_ADMIN_EMAIL_ALLOWLIST?.trim();
  if (!raw) {
    return [];
  }

  return raw
   .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmailAllowed(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return readAdminEmailAllowlist().includes(normalized);
}
