import { HttpsError } from 'firebase-functions/v2/https';

import { ORGANIZER_ADMIN_ROLE } from './invite-organizer-admin-policy';
import { isSuperAdminRole, readAdminRoleFromDocument } from './super-admin-policy';
import { isOrganizationDeleteBlocked } from './delete-organization-validation';

export function deleteOrganizationRejectedError(): HttpsError {
  return new HttpsError('failed-precondition', 'Organisationen kunde inte raderas.');
}

export function assertOrganizationIdDeletable(organizationId: string): void {
  if (isOrganizationDeleteBlocked(organizationId)) {
    throw deleteOrganizationRejectedError();
  }
}

export function shouldDeleteAdminDocumentForOrganization(params: {
  organizationId: string;
  adminUid: string;
  adminData: Record<string, unknown> | undefined;
}): boolean {
  const role = readAdminRoleFromDocument(params.adminData);
  if (isSuperAdminRole(role)) {
    return false;
  }

  if (role !== ORGANIZER_ADMIN_ROLE) {
    return false;
  }

  const orgIdRaw = params.adminData?.organizationId;
  const orgId =
    typeof orgIdRaw === 'string' && orgIdRaw.trim().length > 0 ? orgIdRaw.trim() : null;

  return orgId === params.organizationId;
}

export function collectAdminDocumentIdsForOrganizationDeletion(
  adminRecords: { uid: string; data: Record<string, unknown> | undefined }[],
  organizationId: string,
): string[] {
  const ids: string[] = [];

  for (const record of adminRecords) {
    if (
      shouldDeleteAdminDocumentForOrganization({
        organizationId,
        adminUid: record.uid,
        adminData: record.data,
      })
    ) {
      ids.push(record.uid.trim());
    }
  }

  return ids;
}

export const DELETE_ORGANIZATION_COOLDOWN_MS = 3_000;

export function buildDeleteOrganizationRateLimitPath(superAdminUid: string): string {
  return `security/deleteOrganization/attempts/${superAdminUid}`;
}

/** Subcollections removed before each activity document is deleted. */
export const ACTIVITY_SUBCOLLECTIONS_TO_DELETE = [
  'registrations',
  'announcements',
  'reminderDeliveries',
] as const;
