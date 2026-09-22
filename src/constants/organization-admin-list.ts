/** Organization admin row returned by listOrganizationAdmins callable. */
export type OrganizationAdminListItem = {
  uid: string;
  email: string | null;
  displayName: string | null;
  organizationId: string;
  role: 'admin';
};
