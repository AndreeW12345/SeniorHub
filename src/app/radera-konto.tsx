import { type Href } from 'expo-router';

import { LegalDocumentScreen } from '@/components/legal/legal-document-screen';
import { raderaKontoDocument } from '@/content/legal/radera-konto';

/** Public account deletion information. */
export default function RaderaKontoScreen() {
  return (
    <LegalDocumentScreen
      document={raderaKontoDocument}
      footerLink={{ label: 'Läs integritetspolicyn', href: '/integritet' as Href }}
    />
  );
}
