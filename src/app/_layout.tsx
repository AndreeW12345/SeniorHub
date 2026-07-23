import { Stack, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';
import { ActivitiesBrowseProvider } from '@/contexts/activities-browse-context';
import { ActivitiesProvider } from '@/contexts/activities-context';
import { AuthProvider } from '@/contexts/auth-context';
import { FavoritesProvider } from '@/contexts/favorites-context';
import { MembershipsProvider } from '@/contexts/memberships-context';
import { NotificationPreferencesProvider } from '@/contexts/notification-preferences-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { OrganizersProvider } from '@/contexts/organizers-context';
import { RegistrationsProvider } from '@/contexts/registrations-context';
import { ToastProvider } from '@/contexts/toast-context';
import { UserProfileProvider } from '@/contexts/user-profile-context';
import { PushNotificationsBootstrap } from '@/components/push-notifications-bootstrap';
import { WaitlistPromotionNotifier } from '@/components/waitlist-promotion-notifier';

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
        <ActivitiesBrowseProvider>
          <OrganizersProvider>
            <FavoritesProvider>
              <MembershipsProvider>
                <RegistrationsProvider>
                  <NotificationsProvider>
                    <NotificationPreferencesProvider>
                      <UserProfileProvider>
                        <ToastProvider>
                          <ThemeProvider value={SeniorHubTheme}>
                            <StatusBar style="light" />
                            <PushNotificationsBootstrap />
                            <WaitlistPromotionNotifier />
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
                              <Stack.Screen
                                name="profil/edit"
                                options={{
                                  presentation: 'card',
                                  animation: 'slide_from_right',
                                }}
                              />
                              <Stack.Screen
                                name="profil/sekretess"
                                options={{
                                  presentation: 'card',
                                  animation: 'slide_from_right',
                                }}
                              />
                              <Stack.Screen
                                name="profil/hjalp"
                                options={{
                                  presentation: 'card',
                                  animation: 'slide_from_right',
                                }}
                              />
                              <Stack.Screen
                                name="profil/om"
                                options={{
                                  presentation: 'card',
                                  animation: 'slide_from_right',
                                }}
                              />
                            </Stack>
                          </ThemeProvider>
                        </ToastProvider>
                      </UserProfileProvider>
                    </NotificationPreferencesProvider>
                  </NotificationsProvider>
                </RegistrationsProvider>
              </MembershipsProvider>
            </FavoritesProvider>
          </OrganizersProvider>
        </ActivitiesBrowseProvider>
      </ActivitiesProvider>
    </AuthProvider>
  );
}
