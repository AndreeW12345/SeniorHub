import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { COLLECTIONS } from '../notifications/types';
import { assertSuperAdmin } from '../utils/assert-super-admin';
import { createOrganizerSlug } from '../utils/create-organizer-slug';
import { buildNewOrganizationDocument } from '../utils/organization-create-document';
import { parseCreateOrganizationInput } from '../utils/organization-validation';
import { assertRateLimit } from '../utils/rate-limit';

const CREATE_ORGANIZATION_COOLDOWN_MS = 3_000;

export type CreateOrganizationResponse = {
  organizationId: string;
  name: string;
  slug: string;
};

/**
 * Creates a new tenant organization document. Superadmin-only; App Check enforced when deployed.
 */
export const createOrganization = onCall(
  europeWest1CallableOptions(),
  async (request): Promise<CreateOrganizationResponse> => {
    const { uid } = await assertSuperAdmin(request);

    await assertRateLimit({
      docPath: `security/createOrganization/attempts/${uid}`,
      cooldownMs: CREATE_ORGANIZATION_COOLDOWN_MS,
    });

    const parsed = parseCreateOrganizationInput(request.data);
    if (!parsed) {
      throw new HttpsError('invalid-argument', 'Organisationsuppgifterna är ogiltiga.');
    }

    const db = getFirestore();
    const organizationRef = db.collection(COLLECTIONS.organizations).doc(parsed.organizationId);
    const existing = await organizationRef.get();

    if (existing.exists) {
      throw new HttpsError('already-exists', 'Organisationen kunde inte skapas.');
    }

    const payload = buildNewOrganizationDocument(parsed);
    await organizationRef.set(payload);

    return {
      organizationId: parsed.organizationId,
      name: parsed.name,
      slug: createOrganizerSlug(parsed.name),
    };
  },
);
