import { createOrganizerSlug } from './create-organizer-slug';
import { readBoundedString } from './input-validation';

export const MIN_ORGANIZATION_ID_LENGTH = 2;
export const MAX_ORGANIZATION_ID_LENGTH = 64;
export const MAX_ORGANIZATION_NAME_LENGTH = 200;

/** Tenant ids reserved for platform use — cannot be created via onboarding. */
export const RESERVED_ORGANIZATION_IDS = new Set(['seniorhub']);

const ORGANIZATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeOrganizationId(value: unknown): string | null {
  const raw = readBoundedString(value, MAX_ORGANIZATION_ID_LENGTH);
  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase();
  if (
    normalized.length < MIN_ORGANIZATION_ID_LENGTH ||
    !ORGANIZATION_ID_PATTERN.test(normalized)
  ) {
    return null;
  }

  if (RESERVED_ORGANIZATION_IDS.has(normalized)) {
    return null;
  }

  return normalized;
}

export function readOrganizationName(value: unknown): string | null {
  return readBoundedString(value, MAX_ORGANIZATION_NAME_LENGTH);
}

export type CreateOrganizationInput = {
  organizationId: string;
  name: string;
};

/** Parses callable input; ignores unknown fields (including role). */
export function parseCreateOrganizationInput(data: unknown): CreateOrganizationInput | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const organizationId = normalizeOrganizationId(record.organizationId);
  const name = readOrganizationName(record.name);

  if (!organizationId || !name) {
    return null;
  }

  return { organizationId, name };
}

export function buildNewOrganizationFields(input: CreateOrganizationInput): {
  id: string;
  name: string;
  slug: string;
} {
  return {
    id: input.organizationId,
    name: input.name,
    slug: createOrganizerSlug(input.name),
  };
}
