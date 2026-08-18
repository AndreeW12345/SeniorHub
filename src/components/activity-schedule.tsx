import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import { formatDateDisplay, formatTimeDisplayForCard } from '@/utils/date-time-format';

type ActivityScheduleProps = {
  date: string;
  time: string;
};

/** Simple date and time rows for activity cards. */
export function ActivitySchedule({ date, time }: ActivityScheduleProps) {
  return (
    <>
      <ActivityCardMetaRow
        icon="📅"
        value={formatDateDisplay(date)}
        accessibilityPrefix="Datum"
      />
      <ActivityCardMetaRow
        icon="🕐"
        value={formatTimeDisplayForCard(time)}
        accessibilityPrefix="Tid"
      />
    </>
  );
}
