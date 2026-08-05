/** Snapshot of fields that can trigger activity-update notifications. */
export type ImportantActivityFields = {
  title: string;
  date: string;
  time: string;
  location: string;
  fullAddress?: string | null;
  isCancelled?: boolean | null;
};

export type ImportantActivityChange = 'cancelled' | 'date' | 'time' | 'location';

export type ActivityUpdateAnnouncementContent = {
  /** Inbox / OS icon. */
  icon: string;
  title: string;
  message: string;
  change: ImportantActivityChange;
};

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function resolvePlaceKey(fields: ImportantActivityFields): string {
  const fullAddress = normalizeText(fields.fullAddress);
  if (fullAddress) {
    return fullAddress.toLocaleLowerCase('sv-SE');
  }

  return normalizeText(fields.location).toLocaleLowerCase('sv-SE');
}

/** Detects which important fields changed between two activity versions. */
export function detectImportantActivityChanges(
  previous: ImportantActivityFields,
  next: ImportantActivityFields,
): ImportantActivityChange[] {
  const changes: ImportantActivityChange[] = [];

  const wasCancelled = previous.isCancelled === true;
  const isCancelled = next.isCancelled === true;

  if (!wasCancelled && isCancelled) {
    changes.push('cancelled');
  }

  if (normalizeText(previous.date) !== normalizeText(next.date)) {
    changes.push('date');
  }

  if (normalizeText(previous.time) !== normalizeText(next.time)) {
    changes.push('time');
  }

  if (resolvePlaceKey(previous) !== resolvePlaceKey(next)) {
    changes.push('location');
  }

  return changes;
}

/**
 * Picks a single notification when several important fields change at once.
 * Priority: cancelled → date → time → location.
 */
function pickPrimaryActivityChange(
  changes: ImportantActivityChange[],
): ImportantActivityChange | null {
  if (changes.includes('cancelled')) {
    return 'cancelled';
  }

  if (changes.includes('date')) {
    return 'date';
  }

  if (changes.includes('time')) {
    return 'time';
  }

  if (changes.includes('location')) {
    return 'location';
  }

  return null;
}

/** Builds the Swedish title/message for one important activity change. */
export function buildActivityUpdateAnnouncementContent(
  activityTitle: string,
  changes: ImportantActivityChange[],
): ActivityUpdateAnnouncementContent | null {
  const change = pickPrimaryActivityChange(changes);
  if (!change) {
    return null;
  }

  const title = normalizeText(activityTitle) || 'aktiviteten';

  switch (change) {
    case 'cancelled':
      return {
        icon: '❌',
        title: 'Aktiviteten är inställd',
        message: `'${title}' har ställts in.`,
        change,
      };
    case 'date':
      return {
        icon: '📅',
        title: 'Nytt datum',
        message: `Aktiviteten '${title}' har fått ett nytt datum.`,
        change,
      };
    case 'time':
      return {
        icon: '🕒',
        title: 'Ändrad tid',
        message: `Tiden för '${title}' har ändrats.`,
        change,
      };
    case 'location':
      return {
        icon: '📍',
        title: 'Ändrad plats',
        message: `Platsen för '${title}' har ändrats.`,
        change,
      };
  }
}
