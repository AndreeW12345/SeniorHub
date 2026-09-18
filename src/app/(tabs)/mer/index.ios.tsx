import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { ProfileSettingsRow } from '@/components/profile-settings-row';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useTheme } from '@/hooks/use-theme';

const theme = Colors.light;

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

type MerMenuRowProps = {
  title: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  badgeCount?: number;
};

function MerMenuRow({ title, icon, onPress, badgeCount = 0 }: MerMenuRowProps) {
  const rowTheme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        badgeCount > 0 ? `${title}, ${badgeCount} olästa notiser` : title
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: rowTheme.card, borderColor: rowTheme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: rowTheme.primaryLight }]}>
        <SymbolView tintColor={rowTheme.primary} name={icon} size={26} />
        {badgeCount > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.favorite }]}>
            <ThemedText type="smallBold" style={styles.badgeText}>
              {formatUnreadBadge(badgeCount)}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="bodyLarge" style={styles.rowTitle}>
        {title}
      </ThemedText>
      <SymbolView
        tintColor={rowTheme.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={22}
      />
    </Pressable>
  );
}

/** iOS Mer hub — same destinations as former system More overflow. */
export default function MerHubScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <ScreenLayout title="Mer">
      <View style={styles.list}>
        <ProfileSettingsRow
          title="Information"
          icon={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
          onPress={() => router.push('/mer/information' as Href)}
        />
        <MerMenuRow
          title="Notiser"
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          badgeCount={unreadCount}
          onPress={() => router.push('/mer/notiser' as Href)}
        />
        <ProfileSettingsRow
          title="Profil"
          icon={{ ios: 'person.fill', android: 'person', web: 'person' }}
          onPress={() => router.push('/mer/profil' as Href)}
        />
        {isAuthenticated ? (
          <ProfileSettingsRow
            title="Admin"
            icon={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
            onPress={() => router.push('/mer/admin' as Href)}
          />
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  row: {
    minHeight: 72,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    flex: 1,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
