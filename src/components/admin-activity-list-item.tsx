import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NotifyParticipantsModal } from '@/components/notify-participants-modal';
import { ThemedText } from '@/components/themed-text';
import { getActivityDisplayLocation, type Activity } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { RECURRENCE_FREQUENCY_LABELS } from '@/constants/recurrence';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { deleteActivityFromFirestore } from '@/services/activities';
import { useTheme } from '@/hooks/use-theme';
import {
  confirmDestructiveAction,
  confirmSeriesDestructiveAction,
  showErrorAlert,
} from '@/utils/confirm-alert';
import { formatDateDisplay, formatTimeDisplay } from '@/utils/date-time-format';
import { isSeriesActivity } from '@/utils/recurrence';

type AdminActivityListItemProps = {
  activity: Activity;
  onDeleted: (activityId: string) => void;
};

export function AdminActivityListItem({ activity, onDeleted }: AdminActivityListItemProps) {
  const router = useRouter();
  const theme = useTheme();
  const categoryVisual = getCategoryVisual(activity.category);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isNotifyModalVisible, setIsNotifyModalVisible] = useState(false);
  const belongsToSeries = isSeriesActivity(activity);

  const performDelete = async (scope: 'occurrence' | 'series' = 'occurrence') => {
    console.log('[SeniorHub] Bekräftad borttagning startar:', activity.id, activity.title, scope);
    setIsDeleting(true);

    const result = await deleteActivityFromFirestore(activity.id, {
      scope,
      seriesId: belongsToSeries ? activity.seriesId : null,
    });

    setIsDeleting(false);

    if (!result.ok) {
      console.error('[SeniorHub] Borttagning misslyckades:', activity.id, result.errorMessage);
      showErrorAlert('Fel', result.errorMessage);
      return;
    }

    console.log('[SeniorHub] Borttagning lyckades:', activity.id, scope);
    onDeleted(activity.id);
  };

  const handleDeletePress = () => {
    console.log('[SeniorHub] Ta bort-knapp tryckt:', activity.id, activity.title);

    if (belongsToSeries) {
      confirmSeriesDestructiveAction(
        'Ta bort återkommande aktivitet',
        'Vill du ta bort endast detta tillfälle eller hela serien?',
        (choice) => void performDelete(choice),
      );
      return;
    }

    confirmDestructiveAction(
      'Ta bort aktivitet',
      'Är du säker på att du vill ta bort aktiviteten?',
      'Ta bort',
      () => void performDelete('occurrence'),
    );
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.background }]}>
            <ThemedText type="smallBold" style={{ color: categoryVisual.foreground }}>
              {activity.category}
            </ThemedText>
          </View>
          {belongsToSeries && activity.recurrence ? (
            <View style={[styles.seriesBadge, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="smallBold" themeColor="primary">
                {RECURRENCE_FREQUENCY_LABELS[activity.recurrence.frequency]}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText type="cardTitle" style={styles.title}>
          {activity.title}
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {formatDateDisplay(activity.date)} · {formatTimeDisplay(activity.time)}
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {getActivityDisplayLocation(activity)}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Redigera ${activity.title}`}
          onPress={() => router.push(`/admin/edit-activity/${activity.id}` as Href)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.editButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
            Redigera
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ta bort ${activity.title}`}
          disabled={isDeleting}
          onPress={handleDeletePress}
          style={({ pressed }) => [
            styles.actionButton,
            styles.deleteButton,
            { backgroundColor: theme.favorite },
            (pressed || isDeleting) && styles.pressed,
            isDeleting && styles.disabled,
          ]}>
          <ThemedText type="bodyLarge" style={styles.deleteButtonText}>
            Ta bort
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.secondaryActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Deltagare för ${activity.title}`}
          onPress={() => router.push(`/admin/participants/${activity.id}` as Href)}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primary, backgroundColor: theme.background },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
            👥 Deltagare
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Meddela deltagare för ${activity.title}`}
          onPress={() => setIsNotifyModalVisible(true)}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primary, backgroundColor: theme.background },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
            Meddela deltagare
          </ThemedText>
        </Pressable>
      </View>

      <NotifyParticipantsModal
        visible={isNotifyModalVisible}
        activityId={activity.id}
        activityTitle={activity.title}
        onClose={() => setIsNotifyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  content: {
    gap: Spacing.two,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  seriesBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  title: {
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  editButton: {
    borderWidth: 2,
  },
  deleteButton: {},
  secondaryActions: {
    gap: Spacing.three,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  actionButtonText: {
    fontWeight: '700',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.7,
  },
});
