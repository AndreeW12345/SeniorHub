import {
  normalizeOrganizationId,
  RESERVED_ORGANIZATION_IDS,
} from './organization-validation';

export type DeleteOrganizationInput = {
  organizationId: string;
};

/** Parses callable input; confirmOrganizationId must exactly match organizationId. */
export function parseDeleteOrganizationInput(data: unknown): DeleteOrganizationInput | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const organizationId = normalizeOrganizationId(record.organizationId);
  const confirmOrganizationId = normalizeOrganizationId(record.confirmOrganizationId);

  if (!organizationId || !confirmOrganizationId || organizationId !== confirmOrganizationId) {
    return null;
  }

  return { organizationId };
}

export function isOrganizationDeleteBlocked(organizationId: string): boolean {
  return RESERVED_ORGANIZATION_IDS.has(organizationId);
}
