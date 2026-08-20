export const ORGANIZER_APPLICATION_STATUS = {
  new: 'Ny',
} as const;

export type OrganizerApplicationStatus =
  (typeof ORGANIZER_APPLICATION_STATUS)[keyof typeof ORGANIZER_APPLICATION_STATUS];

export type OrganizerApplicationInput = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  description: string;
};

export type OrganizerApplicationFormInput = {
  contactPerson: string;
  email: string;
  phone: string;
  organization: string;
  municipality: string;
  website?: string;
  activitiesDescription: string;
};

/** Builds the stored description from form fields (includes kommun and optional website). */
export function buildOrganizerApplicationDescription(
  input: Pick<OrganizerApplicationFormInput, 'activitiesDescription' | 'municipality' | 'website'>,
): string {
  const lines = [input.activitiesDescription.trim(), '', `Kommun: ${input.municipality.trim()}`];
  const website = input.website?.trim();

  if (website) {
    lines.push(`Hemsida: ${website}`);
  }

  return lines.join('\n');
}
