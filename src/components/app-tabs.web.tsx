import { Children, type ReactNode } from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import type { Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View, type TextStyle } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/contexts/notifications-context';
import { useResponsive } from '@/hooks/use-responsive';

const theme = Colors.light;

const TAB_ICONS = {
  index: { ios: 'calendar', android: 'event', web: 'event' },
  karta: { ios: 'map.fill', android: 'map', web: 'map' },
  favoriter: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  'mina-bokningar': {
    ios: 'ticket.fill',
    android: 'confirmation_number',
    web: 'confirmation_number',
  },
  information: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  notiser: {
    ios: 'bell.fill',
    android: 'notifications',
    web: 'notifications',
  },
  profil: { ios: 'person.fill', android: 'person', web: 'person' },
  admin: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} as const satisfies Record<string, SymbolViewProps['name']>;

const COMPACT_TAB_COLUMNS = 4;

const TAB_LABEL_COMPACT_WEB: TextStyle =
  Platform.OS === 'web'
    ? ({
        overflowWrap: 'normal',
        wordBreak: 'normal',
        whiteSpace: 'nowrap',
        hyphens: 'none',
      } as TextStyle)
    : {};

const TAB_LABEL_COMPACT_MULTI_LINE_WEB: TextStyle =
  Platform.OS === 'web'
    ? ({
        whiteSpace: 'pre-line',
        overflowWrap: 'normal',
        wordBreak: 'normal',
        hyphens: 'none',
      } as TextStyle)
    : {};

function formatUnreadBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export default function AppTabs() {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const { isCompact } = useResponsive();
  const useCompactTabBar = Platform.OS === 'web' && isCompact;

  return (
    <Tabs style={styles.tabsRoot}>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList compact={useCompactTabBar}>
          <TabTrigger name="index" href={'/' as Href} asChild>
            <TabButton icon={TAB_ICONS.index} compact={useCompactTabBar}>
              Aktiviteter
            </TabButton>
          </TabTrigger>
          <TabTrigger name="karta" href="/karta" asChild>
            <TabButton icon={TAB_ICONS.karta} compact={useCompactTabBar}>
              Karta
            </TabButton>
          </TabTrigger>
          <TabTrigger name="favoriter" href="/favoriter" asChild>
            <TabButton icon={TAB_ICONS.favoriter} compact={useCompactTabBar}>
              Favoriter
            </TabButton>
          </TabTrigger>
          <TabTrigger name="mina-bokningar" href="/mina-bokningar" asChild>
            <TabButton icon={TAB_ICONS['mina-bokningar']} compact={useCompactTabBar}>
              Mina bokningar
            </TabButton>
          </TabTrigger>
          <TabTrigger name="information" href="/information" asChild>
            <TabButton icon={TAB_ICONS.information} compact={useCompactTabBar}>
              Information
            </TabButton>
          </TabTrigger>
          <TabTrigger name="notiser" href="/notiser" asChild>
            <TabButton icon={TAB_ICONS.notiser} badgeCount={unreadCount} compact={useCompactTabBar}>
              Notiser
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profil" href="/profil" asChild>
            <TabButton icon={TAB_ICONS.profil} compact={useCompactTabBar}>
              Profil
            </TabButton>
          </TabTrigger>
          {isAuthenticated ? (
            <TabTrigger name="admin" href="/admin" asChild>
              <TabButton icon={TAB_ICONS.admin} compact={useCompactTabBar}>
                Admin
              </TabButton>
            </TabTrigger>
          ) : null}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  badgeCount = 0,
  compact = false,
  ...props
}: TabTriggerSlotProps & {
  icon: SymbolViewProps['name'];
  badgeCount?: number;
  compact?: boolean;
}) {
  const label = typeof children === 'string' ? children : String(children);
  const isMultiLineCompactLabel = compact && label === 'Mina bokningar';
  const displayLabel = isMultiLineCompactLabel ? 'Mina\nbokningar' : label;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.tabPressable,
        compact && styles.tabPressableCompact,
        pressed && styles.pressed,
      ]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, compact && styles.tabButtonViewCompact]}>
        <View style={styles.iconWrap}>
          <SymbolView
            tintColor={isFocused ? theme.primary : theme.textSecondary}
            name={icon}
            size={20}
          />
          {badgeCount > 0 ? (
            <View
              style={[styles.badge, { backgroundColor: theme.favorite }]}
              accessibilityLabel={`${badgeCount} olästa notiser`}>
              <ThemedText type="smallBold" style={styles.badgeText}>
                {formatUnreadBadge(badgeCount)}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText
          type="smallBold"
          themeColor={isFocused ? 'primary' : 'textSecondary'}
          style={[
            styles.tabLabel,
            compact && styles.tabLabelCompact,
            compact && !isMultiLineCompactLabel && TAB_LABEL_COMPACT_WEB,
            isMultiLineCompactLabel && TAB_LABEL_COMPACT_MULTI_LINE_WEB,
          ]}
          numberOfLines={compact ? (isMultiLineCompactLabel ? 2 : 1) : 2}>
          {displayLabel}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CompactTabRow({ items }: { items: ReactNode[] }) {
  return (
    <View style={styles.compactTabRow}>
      {Array.from({ length: COMPACT_TAB_COLUMNS }, (_, index) => (
        <View key={`compact-tab-cell-${index}`} style={styles.compactTabCell}>
          {items[index] ?? null}
        </View>
      ))}
    </View>
  );
}

function CustomTabList({ compact, children, ...props }: TabListProps & { compact?: boolean }) {
  const tabItems = Children.toArray(children);

  const inner = compact ? (
    <ThemedView type="backgroundElement" style={[styles.innerContainer, styles.innerContainerCompact]}>
      <CompactTabRow items={tabItems.slice(0, COMPACT_TAB_COLUMNS)} />
      <CompactTabRow items={tabItems.slice(COMPACT_TAB_COLUMNS)} />
    </ThemedView>
  ) : (
    <ThemedView type="backgroundElement" style={styles.innerContainer}>
      {children}
    </ThemedView>
  );

  return (
    <View {...props} style={[styles.tabListContainer, compact && styles.tabListContainerCompact]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    height: '100%',
  },
  tabSlot: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minHeight: 0,
    width: '100%',
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    bottom: 0,
  },
  tabListContainerCompact: {
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexGrow: 1,
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
  },
  innerContainerCompact: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    flexDirection: 'column',
    flexGrow: 0,
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  compactTabRow: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    alignItems: 'stretch',
  },
  compactTabCell: {
    flex: 1,
    minWidth: 0,
    maxWidth: '25%',
    alignItems: 'center',
  },
  tabPressable: {
    flex: 1,
    minWidth: 0,
  },
  tabPressableCompact: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  tabButtonViewCompact: {
    width: '100%',
    minWidth: 0,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -14,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  tabLabelCompact: {
    width: '100%',
    minWidth: 0,
    fontSize: 13,
    lineHeight: 17,
    textAlign: 'center',
  },
});
