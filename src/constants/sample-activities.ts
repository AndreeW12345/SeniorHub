import type { Activity } from '@/constants/activities';

/** Local fallback activities used when Firestore is empty or unavailable. */
export const SAMPLE_ACTIVITIES: Activity[] = [
  {
    id: '1',
    title: 'Morgongymnastik i parken',
    description:
      'Välkommen till en lugn och gemensam morgonstund i Stadsparken. Vi gör enkla rörelser som passar alla nivåer, med fokus på balans, rörlighet och välmående. Instruktör finns på plats och anpassar övningarna efter gruppen. Ta med vattenflaska och bekväma kläder.',
    date: 'Tisdag 8 juli',
    time: '09:00 – 10:00',
    location: 'Stadsparken, huvudentrén',
    organizer: 'Seniorrådet',
    category: 'Träning',
    imageUrl:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&h=560&fit=crop&q=80',
  },
  {
    id: '2',
    title: 'Kaffeträff och samtal',
    description:
      'En avslappnad träff där du kan njuta av kaffe och fika i trevligt sällskap. Här finns tid för samtal, nya bekantskaper och gemenskap i en varm och välkomnande miljö. Alla är välkomna, och personal från Frivilligcentralen finns på plats om du vill ha sällskap vid bordet.',
    date: 'Onsdag 9 juli',
    time: '14:00 – 16:00',
    location: 'Kulturhuset, sal 2',
    organizer: 'Frivilligcentralen',
    category: 'Fika',
    imageUrl: null,
  },
  {
    id: '3',
    title: 'Bingo och lotteri',
    description:
      'En kväll fylld av spänning och gemenskap i Medborgarhuset. Vi spelar bingo tillsammans och avslutar med ett enkelt lotteri med fina priser. Det går bra att komma själv eller tillsammans med vänner. Personal hjälper gärna till om du är ny i gruppen.',
    date: 'Torsdag 10 juli',
    time: '18:30 – 20:00',
    location: 'Medborgarhuset',
    organizer: 'Pensionärsföreningen',
    category: 'Spel',
    imageUrl: null,
  },
  {
    id: '4',
    title: 'Naturpromenad vid sjön',
    description:
      'Vi promenerar i lagom takt längs Södra strandpromenaden och njuter av naturen vid sjön. Guiden berättar om områdets historia och stoppar vid fina utsiktsplatser. Promenaden är cirka tre kilometer och anpassas efter gruppens tempo. Ta gärna med sittunderlag om du vill pausa längs vägen.',
    date: 'Fredag 11 juli',
    time: '10:30 – 12:00',
    location: 'Södra strandpromenaden',
    organizer: 'Friluftsfrämjandet',
    category: 'Promenad',
    imageUrl:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&h=560&fit=crop&q=80',
  },
  {
    id: '5',
    title: 'Filmvisning: Klassiker från 60-talet',
    description:
      'Vi visar en omtyckt svensk filmklassiker från 1960-talet i biosalongens bekväma fåtöljer. Före filmen finns kort information om handlingen och en paus med möjlighet att köpa kaffe. Biljetter delas ut vid entrén och platsreservation behövs inte.',
    date: 'Lördag 12 juli',
    time: '15:00 – 17:30',
    location: 'Bio Röda Kvarn',
    organizer: 'Kulturföreningen',
    category: 'Kultur',
    imageUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=560&fit=crop&q=80',
  },
  {
    id: '6',
    title: 'Kom igång med smarttelefon',
    description:
      'En trygg och praktisk kurs för dig som vill bli mer säker på din smarttelefon. Vi går igenom grundläggande funktioner som samtal, meddelanden, kamera och hur du hittar information på nätet. Kursledare från kommunens digitala vägledning finns på plats och hjälper dig i din egen takt.',
    date: 'Måndag 14 juli',
    time: '10:00 – 11:30',
    location: 'Biblioteket, studierum A',
    organizer: 'Kommunens digitala vägledning',
    category: 'Frivilligt',
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&h=560&fit=crop&q=80',
  },
];
