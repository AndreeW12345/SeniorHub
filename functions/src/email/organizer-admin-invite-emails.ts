import type { ActionCodeSettings } from 'firebase-admin/auth';

import {
  ORGANIZER_APPLICATION_FROM_EMAIL,
  sendResendEmail,
} from './organizer-application-emails';

export const ORGANIZER_ADMIN_INVITE_SUBJECT = 'Välkommen som administratör i SeniorHub';

export function buildOrganizerAdminPasswordResetActionCodeSettings(): ActionCodeSettings {
  return {
    url: 'https://seniorhub.se/admin/login',
    handleCodeInApp: false,
  };
}

export function buildOrganizerAdminInviteEmailText(organizationName: string): string {
  return [
    'Hej!',
    '',
    `Du har blivit inbjuden att administrera ${organizationName} i SeniorHub.`,
    'Använd länken i det här meddelandet för att välja ett lösenord och logga in som administratör.',
    'Efter inloggning når du adminpanelen via Administratörsinloggning.',
    '',
    'Om du inte förväntade dig detta meddelande kan du ignorera det.',
    '',
    'Med vänliga hälsningar',
    'SeniorHub',
  ].join('\n');
}

export async function sendOrganizerAdminInviteEmail(params: {
  apiKey: string;
  to: string;
  organizationName: string;
  passwordResetLink: string;
}): Promise<void> {
  const text = [
    buildOrganizerAdminInviteEmailText(params.organizationName),
    '',
    'Välj lösenord:',
    params.passwordResetLink,
  ].join('\n');

  await sendResendEmail({
    apiKey: params.apiKey,
    from: ORGANIZER_APPLICATION_FROM_EMAIL,
    to: [params.to],
    subject: ORGANIZER_ADMIN_INVITE_SUBJECT,
    text,
  });
}
