import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { COLLECTIONS } from '../notifications/types';
import { assertSuperAdmin } from '../utils/assert-super-admin';
import { deleteOrganizationCascade } from '../utils/delete-organization-cascade';
import {
  assertOrganizationIdDeletable,
  buildDeleteOrganizationRateLimitPath,
  DELETE_ORGANIZATION_COOLDOWN_MS,
} from '../utils/delete-organization-policy';
import { parseDeleteOrganizationInput } from '../utils/delete-organization-validation';
import { isExistingOrganizationDocument } from '../utils/invite-organizer-admin-policy';
import { assertRateLimit } from '../utils/rate-limit';

export type DeleteOrganizationResponse = {
  ok: true;
  organizationId: string;
  deletedAdminCount: number;
  deletedActivityCount: number;
};

/**
 * Deletes a tenant organization and its org-scoped Firestore data. Superadmin-only.
 * Does not delete Firebase Auth accounts.
 */
export const deleteOrganization = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<DeleteOrganizationResponse> => {
    const { uid: superAdminUid } = await assertSuperAdmin(request);

    await assertRateLimit({
      docPath: buildDeleteOrganizationRateLimitPath(superAdminUid),
      cooldownMs: DELETE_ORGANIZATION_COOLDOWN_MS,
    });

    const parsed = parseDeleteOrganizationInput(request.data);
    if (!parsed) {
      throw new HttpsError('invalid-argument', 'Organisationen kunde inte raderas.');
    }

    assertOrganizationIdDeletable(parsed.organizationId);

    const db = getFirestore();
    const organizationSnapshot = await db
      .collection(COLLECTIONS.organizations)
      .doc(parsed.organizationId)
      .get();

    if (!isExistingOrganizationDocument(organizationSnapshot.exists, organizationSnapshot.data())) {
      throw new HttpsError('not-found', 'Organisationen kunde inte hittas.');
    }

    const result = await deleteOrganizationCascade(db, parsed.organizationId);

    return {
      ok: true,
      organizationId: parsed.organizationId,
      deletedAdminCount: result.deletedAdminCount,
      deletedActivityCount: result.deletedActivityCount,
    };
  },
);
