import type { ActivityRegistration } from '@/constants/registrations';

/** FIFO order: earliest `registeredAt` is position 1. */
export function sortWaitlistFifo(
  waitlist: ActivityRegistration[],
): ActivityRegistration[] {
  return [...waitlist].sort(
    (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime(),
  );
}

/**
 * 1-based queue position for a registration id, or null if not on the waitlist.
 */
export function getWaitlistPosition(
  waitlist: ActivityRegistration[],
  registrationId: string | null | undefined,
): number | null {
  const trimmedId = registrationId?.trim();
  if (!trimmedId) {
    return null;
  }

  const ordered = sortWaitlistFifo(waitlist);
  const index = ordered.findIndex((entry) => entry.id === trimmedId);
  return index >= 0 ? index + 1 : null;
}

export function formatWaitlistCountLabel(count: number): string {
  const safeCount = Math.max(0, Math.floor(count));
  return `Väntelista: ${safeCount} ${safeCount === 1 ? 'person' : 'personer'}`;
}

export function formatWaitlistPositionLabel(position: number): string {
  return `Din plats i väntelistan: ${position}`;
}

export function formatWaitlistBookingBadge(position?: number | null): string {
  if (typeof position === 'number' && position > 0) {
    return `Väntelista • Plats ${position}`;
  }

  return 'Väntelisteplats';
}
