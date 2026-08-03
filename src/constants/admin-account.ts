/** Admin roles used for multi-organization tenancy. */
export const ADMIN_ROLES = ['admin', 'superadmin'] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const DEFAULT_ADMIN_ROLE: AdminRole = 'admin';

/** Activity list scope in the admin panel. */
export const ADMIN_ACTIVITY_SCOPES = ['mine', 'all'] as const;

export type AdminActivityScope = (typeof ADMIN_ACTIVITY_SCOPES)[number];

export type AdminAccount = {
  uid: string;
  /** Tenant id shared by the admin and their activities. */
  organizationId: string;
  role: AdminRole;
  email?: string;
  displayName?: string;
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminRole(value: unknown): AdminRole {
  return isAdminRole(value) ? value : DEFAULT_ADMIN_ROLE;
}
