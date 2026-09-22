/** Client-side organization id rules (mirrors Cloud Functions validation). */

const MIN_ORGANIZATION_ID_LENGTH = 2;
const MAX_ORGANIZATION_ID_LENGTH = 64;
const MAX_ORGANIZATION_NAME_LENGTH = 200;
const ORGANIZATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_ORGANIZATION_IDS = new Set(['seniorhub']);

export function normalizeOrganizationIdInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ORGANIZATION_ID_LENGTH) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
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

export function readOrganizationNameInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ORGANIZATION_NAME_LENGTH) {
    return null;
  }

  return trimmed;
}

export type CreateOrganizationFormValues = {
  organizationId: string;
  name: string;
};

export type CreateOrganizationFormErrors = {
  organizationId?: string;
  name?: string;
};

export function validateCreateOrganizationForm(
  values: CreateOrganizationFormValues,
): CreateOrganizationFormErrors {
  const errors: CreateOrganizationFormErrors = {};
  const organizationId = normalizeOrganizationIdInput(values.organizationId);

  if (!organizationId) {
    errors.organizationId =
      'Ange ett giltigt organisations-id (små bokstäver, siffror och bindestreck, t.ex. spf-tyreso).';
  }

  if (!readOrganizationNameInput(values.name)) {
    errors.name = 'Ange organisationsnamn.';
  }

  return errors;
}

/** Payload sent to createOrganization — no role, password, or admin fields. */
export function buildCreateOrganizationCallablePayload(values: CreateOrganizationFormValues): {
  organizationId: string;
  name: string;
} | null {
  const organizationId = normalizeOrganizationIdInput(values.organizationId);
  const name = readOrganizationNameInput(values.name);

  if (!organizationId || !name) {
    return null;
  }

  return { organizationId, name };
}

export function hasCreateOrganizationFormErrors(errors: CreateOrganizationFormErrors): boolean {
  return Boolean(errors.organizationId || errors.name);
}

/** Validates a route param before loading a SuperAdmin organization profile. */
export function resolveSuperAdminOrganizationRouteId(
  organizationIdParam: string | string[] | undefined,
): string | null {
  const raw = Array.isArray(organizationIdParam)
    ? organizationIdParam[0]
    : organizationIdParam;

  if (typeof raw !== 'string') {
    return null;
  }

  return normalizeOrganizationIdInput(raw);
}

/** Save always uses the locked route/document id, never user-editable form state. */
export function resolveOrganizationProfileSaveId(lockedOrganizationId: string): string {
  return lockedOrganizationId.trim();
}

const INVITE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInviteEmailInput(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 254 || !INVITE_EMAIL_PATTERN.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function readInviteDisplayNameInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) {
    return null;
  }

  return trimmed;
}

export type InviteOrganizerFormErrors = {
  email?: string;
};

export function validateInviteOrganizerForm(email: string): InviteOrganizerFormErrors {
  if (!normalizeInviteEmailInput(email)) {
    return { email: 'Ange en giltig e-postadress.' };
  }

  return {};
}

/** Payload for inviteOrganizerAdmin — organizationId comes from locked route context only. */
export function buildInviteOrganizerAdminCallablePayload(params: {
  lockedOrganizationId: string;
  email: string;
  displayName: string;
}): { organizationId: string; email: string; displayName?: string } | null {
  const organizationId = normalizeOrganizationIdInput(params.lockedOrganizationId);
  const email = normalizeInviteEmailInput(params.email);
  const displayName = readInviteDisplayNameInput(params.displayName);

  if (!organizationId || !email) {
    return null;
  }

  return displayName
    ? { organizationId, email, displayName }
    : { organizationId, email };
}
