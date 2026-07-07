import { useRouter, type Href } from 'expo-router';

import { AdminActivityForm } from '@/components/admin-activity-form';
import { AdminGuard } from '@/components/admin-guard';
import { useActivities } from '@/contexts/activities-context';

export default function AddActivityScreen() {
  const router = useRouter();
  const { refreshActivities } = useActivities();

  return (
    <AdminGuard>
      <AdminActivityForm
        mode="create"
        onSubmitSuccess={async () => {
          await refreshActivities();
          router.replace('/admin?saved=1' as Href);
        }}
      />
    </AdminGuard>
  );
}
