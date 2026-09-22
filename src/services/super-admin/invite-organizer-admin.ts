import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import { buildInviteOrganizerAdminCallablePayload } from '@/utils/organization-id-validation';

export type InviteOrganizerAdminCallableResponse = {
  ok: true;
  uid: string;
  organizationId: string;
  alreadyAdmin: boolean;
};

export type InviteOrganizerAdminViaCallableResult =
  | { ok: true; invite: InviteOrganizerAdminCallableResponse }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  organizationId: string;
  email: string;
  displayName?: string;
};

export async function inviteOrganizerAdminViaCallable(params: {
  lockedOrganizationId: string;
  email: string;
  displayName: string;
}): Promise<InviteOrganizerAdminViaCallableResult> {
  const payload = buildInviteOrganizerAdminCallablePayload(params);
  if (!payload) {
    return { ok: false, errorMessage: 'Inbjudan kunde inte skickas.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, InviteOrganizerAdminCallableResponse>(
      prepared.functions,
      'inviteOrganizerAdmin',
    );

    const response = await callable(payload);
    const uid = response.data.uid?.trim();
    const organizationId = response.data.organizationId?.trim();

    if (!uid || !organizationId || organizationId !== payload.organizationId) {
      return { ok: false, errorMessage: 'Inbjudan kunde inte skickas.' };
    }

    return {
      ok: true,
      invite: {
        ok: true,
        uid,
        organizationId,
        alreadyAdmin: response.data.alreadyAdmin === true,
      },
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
