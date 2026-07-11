import type { Organizer } from '@/constants/organizers';
import { createOrganizerSlug } from '@/utils/organizer-slug';

function sampleOrganizer(
  name: string,
  description: string,
  contact?: Pick<Organizer, 'phone' | 'email' | 'website'>,
): Organizer {
  const slug = createOrganizerSlug(name);

  return {
    id: slug,
    name,
    slug,
    description,
    phone: contact?.phone ?? null,
    email: contact?.email ?? null,
    website: contact?.website ?? null,
  };
}

/** Local fallback organizer profiles used when Firestore is empty or unavailable. */
export const SAMPLE_ORGANIZERS: Organizer[] = [
  sampleOrganizer(
    'Seniorrådet',
    'Seniorrådet arbetar för att skapa meningsfulla aktiviteter och mötesplatser för äldre i kommunen. Vi arrangerar träning, utflykter och samtalsträffar i samarbete med lokala föreningar.',
    {
      phone: '08-123 45 67',
      email: 'info@seniorradet.se',
      website: 'https://www.seniorradet.se',
    },
  ),
  sampleOrganizer(
    'Frivilligcentralen',
    'Frivilligcentralen samordnar engagerade volontärer som vill bidra till gemenskap och trivsel. Här kan du delta i fika, samtal och enklare aktiviteter i en varm och välkomnande miljö.',
    {
      email: 'kontakt@frivilligcentralen.se',
    },
  ),
  sampleOrganizer(
    'Pensionärsföreningen',
    'Pensionärsföreningen samlar medlemmar för sociala aktiviteter, spelkvällar och gemensamma utflykter. Alla är välkomna att prova på – medlemskap krävs inte för att delta i öppna träffar.',
    {
      phone: '08-234 56 78',
    },
  ),
  sampleOrganizer(
    'Friluftsfrämjandet',
    'Friluftsfrämjandet bjuder in till promenader och naturupplevelser i lugnt tempo. Våra guider anpassar turen efter gruppen och delar gärna med sig av kunskap om flora, fauna och lokal historia.',
    {
      website: 'https://www.friluftsframjandet.se',
    },
  ),
  sampleOrganizer(
    'Kulturföreningen',
    'Kulturföreningen arrangerar filmvisningar, föreläsningar och andra kulturella upplevelser för alla åldrar. Vi samarbetar med lokala scener och konstnärer för att göra kulturen tillgänglig nära hemmet.',
    {
      email: 'info@kulturforeningen.se',
      website: 'https://www.kulturforeningen.se',
    },
  ),
  sampleOrganizer(
    'Kommunens digitala vägledning',
    'Kommunens digitala vägledning hjälper dig att bli tryggare med telefon, dator och internet. Vi erbjuder korta kurser och individuellt stöd i din egen takt, utan krav på tidigare erfarenhet.',
    {
      phone: '08-345 67 89',
      email: 'digital@kommunen.se',
    },
  ),
];
