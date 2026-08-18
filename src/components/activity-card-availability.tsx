import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import type { Activity } from '@/constants/activities';
import { getActivityCardAvailabilityLabel } from '@/utils/activity-registration';

type ActivityCardAvailabilityProps = {
  activity: Activity;
  bookedCount?: number;
};

/** Simplified seat availability for list cards — detail page shows full registration info. */
export function ActivityCardAvailability({ activity, bookedCount }: ActivityCardAvailabilityProps) {
  const label = getActivityCardAvailabilityLabel(activity, { bookedCount });

  if (!label) {
    return null;
  }

  return <ActivityCardMetaRow icon="👥" value={label} accessibilityPrefix="Platser" />;
}
