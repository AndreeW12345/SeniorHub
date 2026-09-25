import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import { buildDeleteOrganizationCallablePayload } from '@/utils/organization-id-validation';

export type DeleteOrganizationCallableResponse = {
  ok: true;
  organizationId: string;
  deletedAdminCount: number;
  deletedActivityCount: number;
};

export type DeleteOrganizationViaCallableResult =
  | { ok: true; result: DeleteOrganizationCallableResponse }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  organizationId: string;
  confirmOrganizationId: string;
};

export async function deleteOrganizationViaCallable(params: {
  lockedOrganizationId: string;
  confirmOrganizationId: string;
}): Promise<DeleteOrganizationViaCallableResult> {
  const payload = buildDeleteOrganizationCallablePayload(params);
  if (!payload) {
    return { ok: false, errorMessage: 'Organisationen kunde inte raderas.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, DeleteOrganizationCallableResponse>(
      prepared.functions,
      'deleteOrganization',
    );

    const response = await callable(payload);
    const organizationId = response.data.organizationId?.trim();

    if (!organizationId || organizationId !== payload.organizationId) {
      return { ok: false, errorMessage: 'Organisationen kunde inte raderas.' };
    }

    return {
      ok: true,
      result: {
        ok: true,
        organizationId,
        deletedAdminCount: response.data.deletedAdminCount ?? 0,
        deletedActivityCount: response.data.deletedActivityCount ?? 0,
      },
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
