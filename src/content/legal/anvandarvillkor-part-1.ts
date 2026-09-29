import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Användarvillkor blocks §1–§8. */
export const anvandarvillkorPart1: LegalBlock[] = [
  { type: 'docTitle', text: 'ANVÄNDARVILLKOR' },
  {
    type: 'lead',
    content: [{ text: 'Användarvillkor för SeniorHub', bold: true }],
  },
  {
    type: 'meta',
    content: [{ text: 'Senast uppdaterad: 29 september 2026', bold: true }],
  },
  {
    type: 'p',
    content: [
      'Dessa användarvillkor ("Villkoren") gäller för användning av SeniorHub ("SeniorHub", "Appen", "vi" eller "oss").',
    ],
  },
  {
    type: 'p',
    content: [
      'Genom att skapa ett konto och använda SeniorHub godkänner du dessa Villkor.',
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub är en digital tjänst som gör det möjligt för användare att hitta aktiviteter, se information om arrangörer och i förekommande fall boka platser till aktiviteter.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '1. Om SeniorHub' },
  {
    type: 'p',
    content: ['SeniorHub är en plattform för att hitta och administrera aktiviteter.'],
  },
  {
    type: 'p',
    content: [
      'SeniorHub kan visa information om aktiviteter som publiceras av arrangörer och organisationer.',
    ],
  },
  { type: 'p', content: ['Beroende på aktivitet kan användaren:'] },
  {
    type: 'ul',
    items: [
      ['se information om aktiviteten'],
      ['spara aktiviteter som favoriter'],
      ['boka en plats'],
      ['ställa sig i väntelista'],
      ['avboka en bokning'],
      ['få information och påminnelser om aktiviteter.'],
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub tillhandahåller själva plattformen. Den enskilda aktiviteten arrangeras av den arrangör eller organisation som publicerat aktiviteten.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '2. Konto och registrering' },
  {
    type: 'p',
    content: [
      'För att använda vissa funktioner i SeniorHub behöver du skapa ett personligt konto.',
    ],
  },
  { type: 'p', content: ['Vid registrering kan du behöva lämna:'] },
  {
    type: 'ul',
    items: [['namn'], ['telefonnummer'], ['e-postadress.']],
  },
  {
    type: 'p',
    content: ['Du ansvarar för att de uppgifter du lämnar är korrekta och aktuella.'],
  },
  {
    type: 'p',
    content: ['Ditt konto är personligt och får inte överlåtas eller användas av någon annan.'],
  },
  {
    type: 'p',
    content: ['Du ansvarar för att inte medvetet ge någon annan tillgång till ditt konto.'],
  },
  {
    type: 'p',
    content: [
      'SeniorHub använder e-postbaserad inloggning. Du får inte försöka kringgå säkerhetsfunktioner eller få åtkomst till andra användares konton.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '3. Användning av SeniorHub' },
  {
    type: 'p',
    content: ['Du förbinder dig att använda SeniorHub på ett lagligt och ansvarsfullt sätt.'],
  },
  { type: 'p', content: ['Du får inte:'] },
  {
    type: 'ul',
    items: [
      [
        'försöka få obehörig åtkomst till SeniorHub eller andra användares konton eller uppgifter',
      ],
      ['försöka kringgå säkerhetsfunktioner'],
      ['använda skadlig kod eller andra metoder som kan skada SeniorHub'],
      ['störa eller försöka störa tjänstens funktion'],
      ['använda automatiserade metoder för att missbruka tjänsten'],
      ['använda SeniorHub för olagliga ändamål'],
      [
        'lämna medvetet falska uppgifter när detta kan påverka andra användare eller SeniorHubs funktion.',
      ],
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '4. Aktiviteter och information från arrangörer' },
  {
    type: 'p',
    content: ['Aktiviteter i SeniorHub kan publiceras av arrangörer och organisationer.'],
  },
  {
    type: 'p',
    content: [
      'Arrangören ansvarar för att informationen om den aktivitet som arrangören publicerar är korrekt och aktuell.',
    ],
  },
  { type: 'p', content: ['Det kan exempelvis gälla:'] },
  {
    type: 'ul',
    items: [
      ['datum och tid'],
      ['plats'],
      ['beskrivning'],
      ['kapacitet'],
      ['medlemskrav'],
      ['kontaktuppgifter'],
      ['externa anmälningslänkar'],
      ['information om eventuell avgift eller betalning.'],
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub ansvarar inte för att en arrangörs aktivitet faktiskt genomförs, om den ställs in, ändras eller motsvarar den information som arrangören lämnat.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om en aktivitet ställs in eller ändras bör du i första hand kontakta den aktuella arrangören.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '5. Bokningar' },
  {
    type: 'p',
    content: [
      'När en aktivitet erbjuder bokning via SeniorHub kan du boka en plats genom appen.',
    ],
  },
  {
    type: 'p',
    content: [
      'En bokning registreras enligt de regler som gäller för den aktuella aktiviteten, exempelvis eventuell kapacitet eller medlemsbegränsning.',
    ],
  },
  {
    type: 'p',
    content: ['När du bokar en aktivitet ansvarar du för att lämna korrekta uppgifter.'],
  },
  {
    type: 'p',
    content: [
      'Din bokning kan innebära att ditt namn och telefonnummer görs tillgängligt för den arrangör eller organisation som ansvarar för aktiviteten, när detta behövs för att administrera deltagandet.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '6. Väntelista' },
  {
    type: 'p',
    content: [
      'Om en aktivitet är full kan SeniorHub erbjuda möjlighet att ställa sig i väntelista.',
    ],
  },
  {
    type: 'p',
    content: [
      'Väntelistan hanteras enligt SeniorHubs tekniska funktioner och kan innebära att personer flyttas automatiskt från väntelista till deltagarplats när en plats blir ledig.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om du får en plats genom väntelistan kan SeniorHub skicka en notis eller annan information om förändringen.',
    ],
  },
  {
    type: 'p',
    content: ['Du ansvarar själv för att kontrollera information om din bokningsstatus.'],
  },
  { type: 'hr' },
  { type: 'h2', text: '7. Avbokning' },
  {
    type: 'p',
    content: [
      'Om du inte längre kan delta i en aktivitet bör du avboka din bokning så snart som möjligt när avbokningsfunktionen finns tillgänglig.',
    ],
  },
  {
    type: 'p',
    content: [
      'En avbokning kan göra att en annan användare på väntelistan får möjlighet att delta.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om arrangören har egna regler för avbokning eller deltagande kan dessa regler också gälla för aktiviteten.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '8. Arrangörer och organisationer' },
  {
    type: 'p',
    content: [
      'SeniorHub kan ge vissa användare tillgång till funktioner för arrangörer och organisationer.',
    ],
  },
  {
    type: 'p',
    content: [
      'Arrangörer kan bland annat publicera aktiviteter och administrera deltagare i sina aktiviteter.',
    ],
  },
  {
    type: 'p',
    content: [
      'En arrangör ansvarar för det innehåll som arrangören publicerar och för att informationen är korrekt och följer tillämplig lag.',
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub kan ta bort eller ändra innehåll som exempelvis är uppenbart olagligt, kränkande, vilseledande, skadligt eller strider mot dessa Villkor.',
    ],
  },
];
