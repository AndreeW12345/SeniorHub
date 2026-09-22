import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { COLLECTIONS } from '../notifications/types';
import { assertSuperAdmin } from '../utils/assert-super-admin';
import {
  isExistingOrganizationDocument,
  ORGANIZER_ADMIN_ROLE,
} from '../utils/invite-organizer-admin-policy';
import {
  buildListOrganizationAdminsRateLimitPath,
  LIST_ORGANIZATION_ADMINS_COOLDOWN_MS,
  listOrganizationAdminsFromRecords,
  sanitizeOrganizationAdminListItem,
  type OrganizationAdminListItem,
} from '../utils/list-organization-admins-policy';
import { parseListOrganizationAdminsInput } from '../utils/list-organization-admins-validation';
import { assertRateLimit } from '../utils/rate-limit';

export type ListOrganizationAdminsResponse = {
  organizationId: string;
  admins: OrganizationAdminListItem[];
};

/**
 * Lists organization admins for a tenant. Superadmin-only; App Check enforced when deployed.
 */
export const listOrganizationAdmins = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<ListOrganizationAdminsResponse> => {
    const { uid: superAdminUid } = await assertSuperAdmin(request);

    await assertRateLimit({
      docPath: buildListOrganizationAdminsRateLimitPath(superAdminUid),
      cooldownMs: LIST_ORGANIZATION_ADMINS_COOLDOWN_MS,
    });

    const parsed = parseListOrganizationAdminsInput(request.data);
    if (!parsed) {
      throw new HttpsError('invalid-argument', 'Organisationen kunde inte hittas.');
    }

    const db = getFirestore();
    const organizationSnapshot = await db
      .collection(COLLECTIONS.organizations)
      .doc(parsed.organizationId)
      .get();

    if (!isExistingOrganizationDocument(organizationSnapshot.exists, organizationSnapshot.data())) {
      throw new HttpsError('not-found', 'Organisationen kunde inte hittas.');
    }

    const adminsSnapshot = await db
      .collection(COLLECTIONS.admins)
      .where('organizationId', '==', parsed.organizationId)
      .where('role', '==', ORGANIZER_ADMIN_ROLE)
      .get();

    const admins = listOrganizationAdminsFromRecords(
      adminsSnapshot.docs.map((document) => ({
        uid: document.id,
        data: document.data(),
      })),
      parsed.organizationId,
    ).map((item) => sanitizeOrganizationAdminListItem(item));

    return {
      organizationId: parsed.organizationId,
      admins,
    };
  },
);
