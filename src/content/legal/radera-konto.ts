import type { LegalDocumentDefinition } from '@/components/legal/legal-document-renderer';

/** Public information page for account deletion requests. */
export const raderaKontoDocument: LegalDocumentDefinition = {
  screenTitle: 'Radera konto',
  screenSubtitle: 'Kontoradering i SeniorHub',
  blocks: [
    { type: 'docTitle', text: 'Radera ditt SeniorHub-konto' },
    {
      type: 'p',
      content: [
        'Du kan radera ditt konto direkt i SeniorHub under Profil → Konto → Radera konto.',
      ],
    },
    {
      type: 'p',
      content: [
        'Om du inte längre har tillgång till appen kan du begära att ditt konto och tillhörande personuppgifter raderas genom att kontakta oss på ',
        { link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' },
        '.',
      ],
    },
    {
      type: 'p',
      content: [
        'Ange den e-postadress som är kopplad till ditt SeniorHub-konto. Vi kan behöva verifiera din identitet innan vi behandlar din begäran.',
      ],
    },
    {
      type: 'p',
      content: [
        'Vissa uppgifter kan behöva behållas i anonymiserad form eller när det krävs enligt lag. Läs mer i vår ',
        { link: 'integritetspolicy', href: '/integritet' },
        '.',
      ],
    },
  ],
};
