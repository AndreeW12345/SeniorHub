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
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

const theme = Colors.light;

const TAB_ICONS = {
  aktiviteter: { ios: 'calendar', android: 'event', web: 'event' },
  karta: { ios: 'map.fill', android: 'map', web: 'map' },
  favoriter: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  information: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  admin: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export default function AppTabs() {
  const { isAuthenticated } = useAuth();

  return (
    <Tabs style={styles.tabsRoot}>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="aktiviteter" href={'/' as Href} asChild>
            <TabButton icon={TAB_ICONS.aktiviteter}>Aktiviteter</TabButton>
          </TabTrigger>
          <TabTrigger name="karta" href="/karta" asChild>
            <TabButton icon={TAB_ICONS.karta}>Karta</TabButton>
          </TabTrigger>
          <TabTrigger name="favoriter" href="/favoriter" asChild>
            <TabButton icon={TAB_ICONS.favoriter}>Favoriter</TabButton>
          </TabTrigger>
          <TabTrigger name="information" href="/information" asChild>
            <TabButton icon={TAB_ICONS.information}>Information</TabButton>
          </TabTrigger>
          {isAuthenticated ? (
            <TabTrigger name="admin" href="/admin" asChild>
              <TabButton icon={TAB_ICONS.admin}>Admin</TabButton>
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
  ...props
}: TabTriggerSlotProps & { icon: SymbolViewProps['name'] }) {
  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <SymbolView
          tintColor={isFocused ? theme.primary : theme.textSecondary}
          name={icon}
          size={20}
        />
        <ThemedText
          type="smallBold"
          themeColor={isFocused ? 'primary' : 'textSecondary'}
          style={styles.tabLabel}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        {props.children}
      </ThemedView>
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
  tabPressable: {
    flex: 1,
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
  tabLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
});
