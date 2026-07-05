import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useResponsive } from '@/hooks/use-responsive';

type ActivityListProps = {
  children: ReactNode;
};

/** Responsive wrapper that switches to two columns on wide screens. */
export function ActivityList({ children }: ActivityListProps) {
  const { columns, cardGap } = useResponsive();

  return (
    <View
      style={[
        styles.list,
        columns === 2 && styles.listTwoColumn,
        { gap: cardGap },
      ]}>
      {children}
    </View>
  );
}

type ActivityListItemProps = {
  children: ReactNode;
};

export function ActivityListItem({ children }: ActivityListItemProps) {
  const { columns } = useResponsive();

  return (
    <View style={[styles.item, columns === 2 && styles.itemTwoColumn]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  listTwoColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '100%',
  },
  itemTwoColumn: {
    width: '48.5%',
  },
});
