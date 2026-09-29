import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Användarvillkor blocks §17–§23. */
export const anvandarvillkorPart3: LegalBlock[] = [
  { type: 'hr' },
  { type: 'h2', text: '17. Personuppgifter' },
  {
    type: 'p',
    content: [
      'SeniorHubs behandling av personuppgifter regleras närmare i vår integritetspolicy.',
    ],
  },
  { type: 'p', content: ['Integritetspolicyn finns på:'] },
  { type: 'p', content: [{ text: 'seniorhub.se/integritet', bold: true }] },
  { type: 'p', content: ['Där kan du läsa om bland annat:'] },
  {
    type: 'ul',
    items: [
      ['vilka personuppgifter vi behandlar'],
      ['varför vi behandlar dem'],
      ['rättsliga grunder'],
      ['lagringstider'],
      ['dina rättigheter'],
      ['kontoradering'],
      ['våra tekniska tjänsteleverantörer.'],
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '18. Ändringar av SeniorHub' },
  {
    type: 'p',
    content: ['SeniorHub kan behöva ändras eller utvecklas över tid.'],
  },
  { type: 'p', content: ['Vi kan exempelvis:'] },
  {
    type: 'ul',
    items: [
      ['lägga till nya funktioner'],
      ['ändra befintliga funktioner'],
      ['förbättra säkerheten'],
      ['ta bort funktioner'],
      ['ändra tekniska lösningar.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Om en ändring innebär en väsentlig försämring för användaren eller om lagen kräver det kommer vi att informera användaren på lämpligt sätt.',
    ],
  },
  {
    type: 'p',
    content: [
      'För digitala tjänster kan särskilda lagkrav gälla när tjänstens funktioner eller egenskaper ändras. Dessa lagstadgade rättigheter påverkas inte av dessa Villkor.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '19. Ändringar av användarvillkoren' },
  {
    type: 'p',
    content: ['Vi kan uppdatera dessa Villkor när det behövs, exempelvis om:'],
  },
  {
    type: 'ul',
    items: [
      ['SeniorHub utvecklas'],
      ['nya funktioner införs'],
      ['tjänstens upplägg förändras'],
      ['lagstiftningen förändras'],
      ['säkerhetskraven förändras.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Vid betydande ändringar informerar vi användarna på lämpligt sätt innan de nya Villkoren börjar gälla när detta krävs.',
    ],
  },
  { type: 'p', content: ['Den aktuella versionen finns alltid på:'] },
  { type: 'p', content: [{ text: 'seniorhub.se/villkor', bold: true }] },
  { type: 'hr' },
  { type: 'h2', text: '20. Ansvar och tvingande lagstiftning' },
  {
    type: 'p',
    content: [
      'SeniorHub ansvarar inte för sådant som ligger utanför SeniorHubs kontroll eller för aktiviteter, tjänster eller avtal som tillhandahålls av tredje part, i den utsträckning sådan ansvarsbegränsning är tillåten enligt lag.',
    ],
  },
  {
    type: 'p',
    content: [
      'Ingenting i dessa Villkor begränsar dina rättigheter enligt tvingande konsumentlagstiftning eller annan lagstiftning som inte kan avtalas bort.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om SeniorHub enligt lag har ett ansvar för fel i den digitala tjänsten gäller det ansvaret oavsett vad som står i dessa Villkor.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '21. Klagomål och kontakt' },
  {
    type: 'p',
    content: [
      'Om du har problem med SeniorHub eller anser att tjänsten inte fungerar som den ska är du välkommen att kontakta oss.',
    ],
  },
  { type: 'meta', content: [{ text: 'E-post:', bold: true }] },
  {
    type: 'p',
    content: [{ link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' }],
  },
  {
    type: 'p',
    content: [
      'Vi rekommenderar att du kontaktar oss först så att vi får möjlighet att försöka lösa problemet.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om en konsumenttvist inte kan lösas mellan parterna kan du, när förutsättningarna är uppfyllda, vända dig till Allmänna reklamationsnämnden (ARN) eller allmän domstol.',
    ],
  },
  {
    type: 'p',
    content: [
      'Konsumentverket anger att ARN kan pröva vissa tvister mellan konsumenter och företag när parterna inte kommer överens.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '22. Tillämplig lag och tvister' },
  { type: 'p', content: ['Dessa Villkor ska tolkas enligt svensk lag.'] },
  {
    type: 'p',
    content: [
      'Om en bestämmelse i dessa Villkor skulle strida mot tvingande lagstiftning ska den aktuella lagen ha företräde.',
    ],
  },
  {
    type: 'p',
    content: [
      'Tvister ska hanteras av behörig svensk domstol, med beaktande av de rättigheter som konsumenter kan ha enligt tvingande lagstiftning.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '23. Kontaktuppgifter' },
  { type: 'meta', content: [{ text: 'SeniorHub', bold: true }] },
  {
    type: 'p',
    content: ['Personuppgiftsansvarig och ansvarig för tjänsten:'],
  },
  { type: 'p', content: [{ text: 'Andree Westerlund', bold: true }] },
  { type: 'meta', content: [{ text: 'E-post:', bold: true }] },
  {
    type: 'p',
    content: [{ link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' }],
  },
  { type: 'meta', content: [{ text: 'Webbplats:', bold: true }] },
  { type: 'p', content: ['seniorhub.se'] },
  { type: 'hr' },
  {
    type: 'meta',
    content: [{ text: 'Senast uppdaterad: 29 september 2026', bold: true }],
  },
];
