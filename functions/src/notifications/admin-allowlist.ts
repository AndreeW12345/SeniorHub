import { defineString } from 'firebase-functions/params';

const ADMIN_EMAIL_ALLOWLIST_PARAM = defineString('ADMIN_EMAIL_ALLOWLIST', {
  default: '',
  description: 'Comma-separated admin notification allowlist emails.',
});

function readAllowlist(): string[] {
  const raw = ADMIN_EMAIL_ALLOWLIST_PARAM.value().trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** Returns true when the email may receive admin-side notifications. */
export function isAdminEmailAllowed(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return readAllowlist().includes(normalized);
}
