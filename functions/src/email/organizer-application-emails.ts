export const ORGANIZER_APPLICATION_FROM_EMAIL = 'SeniorHub <noreply@seniorhub.se>';
export const ORGANIZER_APPLICATION_NOTIFY_EMAIL = 'arrangor@seniorhub.se';
export const ORGANIZER_APPLICATION_DEFAULT_STATUS = 'Ny';

export const ORGANIZER_APPLICATION_CONFIRMATION_SUBJECT =
  'Vi har tagit emot din ansökan till SeniorHub';

export function buildOrganizerApplicationConfirmationText(): string {
  return [
    'Hej!',
    '',
    'Tack för din ansökan om att bli arrangör på SeniorHub.',
    'Vi har tagit emot din ansökan och kommer att granska den inom några arbetsdagar.',
    'Vi återkommer via e-post så snart vi har behandlat din ansökan.',
    '',
    'Med vänliga hälsningar',
    'SeniorHub',
  ].join('\n');
}

export type OrganizerApplicationEmailPayload = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  description: string;
  status: string;
  applicationId: string;
};

export function buildOrganizerApplicationStaffSubject(payload: OrganizerApplicationEmailPayload): string {
  return `Ny arrangörsansökan: ${payload.organization}`;
}

export function buildOrganizerApplicationStaffText(payload: OrganizerApplicationEmailPayload): string {
  return [
    'En ny ansökan om att bli arrangör har skickats in via SeniorHub.',
    '',
    `Ansöknings-ID: ${payload.applicationId}`,
    `Status: ${payload.status}`,
    '',
    `Organisation/Förening: ${payload.organization}`,
    `Kontaktperson: ${payload.name}`,
    `E-post: ${payload.email}`,
    `Telefon: ${payload.phone}`,
    '',
    'Beskrivning:',
    payload.description,
  ].join('\n');
}

type SendResendEmailInput = {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
};

export async function sendResendEmail(input: SendResendEmailInput): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend request failed (${response.status}): ${body}`);
  }
}

export async function sendOrganizerApplicationEmails(
  apiKey: string,
  payload: OrganizerApplicationEmailPayload,
): Promise<void> {
  await sendResendEmail({
    apiKey,
    from: ORGANIZER_APPLICATION_FROM_EMAIL,
    to: [payload.email],
    subject: ORGANIZER_APPLICATION_CONFIRMATION_SUBJECT,
    text: buildOrganizerApplicationConfirmationText(),
  });

  await sendResendEmail({
    apiKey,
    from: ORGANIZER_APPLICATION_FROM_EMAIL,
    to: [ORGANIZER_APPLICATION_NOTIFY_EMAIL],
    subject: buildOrganizerApplicationStaffSubject(payload),
    text: buildOrganizerApplicationStaffText(payload),
  });
}
