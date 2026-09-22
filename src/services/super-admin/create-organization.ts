import { httpsCallable } from 'firebase/functions';

import { readCallableErrorMessage } from '@/firebase/callable-error-message';
import { prepareCallableRequest } from '@/firebase/prepare-callable-request';
import {
  buildCreateOrganizationCallablePayload,
  type CreateOrganizationFormValues,
} from '@/utils/organization-id-validation';

export type CreateOrganizationCallableResponse = {
  organizationId: string;
  name: string;
  slug: string;
};

export type CreateOrganizationViaCallableResult =
  | { ok: true; organization: CreateOrganizationCallableResponse }
  | { ok: false; errorMessage: string };

type CallableRequest = {
  organizationId: string;
  name: string;
};

/**
 * Creates a tenant organization via the createOrganization Cloud Function.
 * Does not write to Firestore from the client.
 */
export async function createOrganizationViaCallable(
  values: CreateOrganizationFormValues,
): Promise<CreateOrganizationViaCallableResult> {
  const payload = buildCreateOrganizationCallablePayload(values);
  if (!payload) {
    return { ok: false, errorMessage: 'Organisationsuppgifterna är ogiltiga.' };
  }

  const prepared = await prepareCallableRequest();
  if (!prepared.ok) {
    return { ok: false, errorMessage: prepared.errorMessage };
  }

  try {
    const callable = httpsCallable<CallableRequest, CreateOrganizationCallableResponse>(
      prepared.functions,
      'createOrganization',
    );

    const response = await callable(payload);
    const organizationId = response.data.organizationId?.trim();
    const name = response.data.name?.trim();
    const slug = response.data.slug?.trim();

    if (!organizationId || !name || !slug) {
      return { ok: false, errorMessage: 'Organisationen kunde inte skapas.' };
    }

    return {
      ok: true,
      organization: { organizationId, name, slug },
    };
  } catch (error) {
    return { ok: false, errorMessage: readCallableErrorMessage(error) };
  }
}
