import { Redirect, type Href } from 'expo-router';

/** Legacy route – redirects to the public integritetspolicy screen. */
export default function PrivacyLegacyRedirectScreen() {
  return <Redirect href={'/integritet' as Href} />;
}
