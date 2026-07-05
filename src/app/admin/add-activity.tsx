import { useRouter, type Href } from 'expo-router';

import { AdminActivityForm } from '@/components/admin-activity-form';
import { useActivities } from '@/contexts/activities-context';

export default function AddActivityScreen() {
  const router = useRouter();
  const { refreshActivities } = useActivities();

  return (
    <AdminActivityForm
      mode="create"
      onSubmitSuccess={async () => {
        await refreshActivities();
        router.replace('/admin?saved=1' as Href);
      }}
    />
  );
}
