/** Maps Firebase Auth error codes to friendly Swedish messages. */
export function getSwedishAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'E-postadressen har fel format.';
    case 'auth/missing-email':
      return 'Ange en e-postadress.';
    case 'auth/missing-password':
      return 'Ange ett lösenord.';
    case 'auth/user-disabled':
      return 'Kontot är inaktiverat. Kontakta administratören.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Fel e-postadress eller lösenord.';
    case 'auth/too-many-requests':
      return 'För många försök. Vänta en stund och försök igen.';
    case 'auth/network-request-failed':
      return 'Ingen anslutning. Kontrollera din internetuppkoppling.';
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'Inloggningslänken är ogiltig eller har gått ut. Be om en ny länk.';
    case 'auth/invalid-continue-uri':
    case 'auth/unauthorized-continue-uri':
      return 'Inloggningslänken kunde inte öppnas. Försök igen senare.';
    case 'auth/quota-exceeded':
      return 'För många e-postmeddelanden har skickats. Försök igen senare.';
    case 'auth/requires-recent-login':
      return 'Logga in igen innan du tar bort kontot.';
    default:
      return 'Något gick fel. Försök igen.';
  }
}

/** Reads the error code from an unknown thrown value. */
export function getAuthErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }

  return 'auth/unknown';
}
