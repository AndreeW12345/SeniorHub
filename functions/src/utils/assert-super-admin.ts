import { getFirestore } from 'firebase-admin/firestore';
import type { CallableRequest } from 'firebase-functions/v2/https';

import { COLLECTIONS } from '../notifications/types';
import {
  assertSuperAdminAdminDocument,
  requireAuthenticatedUid,
} from './super-admin-policy';

export {
  assertSuperAdminAdminDocument,
  isSuperAdminRole,
  readAdminRoleFromDocument,
  requireAuthenticatedUid,
} from './super-admin-policy';

/**
 * Ensures the caller is signed in and has superadmin role in admins/{uid}.
 * Role is read server-side only — never from request.data.
 */
export async function assertSuperAdmin(
  request: Pick<CallableRequest, 'auth'>,
): Promise<{ uid: string }> {
  const uid = requireAuthenticatedUid(request.auth);

  const snapshot = await getFirestore().collection(COLLECTIONS.admins).doc(uid).get();
  assertSuperAdminAdminDocument(snapshot.exists, snapshot.data());

  return { uid };
}
