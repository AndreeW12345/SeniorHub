import type { LegalDocumentDefinition } from '@/components/legal/legal-document-renderer';

import { integritetspolicyPart1 } from '@/content/legal/integritetspolicy-part-1';
import { integritetspolicyPart2 } from '@/content/legal/integritetspolicy-part-2';
import { integritetspolicyPart3 } from '@/content/legal/integritetspolicy-part-3';

/** Approved integritetspolicy (29 september 2026). */
export const integritetspolicyDocument: LegalDocumentDefinition = {
  screenTitle: 'Integritetspolicy',
  screenSubtitle: 'Hur vi behandlar personuppgifter',
  blocks: [...integritetspolicyPart1, ...integritetspolicyPart2, ...integritetspolicyPart3],
};
