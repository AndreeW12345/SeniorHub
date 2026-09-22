import { readEmail, readRegistrationName } from './input-validation';
import { normalizeOrganizationId } from './organization-validation';

export type InviteOrganizerAdminInput = {
  organizationId: string;
  email: string;
  displayName: string | null;
};

/** Parses callable input; ignores role, password, and other privileged fields. */
export function parseInviteOrganizerAdminInput(data: unknown): InviteOrganizerAdminInput | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const record = data as Record<string, unknown>;
  const organizationId = normalizeOrganizationId(record.organizationId);
  const email = readEmail(record.email);
  const displayName = readRegistrationName(record.displayName);

  if (!organizationId || !email) {
    return null;
  }

  if ('password' in record || 'role' in record) {
    // Parsed fields still validated; privileged keys are never read for authorization.
  }

  return {
    organizationId,
    email,
    displayName,
  };
}
