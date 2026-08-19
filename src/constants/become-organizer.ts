export type OrganizerBenefit = {
  icon: string;
  title: string;
};

export const ORGANIZER_BENEFITS: OrganizerBenefit[] = [
  {
    icon: '📅',
    title: 'Skapa aktiviteter på några minuter',
  },
  {
    icon: '👥',
    title: 'Hantera bokningar och deltagare enkelt',
  },
  {
    icon: '📍',
    title: 'Nå seniorer i ditt närområde',
  },
  {
    icon: '📢',
    title: 'Kommunicera med deltagare',
  },
  {
    icon: '❤️',
    title: 'Bidra till ökad gemenskap och minskad ensamhet',
  },
  {
    icon: '🏛',
    title: 'Perfekt för kommuner, föreningar, kyrkor, caféer och företag',
  },
];

export const ORGANIZER_ELIGIBILITY_ITEMS = [
  'Kommuner',
  'Föreningar',
  'SPF och PRO',
  'Kyrkor',
  'Caféer',
  'Företag',
  'Ideella organisationer',
  'Aktivitetssamordnare',
] as const;
