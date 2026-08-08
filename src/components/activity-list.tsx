import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';

type ActivityListLayout = {
  columns: 1 | 2;
  gap: number;
};

const ActivityListContext = createContext<ActivityListLayout>({
  columns: 1,
  gap: Spacing.three,
});

type ActivityListProps = {
  children: ReactNode;
  /** Override responsive column count (e.g. 2 on tablet + desktop). */
  columns?: 1 | 2;
  /** Gap between cards in px (default 16). */
  gap?: number;
};

/** Responsive wrapper that switches to two columns on wide screens. */
export function ActivityList({ children, columns: columnsProp, gap: gapProp }: ActivityListProps) {
  const { columns: responsiveColumns, cardGap } = useResponsive();
  const columns = columnsProp ?? responsiveColumns;
  const gap = gapProp ?? cardGap;

  return (
    <ActivityListContext.Provider value={{ columns, gap }}>
      <View
        style={[
          styles.list,
          columns === 2 && styles.listTwoColumn,
          { gap },
        ]}>
        {children}
      </View>
    </ActivityListContext.Provider>
  );
}

type ActivityListItemProps = {
  children: ReactNode;
};

export function ActivityListItem({ children }: ActivityListItemProps) {
  const { columns } = useContext(ActivityListContext);

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
  },
  item: {
    width: '100%',
  },
  itemTwoColumn: {
    width: '48%',
  },
});
