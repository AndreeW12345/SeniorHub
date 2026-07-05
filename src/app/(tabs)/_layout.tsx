import { StyleSheet, View } from 'react-native';

import AppTabs from '@/components/app-tabs';

export default function TabsLayout() {
  return (
    <View style={styles.layout}>
      <AppTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    minHeight: 0,
  },
});
