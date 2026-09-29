import { LegalDocumentScreen } from '@/components/legal/legal-document-screen';
import { anvandarvillkorDocument } from '@/content/legal/anvandarvillkor';

/** Public användarvillkor (approved text). */
export default function VillkorScreen() {
  return <LegalDocumentScreen document={anvandarvillkorDocument} />;
}
