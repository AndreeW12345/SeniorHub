import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityCardMetaRow } from '@/components/activity-card-meta-row';
import { ActivitySchedule } from '@/components/activity-schedule';
import { ThemedText } from '@/components/themed-text';
import { getActivityPlaceName } from '@/constants/activities';
import { getCategoryEmoji, getCategoryVisual } from '@/constants/category-visuals';
import { RECURRENCE_FREQUENCY_LABELS } from '@/constants/recurrence';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { deleteActivityFromFirestore } from '@/services/activities';
import { useTheme } from '@/hooks/use-theme';
import {
  formatAdminShortDate,
  type AdminActivitySeriesGroup,
} from '@/utils/admin-activity-list';
import { confirmDestructiveAction, showErrorAlert } from '@/utils/confirm-alert';

type AdminActivitySeriesRowProps = {
  group: AdminActivitySeriesGroup;
  onSeriesChanged: () => void;
};

export function AdminActivitySeriesRow({ group, onSeriesChanged }: AdminActivitySeriesRowProps) {
  const router = useRouter();
  const theme = useTheme();
  const categoryVisual = getCategoryVisual(group.category);
  const categoryEmoji = getCategoryEmoji(group.category);
  const placeName = getActivityPlaceName(group.nextOccurrence);
  const [isDeleting, setIsDeleting] = useState(false);

  const occurrenceLabel =
    group.occurrences.length === 1
      ? '1 tillfälle'
      : `${group.occurrences.length} tillfällen`;
  const dateRangeLabel = `${formatAdminShortDate(group.firstDate)} – ${formatAdminShortDate(group.lastDate)}`;

  const handleDeleteSeries = () => {
    confirmDestructiveAction(
      'Ta bort hela serien',
      `Vill du ta bort alla ${group.occurrences.length} tillfällen i serien "${group.title}"?`,
      'Ta bort serien',
      () => void performDeleteSeries(),
    );
  };

  const performDeleteSeries = async () => {
    setIsDeleting(true);

    const result = await deleteActivityFromFirestore(group.nextOccurrence.id, {
      scope: 'series',
      seriesId: group.seriesId,
    });

    setIsDeleting(false);

    if (!result.ok) {
      showErrorAlert('Fel', result.errorMessage);
      return;
    }

    onSeriesChanged();
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.tint }]}>
            <ThemedText style={styles.categoryEmoji}>{categoryEmoji}</ThemedText>
            <ThemedText
              type="smallBold"
              style={[styles.categoryLabel, { color: categoryVisual.background }]}>
              {group.category}
            </ThemedText>
          </View>
          <View style={[styles.seriesBadge, { backgroundColor: theme.primaryLight }]}>
            <ThemedText type="smallBold" themeColor="primary">
              {RECURRENCE_FREQUENCY_LABELS[group.recurrence.frequency]}
            </ThemedText>
          </View>
          <View style={[styles.countBadge, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {occurrenceLabel}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="cardTitle" style={styles.title}>
          {group.title}
        </ThemedText>

        <View style={styles.metaGroup}>
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Nästa tillfälle
          </ThemedText>
          <ActivitySchedule date={group.nextOccurrence.date} time={group.nextOccurrence.time} />
          <ActivityCardMetaRow icon="📍" value={placeName} accessibilityPrefix="Plats" />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            {dateRangeLabel}
          </ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Visa tillfällen för ${group.title}`}
          onPress={() => router.push(`/admin/series/${group.seriesId}` as Href)}
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryOutlineButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
            Visa tillfällen
          </ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Redigera nästa tillfälle för ${group.title}`}
          onPress={() =>
            router.push(`/admin/edit-activity/${group.nextOccurrence.id}` as Href)
          }
          style={({ pressed }) => [
            styles.actionButton,
            styles.primaryOutlineButton,
            { borderColor: theme.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="bodyLarge" themeColor="primary" style={styles.actionButtonText}>
            Redigera
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ta bort hela serien ${group.title}`}
        disabled={isDeleting}
        onPress={handleDeleteSeries}
        style={({ pressed }) => [
          styles.deleteButton,
          { backgroundColor: theme.favorite },
          (pressed || isDeleting) && styles.pressed,
          isDeleting && styles.disabled,
        ]}>
        <ThemedText type="bodyLarge" style={styles.deleteButtonText}>
          Ta bort hela serien
        </ThemedText>
      </Pressable>
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
    gap: Spacing.four,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three + 2,
    paddingVertical: Spacing.two,
  },
  categoryEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  categoryLabel: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  seriesBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  countBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  metaGroup: {
    gap: Spacing.three + 4,
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
  primaryOutlineButton: {
    borderWidth: 2,
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
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
