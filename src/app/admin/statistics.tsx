import { AdminGuard } from '@/components/admin-guard';
import { AdminStatisticsView } from '@/components/admin-statistics-view';
import { ScreenLayout } from '@/components/screen-layout';

export default function AdminStatisticsScreen() {
  return (
    <AdminGuard>
      <ScreenLayout
        title="Statistik"
        subtitle="Översikt över aktiviteter och deltagare"
        showBackButton
        omitTabInset>
        <AdminStatisticsView />
      </ScreenLayout>
    </AdminGuard>
  );
}
