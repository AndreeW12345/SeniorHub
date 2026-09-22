import { httpsCallable } from 'firebase/functions';

import type { OrganizationAdminListItem } from '@/constants/organization-admin-list';
import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import { normalizeOrganizationIdInput } from '@/utils/organization-id-validation';

export type ListOrganizationAdminsResult =
  | { ok: true; organizationId: string; admins: OrganizationAdminListItem[] }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  organizationId: string;
};

type CallableResponse = {
  organizationId: string;
  admins: OrganizationAdminListItem[];
};

export async function listOrganizationAdminsViaCallable(
  lockedOrganizationId: string,
): Promise<ListOrganizationAdminsResult> {
  const organizationId = normalizeOrganizationIdInput(lockedOrganizationId);
  if (!organizationId) {
    return { ok: false, errorMessage: 'Organisationen kunde inte hittas.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, CallableResponse>(
      prepared.functions,
      'listOrganizationAdmins',
    );

    const response = await callable({ organizationId });
    const responseOrganizationId = response.data.organizationId?.trim();
    const admins = Array.isArray(response.data.admins) ? response.data.admins : [];

    if (!responseOrganizationId || responseOrganizationId !== organizationId) {
      return { ok: false, errorMessage: 'Kunde inte hämta administratörer.' };
    }

    return {
      ok: true,
      organizationId: responseOrganizationId,
      admins,
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
