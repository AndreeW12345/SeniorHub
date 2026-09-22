import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

import { europeWest1CallableOptions } from '../config/callable-options';
import { RESEND_API_KEY } from '../config/secrets';
import {
  buildOrganizerAdminPasswordResetActionCodeSettings,
  sendOrganizerAdminInviteEmail,
} from '../email/organizer-admin-invite-emails';
import { COLLECTIONS } from '../notifications/types';
import { assertSuperAdmin } from '../utils/assert-super-admin';
import {
  buildInviteOrganizerRateLimitPaths,
  buildOrganizerAdminDocumentFields,
  inviteOrganizerAdminRejectedError,
  INVITE_ORGANIZER_ADMIN_EMAIL_COOLDOWN_MS,
  INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS,
  isExistingOrganizationDocument,
  readExistingAdminSnapshot,
  readOrganizationNameFromDocument,
  resolveInviteOrganizerAdminDecision,
} from '../utils/invite-organizer-admin-policy';
import { parseInviteOrganizerAdminInput } from '../utils/invite-organizer-admin-validation';
import { assertRateLimit } from '../utils/rate-limit';

export type InviteOrganizerAdminResponse = {
  ok: true;
  uid: string;
  organizationId: string;
  alreadyAdmin: boolean;
};

async function resolveOrCreateAuthUser(params: {
  email: string;
  displayName: string | null;
}): Promise<{ uid: string; created: boolean }> {
  const auth = getAuth();

  try {
    const existing = await auth.getUserByEmail(params.email);
    return { uid: existing.uid, created: false };
  } catch (error) {
    const code =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string'
        ? (error as { code: string }).code
        : '';

    if (code !== 'auth/user-not-found') {
      console.error('[inviteOrganizerAdmin] Auth lookup failed.', code || 'unknown_error');
      throw new HttpsError('internal', 'Inbjudan kunde inte skickas.');
    }
  }

  const created = await auth.createUser({
    email: params.email,
    emailVerified: false,
    ...(params.displayName ? { displayName: params.displayName } : {}),
  });

  return { uid: created.uid, created: true };
}

/**
 * Provisions an organization admin and sends a password-set link. Superadmin-only.
 */
export const inviteOrganizerAdmin = onCall(
  {
    ...europeWest1CallableOptions(),
    secrets: [RESEND_API_KEY],
  },
  async (request): Promise<InviteOrganizerAdminResponse> => {
    const { uid: superAdminUid } = await assertSuperAdmin(request);

    const parsed = parseInviteOrganizerAdminInput(request.data);
    if (!parsed) {
      throw new HttpsError('invalid-argument', 'Inbjudan kunde inte skickas.');
    }

    const rateLimitPaths = buildInviteOrganizerRateLimitPaths(superAdminUid, parsed.email);
    await assertRateLimit({
      docPath: rateLimitPaths.perSuperAdmin,
      cooldownMs: INVITE_ORGANIZER_ADMIN_SUPERADMIN_COOLDOWN_MS,
    });
    await assertRateLimit({
      docPath: rateLimitPaths.perEmail,
      cooldownMs: INVITE_ORGANIZER_ADMIN_EMAIL_COOLDOWN_MS,
    });

    const db = getFirestore();
    const organizationSnapshot = await db
      .collection(COLLECTIONS.organizations)
      .doc(parsed.organizationId)
      .get();

    if (!isExistingOrganizationDocument(organizationSnapshot.exists, organizationSnapshot.data())) {
      throw new HttpsError('not-found', 'Organisationen kunde inte hittas.');
    }

    const organizationName =
      readOrganizationNameFromDocument(organizationSnapshot.data()) ?? parsed.organizationId;

    const authUser = await resolveOrCreateAuthUser({
      email: parsed.email,
      displayName: parsed.displayName,
    });

    const adminSnapshot = await db.collection(COLLECTIONS.admins).doc(authUser.uid).get();
    const adminState = readExistingAdminSnapshot(adminSnapshot.exists, adminSnapshot.data());
    const decision = resolveInviteOrganizerAdminDecision(adminState, parsed.organizationId);

    if (decision.kind === 'rejected') {
      throw inviteOrganizerAdminRejectedError();
    }

    if (decision.writeAdminDocument) {
      const adminFields = buildOrganizerAdminDocumentFields(parsed);
      await db
        .collection(COLLECTIONS.admins)
        .doc(authUser.uid)
        .set({
          ...adminFields,
          updatedAt: FieldValue.serverTimestamp(),
        });
    }

    let passwordResetLink: string;
    try {
      passwordResetLink = await getAuth().generatePasswordResetLink(
        parsed.email,
        buildOrganizerAdminPasswordResetActionCodeSettings(),
      );
    } catch (error) {
      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof (error as { code: unknown }).code === 'string'
          ? (error as { code: string }).code
          : 'unknown_error';
      console.error('[inviteOrganizerAdmin] Password reset link failed.', code);
      throw new HttpsError('internal', 'Inbjudan kunde inte skickas.');
    }

    try {
      await sendOrganizerAdminInviteEmail({
        apiKey: RESEND_API_KEY.value(),
        to: parsed.email,
        organizationName,
        passwordResetLink,
      });
    } catch (error) {
      console.error(
        '[inviteOrganizerAdmin] Invite email failed.',
        error instanceof Error ? error.message : 'unknown_error',
      );
      throw new HttpsError('internal', 'Inbjudan kunde inte skickas.');
    }

    return {
      ok: true,
      uid: authUser.uid,
      organizationId: parsed.organizationId,
      alreadyAdmin: decision.kind === 'already_in_organization',
    };
  },
);
