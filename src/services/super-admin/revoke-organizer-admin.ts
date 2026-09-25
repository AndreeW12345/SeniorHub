import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import { buildRevokeOrganizerAdminCallablePayload } from '@/utils/organization-id-validation';

export type RevokeOrganizerAdminCallableResponse = {
  ok: true;
  uid: string;
  organizationId: string;
};

export type RevokeOrganizerAdminViaCallableResult =
  | { ok: true; revoke: RevokeOrganizerAdminCallableResponse }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  organizationId: string;
  targetAdminUid: string;
};

export async function revokeOrganizerAdminViaCallable(params: {
  lockedOrganizationId: string;
  targetAdminUid: string;
}): Promise<RevokeOrganizerAdminViaCallableResult> {
  const payload = buildRevokeOrganizerAdminCallablePayload(params);
  if (!payload) {
    return { ok: false, errorMessage: 'Administratören kunde inte tas bort.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, RevokeOrganizerAdminCallableResponse>(
      prepared.functions,
      'revokeOrganizerAdmin',
    );

    const response = await callable(payload);
    const uid = response.data.uid?.trim();
    const organizationId = response.data.organizationId?.trim();

    if (!uid || !organizationId || organizationId !== payload.organizationId || uid !== payload.targetAdminUid) {
      return { ok: false, errorMessage: 'Administratören kunde inte tas bort.' };
    }

    return {
      ok: true,
      revoke: {
        ok: true,
        uid,
        organizationId,
      },
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
