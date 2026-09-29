import { Redirect, type Href } from 'expo-router';

/** Legacy route – redirects to the public användarvillkor screen. */
export default function TermsLegacyRedirectScreen() {
  return <Redirect href={'/villkor' as Href} />;
}
