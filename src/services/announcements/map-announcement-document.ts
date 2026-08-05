import type {
  ActivityAnnouncement,
  ActivityAnnouncementKind,
} from '@/constants/announcements';

function parseCreatedAt(value: unknown): Date | null {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/** Maps a Firestore announcement document into the app model. */
export function mapAnnouncementDocument(
  id: string,
  activityId: string,
  data: Record<string, unknown>,
): ActivityAnnouncement | null {
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const createdAt = parseCreatedAt(data.createdAt);
  const createdBy =
    typeof data.createdBy === 'string' && data.createdBy.trim().length > 0
      ? data.createdBy.trim()
      : undefined;
  const kind: ActivityAnnouncementKind =
    data.kind === 'activity_update' ? 'activity_update' : 'manual';
  const icon =
    typeof data.icon === 'string' && data.icon.trim().length > 0
      ? data.icon.trim()
      : undefined;

  if (!id.trim() || !activityId.trim() || !title || !message || !createdAt) {
    return null;
  }

  return {
    id: id.trim(),
    activityId: activityId.trim(),
    title,
    message,
    createdAt,
    createdBy,
    kind,
    icon,
  };
}
