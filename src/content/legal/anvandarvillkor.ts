import type { LegalDocumentDefinition } from '@/components/legal/legal-document-renderer';

import { anvandarvillkorPart1 } from '@/content/legal/anvandarvillkor-part-1';
import { anvandarvillkorPart2 } from '@/content/legal/anvandarvillkor-part-2';
import { anvandarvillkorPart3 } from '@/content/legal/anvandarvillkor-part-3';

/** Approved användarvillkor (29 september 2026). */
export const anvandarvillkorDocument: LegalDocumentDefinition = {
  screenTitle: 'Användarvillkor',
  screenSubtitle: 'Villkor för användning av SeniorHub',
  blocks: [...anvandarvillkorPart1, ...anvandarvillkorPart2, ...anvandarvillkorPart3],
};
