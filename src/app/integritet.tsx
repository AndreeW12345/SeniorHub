import { LegalDocumentScreen } from '@/components/legal/legal-document-screen';
import { integritetspolicyDocument } from '@/content/legal/integritetspolicy';

/** Public integritetspolicy (approved text). */
export default function IntegritetScreen() {
  return <LegalDocumentScreen document={integritetspolicyDocument} />;
}
