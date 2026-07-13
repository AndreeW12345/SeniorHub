import { Stack, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { ActivitiesProvider } from '@/contexts/activities-context';
import { AuthProvider } from '@/contexts/auth-context';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { MembershipsProvider } from '@/contexts/memberships-context';
import { OrganizersProvider } from '@/contexts/organizers-context';
import { RegistrationsProvider } from '@/contexts/registrations-context';

const SeniorHubTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ActivitiesProvider>
        <OrganizersProvider>
          <FavoritesProvider>
            <MembershipsProvider>
              <RegistrationsProvider>
                <ThemeProvider value={SeniorHubTheme}>
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { flex: 1 },
                    }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="activity/[id]"
                      options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                      }}
                    />
                    <Stack.Screen
                      name="organizer/[slug]"
                      options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                      }}
                    />
                    <Stack.Screen
                      name="login"
                      options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                      }}
                    />
                    <Stack.Screen
                      name="admin/add-activity"
                      options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                      }}
                    />
                    <Stack.Screen
                      name="admin/edit-activity/[id]"
                      options={{
                        presentation: 'card',
                        animation: 'slide_from_right',
                      }}
                    />
                  </Stack>
                </ThemeProvider>
              </RegistrationsProvider>
            </MembershipsProvider>
          </FavoritesProvider>
        </OrganizersProvider>
      </ActivitiesProvider>
    </AuthProvider>
  );
}
