import { normalizeOrganizationId } from './organization-validation';

export type ListOrganizationAdminsInput = {
  organizationId: string;
};

/** Parses callable input; ignores unknown fields (including role). */
export function parseListOrganizationAdminsInput(data: unknown): ListOrganizationAdminsInput | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const organizationId = normalizeOrganizationId(record.organizationId);

  if (!organizationId) {
    return null;
  }

  return { organizationId };
}
