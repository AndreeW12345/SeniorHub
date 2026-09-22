export type FetchOrganizationsSource = 'default' | 'server';

export type FetchOrganizationsOptions = {
  /** Use server read so refreshes see documents written by Cloud Functions. */
  source?: FetchOrganizationsSource;
};

/** Options for OrganizationsProvider.refreshOrganizations — bypasses stale query cache. */
export const REFRESH_ORGANIZATIONS_FETCH_OPTIONS: FetchOrganizationsOptions = {
  source: 'server',
};
