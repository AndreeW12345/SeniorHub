import { HttpsError } from 'firebase-functions/v2/https';

export function readAdminRoleFromDocument(
  data: Record<string, unknown> | undefined,
): string | null {
  const role = data?.role;
  return typeof role === 'string' && role.trim().length > 0 ? role.trim() : null;
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === 'superadmin';
}

export function requireAuthenticatedUid(auth: { uid?: string } | null | undefined): string {
  const uid = auth?.uid?.trim();
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Du måste vara inloggad.');
  }

  return uid;
}

export function assertSuperAdminAdminDocument(
  exists: boolean,
  data: Record<string, unknown> | undefined,
): void {
  if (!exists) {
    throw new HttpsError('permission-denied', 'Du har inte behörighet för den här åtgärden.');
  }

  const role = readAdminRoleFromDocument(data);
  if (!isSuperAdminRole(role)) {
    throw new HttpsError('permission-denied', 'Du har inte behörighet för den här åtgärden.');
  }
}
