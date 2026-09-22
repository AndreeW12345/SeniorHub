import { FieldValue } from 'firebase-admin/firestore';

import type { CreateOrganizationInput } from './organization-validation';
import { buildNewOrganizationFields } from './organization-validation';

export function buildNewOrganizationDocument(
  input: CreateOrganizationInput,
): Record<string, unknown> {
  return {
    ...buildNewOrganizationFields(input),
    updatedAt: FieldValue.serverTimestamp(),
  };
}
