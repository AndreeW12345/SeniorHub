/** Admin-sent activity announcements stored under activities/{id}/announcements. */
export type ActivityAnnouncement = {
  id: string;
  activityId: string;
  title: string;
  message: string;
  createdAt: Date;
  createdBy?: string;
};
