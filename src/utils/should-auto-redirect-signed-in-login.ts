/** True when /login should send an already signed-in user to the app (not during an open magic-link flow). */
export function shouldAutoRedirectSignedInLogin(params: {
  isSignedIn: boolean;
  linkSent: boolean;
  hasStoredMagicLinkEmail: boolean;
}): boolean {
  return params.isSignedIn && !params.linkSent && !params.hasStoredMagicLinkEmail;
}
