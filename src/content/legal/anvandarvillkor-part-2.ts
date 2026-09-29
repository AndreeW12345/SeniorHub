import type { LegalBlock } from '@/components/legal/legal-document-renderer';

/** Användarvillkor blocks §9–§16. */
export const anvandarvillkorPart2: LegalBlock[] = [
  { type: 'hr' },
  { type: 'h2', text: '9. Bilder, texter och annat innehåll' },
  {
    type: 'p',
    content: [
      'Om du som arrangör laddar upp bilder, texter eller annat innehåll till SeniorHub ansvarar du för att du har rätt att använda och publicera materialet.',
    ],
  },
  { type: 'p', content: ['Du får inte publicera material som:'] },
  {
    type: 'ul',
    items: [
      ['gör intrång i någon annans upphovsrätt eller andra rättigheter'],
      ['innehåller olagligt material'],
      ['är kränkande eller hotfullt'],
      ['innehåller skadlig kod'],
      ['på annat sätt bryter mot lag eller dessa Villkor.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Genom att publicera material i SeniorHub ger du SeniorHub en icke-exklusiv rätt att lagra, tekniskt bearbeta och visa materialet i den utsträckning som krävs för att tillhandahålla SeniorHubs tjänst.',
    ],
  },
  { type: 'p', content: ['Du behåller dina rättigheter till materialet.'] },
  {
    type: 'p',
    content: [
      'När materialet inte längre behöver användas för tjänsten ska det hanteras enligt SeniorHubs integritetspolicy och tillämpliga regler.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '10. Externa webbplatser och tjänster' },
  {
    type: 'p',
    content: [
      'SeniorHub kan innehålla länkar till arrangörers webbplatser eller andra externa tjänster.',
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub ansvarar inte för innehållet, tillgängligheten, säkerheten eller villkoren på externa webbplatser.',
    ],
  },
  { type: 'p', content: ['Om en arrangör använder en extern webbplats för exempelvis:'] },
  {
    type: 'ul',
    items: [
      ['medlemskap'],
      ['anmälan'],
      ['betalning'],
      ['bokning'],
      ['ytterligare information'],
    ],
  },
  {
    type: 'p',
    content: [
      'ingår du eventuella avtal direkt med den aktuella arrangören eller tjänsteleverantören.',
    ],
  },
  { type: 'p', content: ['SeniorHub är inte part i dessa avtal.'] },
  { type: 'hr' },
  { type: 'h2', text: '11. Betalningar' },
  {
    type: 'p',
    content: ['SeniorHub tar för närvarande inte emot betalningar för aktiviteter direkt i appen.'],
  },
  {
    type: 'p',
    content: [
      'Om en arrangör tar betalt för en aktivitet eller använder en extern betaltjänst sker betalningen enligt villkoren mellan dig och arrangören eller den aktuella betaltjänsten.',
    ],
  },
  {
    type: 'p',
    content: [
      'Eventuella frågor om pris, återbetalning, medlemskap eller betalning ska därför normalt hanteras med den aktuella arrangören.',
    ],
  },
  {
    type: 'p',
    content: [
      'Detta påverkar inte rättigheter som du kan ha enligt tvingande lagstiftning.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '12. Arrangörens ansvar för aktiviteter' },
  {
    type: 'p',
    content: [
      'Arrangören ansvarar för själva aktiviteten, inklusive dess genomförande, innehåll, säkerhet och eventuella villkor som gäller för deltagande.',
    ],
  },
  {
    type: 'p',
    content: [
      'SeniorHub är en teknisk plattform och är inte arrangör av de aktiviteter som andra användare eller organisationer publicerar.',
    ],
  },
  { type: 'p', content: ['SeniorHub lämnar därför inga garantier för exempelvis:'] },
  {
    type: 'ul',
    items: [
      ['att en aktivitet genomförs'],
      ['att aktiviteten motsvarar arrangörens beskrivning'],
      ['arrangörens kvalitet eller tjänster'],
      ['arrangörens medlemsvillkor'],
      ['eventuella kostnader som arrangören tar ut.'],
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '13. Immateriella rättigheter' },
  {
    type: 'p',
    content: [
      'SeniorHub och dess licensgivare behåller rättigheterna till SeniorHubs egna delar, inklusive exempelvis:',
    ],
  },
  {
    type: 'ul',
    items: [
      ['appens design'],
      ['logotyper'],
      ['grafik'],
      ['texter som SeniorHub själv skapat'],
      ['programkod'],
      ['varumärken.'],
    ],
  },
  { type: 'p', content: ['Du får använda SeniorHub för dess avsedda ändamål.'] },
  {
    type: 'p',
    content: [
      'Du får inte utan tillstånd kopiera, modifiera, distribuera, sälja eller på annat sätt exploatera SeniorHubs egna material eller programvara, annat än vad som följer av tvingande lag.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '14. Tillgänglighet och tekniska problem' },
  {
    type: 'p',
    content: [
      'Vi strävar efter att SeniorHub ska fungera på ett säkert och tillförlitligt sätt.',
    ],
  },
  { type: 'p', content: ['Vi kan dock inte garantera att tjänsten alltid är:'] },
  {
    type: 'ul',
    items: [
      ['tillgänglig'],
      ['felfri'],
      ['fri från avbrott'],
      ['kompatibel med alla enheter eller programvaruversioner.'],
    ],
  },
  { type: 'p', content: ['Tillfälliga avbrott kan exempelvis bero på:'] },
  {
    type: 'ul',
    items: [
      ['underhåll'],
      ['tekniska problem'],
      ['uppdateringar'],
      ['problem hos externa tjänsteleverantörer'],
      ['internet- eller nätverksproblem'],
      ['omständigheter utanför vår kontroll.'],
    ],
  },
  {
    type: 'p',
    content: [
      'Om SeniorHub inte fungerar som avsett kan du kontakta oss på ',
      { link: 'support@seniorhub.se', href: 'mailto:support@seniorhub.se' },
      '.',
    ],
  },
  {
    type: 'p',
    content: [
      'Om SeniorHub omfattas av tvingande regler om digitala tjänsters felansvar påverkas inte dina lagstadgade rättigheter av dessa Villkor. Konsumentverket beskriver bland annat att konsumenter kan ha rätt att få fel i digitala tjänster avhjälpta enligt konsumentlagstiftningen.',
    ],
  },
  { type: 'hr' },
  { type: 'h2', text: '15. Kontoavstängning och avslutande av konto' },
  {
    type: 'p',
    content: [
      'Du kan när som helst välja att avsluta ditt konto genom kontofunktionen i SeniorHub.',
    ],
  },
  {
    type: 'p',
    content: ['Vid kontoradering behandlas dina personuppgifter enligt vår integritetspolicy.'],
  },
  {
    type: 'p',
    content: [
      'SeniorHub kan begränsa eller avsluta ett konto om det är nödvändigt på grund av exempelvis:',
    ],
  },
  {
    type: 'ul',
    items: [
      ['allvarliga eller upprepade överträdelser av dessa Villkor'],
      ['försök att kringgå säkerhetsfunktioner'],
      ['missbruk av tjänsten'],
      ['olaglig användning'],
      ['säkerhetsrisker.'],
    ],
  },
  {
    type: 'p',
    content: ['När det är möjligt och lämpligt kan vi informera användaren om orsaken.'],
  },
  {
    type: 'p',
    content: ['Detta påverkar inte rättigheter som följer av tvingande lag.'],
  },
  { type: 'hr' },
  { type: 'h2', text: '16. Kontoradering' },
  {
    type: 'p',
    content: ['Du kan radera ditt SeniorHub-konto direkt i appen.'],
  },
  {
    type: 'p',
    content: ['Om du inte längre har tillgång till appen kan du även begära kontoradering via:'],
  },
  { type: 'p', content: [{ text: 'seniorhub.se/radera-konto', bold: true }] },
  {
    type: 'p',
    content: ['När kontot raderas behandlas uppgifterna enligt vår integritetspolicy.'],
  },
  {
    type: 'p',
    content: [
      'Viss information kan behöva behållas i anonymiserad form, exempelvis historiska bokningsuppgifter för statistik och historik, eller när lag kräver att uppgifter sparas.',
    ],
  },
];
