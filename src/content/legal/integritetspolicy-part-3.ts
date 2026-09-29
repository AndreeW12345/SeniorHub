import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Integritetspolicy blocks §13–§19. */
export const integritetspolicyPart3: LegalBlock[] = [
  { type: 'h2', text: '13. Vilka kan få tillgång till personuppgifterna?' },
  { type: 'p', content: ['Personuppgifter kan behandlas av:'] },
  {
    type: 'ul',
    items: [
      [
        'SeniorHub och personer som behöver tillgång till uppgifterna för att driva och administrera tjänsten',
      ],
      [
        'relevanta arrangörer och behöriga administratörer när detta behövs för att administrera en aktivitet eller bokning',
      ],
      ['tekniska tjänsteleverantörer som behandlar uppgifter för SeniorHubs räkning'],
      ['myndigheter eller andra mottagare när vi är skyldiga att lämna ut uppgifter enligt lag.'],
    ],
  },
  { type: 'p', content: ['SeniorHub använder bland annat:'] },
  {
    type: 'ul',
    items: [
      [
        { text: 'Google Firebase/Google Cloud', bold: true },
        ' för exempelvis autentisering, datalagring, säkerhet och meddelandetjänster',
      ],
      [{ text: 'Resend', bold: true }, ' för vissa e-postmeddelanden'],
      [
        'externa geokodningstjänster när aktivitetens adress omvandlas till geografiska koordinater.',
      ],
    ],
  },
  {
    type: 'p',
    content: [
      'Vi strävar efter att endast ge tjänsteleverantörer tillgång till de uppgifter som behövs för respektive tjänst.',
    ],
  },
  { type: 'h2', text: '14. Överföring till länder utanför EU/EES' },
  {
    type: 'p',
    content: [
      'SeniorHub använder tjänsteleverantörer som kan vara etablerade utanför EU/EES eller som kan behandla personuppgifter från länder utanför EU/EES.',
    ],
  },
  {
    type: 'p',
    content: [
      'När personuppgifter överförs till ett land utanför EU/EES görs detta enligt de regler som gäller enligt GDPR.',
    ],
  },
  {
    type: 'p',
    content: [
      'Det kan exempelvis ske med stöd av ett beslut om adekvat skyddsnivå eller lämpliga skyddsåtgärder såsom EU-kommissionens standardavtalsklausuler (SCC), när detta är tillämpligt.',
    ],
  },
  {
    type: 'p',
    content: ['Vi lämnar inte en generell garanti för att all behandling sker inom EU/EES.'],
  },
  { type: 'h2', text: '15. Hur länge sparar vi personuppgifter?' },
  {
    type: 'p',
    content: [
      'Vi sparar personuppgifter endast så länge de behövs för de ändamål som beskrivs i denna integritetspolicy, eller så länge vi behöver spara dem enligt lag.',
    ],
  },
  { type: 'h3', text: 'Kontouppgifter' },
  {
    type: 'p',
    content: ['Ditt konto och dina profiluppgifter sparas så länge ditt konto är aktivt.'],
  },
  { type: 'h3', text: 'Bokningar' },
  {
    type: 'p',
    content: [
      'Uppgifter om bokningar kan sparas efter att en aktivitet har genomförts för att kunna hantera historik och statistik.',
    ],
  },
  {
    type: 'p',
    content: [
      'När du raderar ditt konto anonymiseras uppgifter som annars skulle kunna kopplas till dig i sådan historik.',
    ],
  },
  { type: 'h3', text: 'Aktiviteter' },
  {
    type: 'p',
    content: [
      'Aktiviteter och aktivitetsinformation kan sparas efter att aktiviteten har passerat för att arrangörer ska kunna se historik och statistik.',
    ],
  },
  {
    type: 'p',
    content: ['Passerade aktiviteter visas inte som vanliga kommande aktiviteter.'],
  },
  { type: 'h3', text: 'Säkerhetsuppgifter' },
  {
    type: 'p',
    content: [
      'Säkerhetsrelaterade uppgifter kan sparas under en begränsad period när det behövs för att skydda tjänsten mot missbruk, felsöka säkerhetsproblem eller hantera rättsliga krav.',
    ],
  },
  {
    type: 'p',
    content: ['När personuppgifter inte längre behövs ska de raderas eller anonymiseras.'],
  },
  { type: 'h2', text: '16. Vad händer när du raderar ditt konto?' },
  {
    type: 'p',
    content: ['Du kan radera ditt SeniorHub-konto via kontoinställningarna i appen.'],
  },
  {
    type: 'p',
    content: ['När kontot raderas tar vi bort eller raderar bland annat:'],
  },
  {
    type: 'ul',
    items: [
      ['ditt användarkonto'],
      ['dina profiluppgifter'],
      ['din profilbild'],
      ['push- och notisuppgifter kopplade till kontot'],
      ['relevanta arrangörsansökningar'],
      ['andra personuppgifter som inte längre behöver finnas kvar.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Tidigare bokningshistorik kan däremot behållas i anonymiserad form för historik och statistik.',
    ],
  },
  {
    type: 'p',
    content: [
      'I sådan historik tas uppgifter som kan identifiera dig bort eller anonymiseras.',
    ],
  },
  {
    type: 'p',
    content: [
      'Vissa uppgifter kan behöva behållas om detta krävs enligt lag eller om det är nödvändigt för att fastställa, göra gällande eller försvara rättsliga anspråk.',
    ],
  },
  {
    type: 'p',
    content: [
      'Google Play kräver att användare ska kunna begära kontoradering både i appen och via en extern webbresurs. SeniorHub kommer därför även att tillhandahålla en offentlig sida för kontoradering på seniorhub.se.',
    ],
  },
  { type: 'h2', text: '17. Dina rättigheter enligt GDPR' },
  {
    type: 'p',
    content: [
      'Du har, beroende på omständigheterna och de villkor som anges i GDPR, rätt att:',
    ],
  },
  {
    type: 'ul',
    items: [
      ['få information om hur dina personuppgifter behandlas'],
      ['begära tillgång till dina personuppgifter'],
      ['begära rättelse av felaktiga eller ofullständiga uppgifter'],
      ['begära radering av dina personuppgifter'],
      ['begära begränsning av behandlingen'],
      ['invända mot viss behandling'],
      [
        'få ut vissa personuppgifter i ett strukturerat, allmänt använt och maskinläsbart format (dataportabilitet)',
      ],
      ['återkalla ett samtycke när en behandling grundas på samtycke.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Att återkalla ett samtycke påverkar inte lagligheten av behandling som utförts innan samtycket återkallades.',
    ],
  },
  {
    type: 'p',
    content: ['Vissa rättigheter gäller endast under de förutsättningar som anges i GDPR.'],
  },
  { type: 'p', content: ['För att använda dina rättigheter kan du kontakta:'] },
  {
    type: 'p',
    content: [{ link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' }],
  },
  { type: 'h2', text: '18. Klagomål till Integritetsskyddsmyndigheten' },
  {
    type: 'p',
    content: [
      'Om du anser att SeniorHub behandlar dina personuppgifter på ett sätt som strider mot GDPR kan du först kontakta oss så att vi får möjlighet att hantera frågan.',
    ],
  },
  {
    type: 'p',
    content: [
      { text: 'Du har även rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY).', bold: true },
    ],
  },
  { type: 'h2', text: '19. Ändringar av integritetspolicyn' },
  {
    type: 'p',
    content: [
      'Vi kan uppdatera denna integritetspolicy om SeniorHub förändras, om vi börjar använda nya tjänster eller om lagstiftningen ändras.',
    ],
  },
  {
    type: 'p',
    content: [
      'Vid större förändringar informerar vi användarna på lämpligt sätt innan förändringen börjar gälla när detta krävs enligt lag.',
    ],
  },
  { type: 'p', content: ['Den aktuella versionen av integritetspolicyn finns på:'] },
  { type: 'p', content: [{ text: 'seniorhub.se/integritet', bold: true }] },
  {
    type: 'meta',
    content: [{ text: 'Senast uppdaterad: 29 september 2026', bold: true }],
  },
];
