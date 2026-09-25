import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { COLLECTIONS } from '../notifications/types';
import { assertSuperAdmin } from '../utils/assert-super-admin';
import { isExistingOrganizationDocument } from '../utils/invite-organizer-admin-policy';
import {
  buildRevokeOrganizerAdminRateLimitPath,
  readExistingAdminSnapshot,
  resolveRevokeOrganizerAdminDecision,
  revokeOrganizerAdminRejectedError,
  REVOKE_ORGANIZER_ADMIN_COOLDOWN_MS,
} from '../utils/revoke-organizer-admin-policy';
import { parseRevokeOrganizerAdminInput } from '../utils/revoke-organizer-admin-validation';
import { assertRateLimit } from '../utils/rate-limit';

export type RevokeOrganizerAdminResponse = {
  ok: true;
  uid: string;
  organizationId: string;
};

/**
 * Removes an organization admin document. Superadmin-only; does not delete Auth user.
 */
export const revokeOrganizerAdmin = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<RevokeOrganizerAdminResponse> => {
    const { uid: superAdminUid } = await assertSuperAdmin(request);

    await assertRateLimit({
      docPath: buildRevokeOrganizerAdminRateLimitPath(superAdminUid),
      cooldownMs: REVOKE_ORGANIZER_ADMIN_COOLDOWN_MS,
    });

    const parsed = parseRevokeOrganizerAdminInput(request.data);
    if (!parsed) {
      throw new HttpsError('invalid-argument', 'Administratören kunde inte tas bort.');
    }

    const db = getFirestore();
    const organizationSnapshot = await db
      .collection(COLLECTIONS.organizations)
      .doc(parsed.organizationId)
      .get();

    if (!isExistingOrganizationDocument(organizationSnapshot.exists, organizationSnapshot.data())) {
      throw new HttpsError('not-found', 'Organisationen kunde inte hittas.');
    }

    const adminSnapshot = await db.collection(COLLECTIONS.admins).doc(parsed.targetAdminUid).get();
    const adminState = readExistingAdminSnapshot(adminSnapshot.exists, adminSnapshot.data());
    const decision = resolveRevokeOrganizerAdminDecision({
      superAdminUid,
      targetAdminUid: parsed.targetAdminUid,
      targetOrganizationId: parsed.organizationId,
      admin: adminState,
    });

    if (decision.kind === 'rejected') {
      throw revokeOrganizerAdminRejectedError();
    }

    await db.collection(COLLECTIONS.admins).doc(parsed.targetAdminUid).delete();

    return {
      ok: true,
      uid: parsed.targetAdminUid,
      organizationId: parsed.organizationId,
    };
  },
);
