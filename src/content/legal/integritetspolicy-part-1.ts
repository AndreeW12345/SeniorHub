import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Integritetspolicy blocks §1–§6 (approved 29 september 2026). */
export const integritetspolicyPart1: LegalBlock[] = [
  { type: 'docTitle', text: 'INTEGRITETSPOLICY' },
  {
    type: 'lead',
    content: [{ text: 'Integritetspolicy för SeniorHub', bold: true }],
  },
  {
    type: 'meta',
    content: [{ text: 'Senast uppdaterad: 29 september 2026', bold: true }],
  },
  {
    type: 'p',
    content: [
      'Denna integritetspolicy beskriver hur ("SeniorHub", "Appen", "vi" eller "oss") behandlar personuppgifter när du använder SeniorHub.',
    ],
  },
  {
    type: 'p',
    content: [
      'Vi behandlar personuppgifter i enlighet med EU:s dataskyddsförordning (GDPR) och annan tillämplig lagstiftning.',
    ],
  },
  { type: 'h2', text: '1. Personuppgiftsansvarig' },
  { type: 'meta', content: [{ text: 'Personuppgiftsansvarig:', bold: true }] },
  { type: 'p', content: ['Andree Westerlund'] },
  { type: 'meta', content: [{ text: 'E-post:', bold: true }] },
  {
    type: 'p',
    content: [{ link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' }],
  },
  { type: 'meta', content: [{ text: 'Webbplats:', bold: true }] },
  { type: 'p', content: ['seniorhub.se'] },
  {
    type: 'p',
    content: [
      'Om du har frågor om hur dina personuppgifter behandlas eller vill använda dina rättigheter enligt GDPR är du välkommen att kontakta oss på ',
      { link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' },
      '.',
    ],
  },
  { type: 'h2', text: '2. Vilka personuppgifter behandlar vi?' },
  {
    type: 'p',
    content: ['Vilka personuppgifter vi behandlar beror på hur du använder SeniorHub.'],
  },
  { type: 'h3', text: 'När du skapar ett konto' },
  { type: 'p', content: ['Vi kan behandla:'] },
  {
    type: 'ul',
    items: [
      ['namn'],
      ['e-postadress'],
      ['telefonnummer'],
      ['användar-ID'],
      ['uppgifter om när kontot skapades och uppdaterades'],
      [
        'uppgifter om att du har godkänt användarvillkoren och tagit del av integritetspolicyn.',
      ],
    ],
  },
  { type: 'h3', text: 'Profilbild' },
  {
    type: 'p',
    content: [
      'Om du väljer att lägga till en profilbild behandlar vi bilden och den tekniska information som behövs för att visa den i SeniorHub.',
    ],
  },
  { type: 'h3', text: 'Bokningar och väntelistor' },
  { type: 'p', content: ['När du bokar en aktivitet behandlar vi bland annat:'] },
  {
    type: 'ul',
    items: [
      ['namn'],
      ['telefonnummer'],
      ['vilken aktivitet du har bokat'],
      ['bokningsstatus'],
      ['tidpunkt för bokningen'],
      ['eventuell väntelisteplats'],
      ['uppgifter om avbokning eller ändrad bokningsstatus.'],
    ],
  },
  {
    type: 'p',
    content: [
      'För den aktivitet du har bokat kan arrangören och behöriga administratörer få tillgång till ditt namn och telefonnummer när detta behövs för att administrera aktiviteten och deltagandet.',
    ],
  },
  { type: 'h2', text: '3. Aktiviteter, arrangörer och organisationer' },
  {
    type: 'p',
    content: [
      'SeniorHub innehåller information om aktiviteter, arrangörer och organisationer.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om du använder SeniorHub som arrangör, eller om en administratör lägger till dig som arrangör, kan vi behandla uppgifter som behövs för att administrera arrangörsrollen.',
    ],
  },
  { type: 'p', content: ['Det kan exempelvis vara:'] },
  {
    type: 'ul',
    items: [
      ['namn'],
      ['telefonnummer'],
      ['e-postadress'],
      ['organisation'],
      ['organisationsbeskrivning'],
      ['webbplats'],
      ['medlems- eller anmälningslänk'],
      ['ort eller adress'],
      ['bilder och logotyper'],
      ['information om aktiviteter som publiceras i SeniorHub.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Aktivitetsinformation kan exempelvis innehålla titel, beskrivning, datum, tid, plats, adress, bilder, kontaktuppgifter och information om hur deltagare anmäler sig.',
    ],
  },
  {
    type: 'p',
    content: [
      'Viss information om aktiviteter, arrangörer och organisationer kan visas offentligt i SeniorHub.',
    ],
  },
  { type: 'h2', text: '4. Ansökan om att bli arrangör' },
  {
    type: 'p',
    content: [
      'Om du ansöker om att bli arrangör behandlar vi de uppgifter du själv lämnar i ansökan.',
    ],
  },
  { type: 'p', content: ['Det kan exempelvis vara:'] },
  {
    type: 'ul',
    items: [
      ['namn'],
      ['e-postadress'],
      ['telefonnummer'],
      ['organisation'],
      ['beskrivning av verksamheten'],
      ['webbplats'],
      ['annan information som du lämnar i ansökan.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Vi använder uppgifterna för att behandla din ansökan och kunna kontakta dig angående ansökan.',
    ],
  },
  { type: 'h2', text: '5. Favoriter och information som sparas på din enhet' },
  {
    type: 'p',
    content: ['Vissa uppgifter sparas lokalt på din telefon eller annan enhet.'],
  },
  { type: 'p', content: ['Det kan exempelvis vara:'] },
  {
    type: 'ul',
    items: [
      ['aktiviteter som du markerat som favoriter'],
      ['lokal information om bokningar'],
      ['lokala notiser'],
      ['tillfällig information som behövs vid registrering eller inloggning.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Favoriter sparas lokalt på enheten och synkroniseras inte till ditt SeniorHub-konto.',
    ],
  },
  { type: 'h2', text: '6. Pushnotiser' },
  {
    type: 'p',
    content: [
      'Om du använder funktioner som kräver pushnotiser kan SeniorHub behandla teknisk information som behövs för att skicka notiser till din enhet, exempelvis push- och enhetstoken.',
    ],
  },
  { type: 'p', content: ['Vi kan skicka notiser om exempelvis:'] },
  {
    type: 'ul',
    items: [
      ['bokningsbekräftelser'],
      ['väntelistor'],
      ['förändringar i aktiviteter'],
      ['påminnelser inför aktiviteter'],
      ['information från arrangörer som rör aktiviteter du deltar i.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Du kan styra vissa typer av notiser genom inställningarna i SeniorHub och/eller på din enhet.',
    ],
  },
];
