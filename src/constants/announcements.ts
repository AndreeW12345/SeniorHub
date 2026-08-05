/** How an announcement was created – drives preference gating on ingest. */
export type ActivityAnnouncementKind = 'manual' | 'activity_update';

/** Admin-sent activity announcements stored under activities/{id}/announcements. */
export type ActivityAnnouncement = {
  id: string;
  activityId: string;
  title: string;
  message: string;
  createdAt: Date;
  createdBy?: string;
  /** Defaults to manual for legacy documents. */
  kind?: ActivityAnnouncementKind;
  /** Optional inbox icon (used for automatic activity updates). */
  icon?: string;
};
