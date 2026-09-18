import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

const theme = Colors.light;

export default function MerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="information" options={{ title: 'Information' }} />
      <Stack.Screen name="notiser" options={{ title: 'Notiser' }} />
      <Stack.Screen name="profil" options={{ title: 'Profil' }} />
      <Stack.Screen name="admin" options={{ title: 'Admin' }} />
    </Stack>
  );
}
