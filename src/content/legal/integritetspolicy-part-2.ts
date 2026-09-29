import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Integritetspolicy blocks §7–§12. */
export const integritetspolicyPart2: LegalBlock[] = [
  { type: 'h2', text: '7. Teknisk information och säkerhet' },
  {
    type: 'p',
    content: [
      'För att SeniorHub ska fungera och för att skydda tjänsten mot missbruk kan teknisk information behandlas.',
    ],
  },
  { type: 'p', content: ['Det kan exempelvis innebära:'] },
  {
    type: 'ul',
    items: [
      ['information om vilken plattform du använder'],
      ['tekniska identifierare som behövs för pushnotiser'],
      ['information som behövs för autentisering'],
      ['säkerhetsrelaterad information'],
      ['IP-adress i samband med vissa säkerhets- och begränsningsfunktioner.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Vi använder säkerhetsfunktioner för att bland annat begränsa automatiserade eller missbrukande förfrågningar.',
    ],
  },
  { type: 'h2', text: '8. Säkerhetstjänster och App Check' },
  {
    type: 'p',
    content: [
      'SeniorHub använder säkerhetsfunktioner från Firebase för att kontrollera och skydda förfrågningar till tjänsten samt motverka missbruk.',
    ],
  },
  {
    type: 'p',
    content: [
      'Beroende på vilken plattform du använder kan detta innebära behandling av teknisk information av Google/Firebase och deras tjänster.',
    ],
  },
  {
    type: 'p',
    content: [
      'Dessa säkerhetsfunktioner används för att skydda SeniorHub och inte för att sälja dina personuppgifter eller använda dem för riktad reklam.',
    ],
  },
  { type: 'h2', text: '9. Kartor, adresser och geografisk information' },
  {
    type: 'p',
    content: [
      'När en arrangör skapar en aktivitet kan aktivitetens adress användas för att hitta aktivitetens geografiska position.',
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub kan använda externa geokodningstjänster för att omvandla en adress till geografiska koordinater. Resultatet kan sparas tillsammans med aktiviteten så att aktiviteten kan visas på karta.',
    ],
  },
  {
    type: 'p',
    content: [{ text: 'SeniorHub sparar inte din aktuella GPS-position på våra servrar.', bold: true }],
  },
  {
    type: 'p',
    content: [
      'När du använder kartfunktionen kan SeniorHub på vissa plattformar visa din aktuella position på din egen enhet. Detta sker beroende på enhetens inställningar och vilka behörigheter du har gett appen.',
    ],
  },
  { type: 'h2', text: '10. Varför behandlar vi personuppgifter?' },
  { type: 'p', content: ['Vi behandlar personuppgifter för att:'] },
  {
    type: 'ul',
    items: [
      ['skapa och administrera användarkonton'],
      ['möjliggöra inloggning'],
      ['hantera aktiviteter'],
      ['hantera bokningar och väntelistor'],
      ['låta arrangörer administrera sina aktiviteter och deltagare'],
      ['behandla arrangörsansökningar'],
      ['skicka relevanta tjänstenotiser och påminnelser'],
      ['administrera arrangörer och organisationer'],
      ['upprätthålla säkerheten i SeniorHub'],
      ['förebygga missbruk av tjänsten'],
      ['hantera historik och statistik'],
      ['uppfylla rättsliga skyldigheter'],
      ['fastställa, göra gällande eller försvara rättsliga anspråk när det är nödvändigt.'],
    ],
  },
  { type: 'h2', text: '11. Rättslig grund' },
  {
    type: 'p',
    content: [
      'Vi behandlar personuppgifter med stöd av olika rättsliga grunder beroende på vilken behandling det gäller.',
    ],
  },
  { type: 'h3', text: 'Avtal' },
  {
    type: 'p',
    content: [
      'Vi behandlar de uppgifter som behövs för att kunna tillhandahålla SeniorHub och dess funktioner, exempelvis konto, inloggning, bokningar och väntelistor.',
    ],
  },
  { type: 'h3', text: 'Åtgärder inför avtal' },
  {
    type: 'p',
    content: [
      'När du ansöker om att bli arrangör kan vissa uppgifter behandlas för att hantera din ansökan och vidta åtgärder på din begäran inför ett eventuellt arrangörsförhållande.',
    ],
  },
  { type: 'h3', text: 'Berättigat intresse' },
  {
    type: 'p',
    content: [
      'Vi kan behandla vissa uppgifter när det är nödvändigt för våra berättigade intressen, exempelvis för:',
    ],
  },
  {
    type: 'ul',
    items: [
      ['säkerhet'],
      ['förebyggande av missbruk'],
      ['begränsning av automatiserade eller skadliga förfrågningar'],
      ['teknisk drift'],
      ['hantering av rättsliga anspråk.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Vid sådan behandling gör vi en bedömning av att våra berättigade intressen väger tyngre än den registrerades intressen eller grundläggande rättigheter och friheter, när lagen kräver en sådan bedömning.',
    ],
  },
  { type: 'h3', text: 'Rättslig förpliktelse' },
  {
    type: 'p',
    content: [
      'Om vi enligt lag är skyldiga att behandla eller spara vissa uppgifter kan behandlingen ske med stöd av rättslig förpliktelse.',
    ],
  },
  {
    type: 'p',
    content: [
      'Den rättsliga grunden kan variera beroende på den aktuella behandlingen. GDPR kräver att behandlingen har en tillämplig rättslig grund.',
    ],
  },
  { type: 'h2', text: '12. Använder vi personuppgifter för reklam?' },
  { type: 'p', content: ['Nej.'] },
  { type: 'p', content: ['SeniorHub säljer inte dina personuppgifter.'] },
  {
    type: 'p',
    content: ['Vi använder inte dina personuppgifter för riktad reklam.'],
  },
];
