import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { type Activity } from '@/constants/activities';
import { getCategoryVisual } from '@/constants/category-visuals';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { deleteActivityFromFirestore } from '@/services/activities';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructiveAction, showErrorAlert } from '@/utils/confirm-alert';

type AdminActivityListItemProps = {
  activity: Activity;
  onDeleted: (activityId: string) => void;
};

export function AdminActivityListItem({ activity, onDeleted }: AdminActivityListItemProps) {
  const router = useRouter();
  const theme = useTheme();
  const categoryVisual = getCategoryVisual(activity.category);
  const [isDeleting, setIsDeleting] = useState(false);

  const performDelete = async () => {
    console.log('[SeniorHub] Bekräftad borttagning startar:', activity.id, activity.title);
    setIsDeleting(true);

    const result = await deleteActivityFromFirestore(activity.id);

    setIsDeleting(false);

    if (!result.ok) {
      console.error('[SeniorHub] Borttagning misslyckades:', activity.id, result.errorMessage);
      showErrorAlert('Fel', result.errorMessage);
      return;
    }

    console.log('[SeniorHub] Borttagning lyckades:', activity.id);
    onDeleted(activity.id);
  };

  const handleDeletePress = () => {
    console.log('[SeniorHub] Ta bort-knapp tryckt:', activity.id, activity.title);

    confirmDestructiveAction(
      'Ta bort aktivitet',
      'Är du säker på att du vill ta bort aktiviteten?',
      'Ta bort',
      () => void performDelete(),
    );
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryVisual.background }]}>
          <ThemedText type="smallBold" style={{ color: categoryVisual.foreground }}>
            {activity.category}
          </ThemedText>
        </View>

        <ThemedText type="cardTitle" style={styles.title}>
          {activity.title}
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {activity.date} · {activity.time}
        </ThemedText>

        <ThemedText type="bodyLarge" themeColor="textSecondary">
          {activity.location}
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
  categoryBadge: {
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
