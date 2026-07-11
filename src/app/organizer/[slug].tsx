import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getActivitiesByOrganizerSlug, resolveOrganizerName } from '@/constants/organizers';
import { CardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useOrganizers } from '@/contexts/organizers-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';
import { getEmailUrl, getPhoneUrl, normalizeWebsiteUrl } from '@/utils/organizer-links';

type ContactRowProps = {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
  onPress: () => void;
  accessibilityLabel: string;
};

function ContactRow({ icon, label, value, onPress, accessibilityLabel }: ContactRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.contactRow, pressed && styles.contactRowPressed]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
        <SymbolView tintColor={theme.primary} name={icon} size={22} weight="medium" />
      </View>
      <View style={styles.contactText}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="linkPrimary">{value}</ThemedText>
      </View>
    </Pressable>
  );
}

export default function OrganizerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const goBack = useSafeBack();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentWidth } = useResponsive();
  const { activities, isLoading: isLoadingActivities } = useActivities();
  const { getOrganizerBySlug, organizers, isLoading: isLoadingOrganizers } = useOrganizers();

  const organizerSlug = typeof slug === 'string' ? slug : '';
  const profile = organizerSlug ? getOrganizerBySlug(organizerSlug) : undefined;
  const organizerName =
    profile?.name ??
    (organizerSlug ? resolveOrganizerName(organizers, activities, organizerSlug) : null);
  const organizerActivities = organizerSlug
    ? getActivitiesByOrganizerSlug(activities, organizerSlug)
    : [];
  const isLoading = isLoadingActivities || isLoadingOrganizers;

  if (!organizerSlug || (!isLoading && !organizerName)) {
    return (
      <ThemedView style={[styles.notFound, { paddingTop: insets.top + Spacing.four }]}>
        <ThemedText type="subtitle">Arrangören hittades inte</ThemedText>
        <Pressable onPress={goBack} style={styles.backLink}>
          <ThemedText type="linkPrimary">Gå tillbaka</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const openPhone = (phone: string) => {
    void Linking.openURL(getPhoneUrl(phone));
  };

  const openEmail = (email: string) => {
    void Linking.openURL(getEmailUrl(email));
  };

  const openWebsite = (website: string) => {
    void Linking.openURL(normalizeWebsiteUrl(website));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.six,
            maxWidth: contentWidth,
          },
        ]}>
        <View style={[styles.headerSection, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel="Gå tillbaka"
            style={[styles.backButton, { top: insets.top + Spacing.three }]}>
            <SymbolView
              tintColor={theme.primary}
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={22}
              weight="semibold"
            />
            <ThemedText type="bodyLarge" themeColor="primary">
              Tillbaka
            </ThemedText>
          </Pressable>

          <View style={[styles.headerCard, CardShadow, { backgroundColor: theme.card }]}>
            <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
              <SymbolView
                tintColor={theme.primary}
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                size={40}
                weight="medium"
              />
            </View>
            <ThemedText type="title" style={styles.organizerName}>
              {organizerName}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {profile?.description ? (
                <View style={[styles.descriptionCard, CardShadow, { backgroundColor: theme.card }]}>
                  <ThemedText type="sectionTitle">Om arrangören</ThemedText>
                  <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.description}>
                    {profile.description}
                  </ThemedText>
                </View>
              ) : null}

              {profile?.phone || profile?.email || profile?.website ? (
                <View style={[styles.contactCard, CardShadow, { backgroundColor: theme.card }]}>
                  <ThemedText type="sectionTitle">Kontakt</ThemedText>
                  <View style={styles.contactRows}>
                    {profile.phone ? (
                      <ContactRow
                        icon={{ ios: 'phone.fill', android: 'phone', web: 'phone' }}
                        label="Telefon"
                        value={profile.phone}
                        onPress={() => openPhone(profile.phone!)}
                        accessibilityLabel={`Ring ${profile.phone}`}
                      />
                    ) : null}
                    {profile.email ? (
                      <ContactRow
                        icon={{ ios: 'envelope.fill', android: 'email', web: 'email' }}
                        label="E-post"
                        value={profile.email}
                        onPress={() => openEmail(profile.email!)}
                        accessibilityLabel={`Skicka e-post till ${profile.email}`}
                      />
                    ) : null}
                    {profile.website ? (
                      <ContactRow
                        icon={{ ios: 'globe', android: 'language', web: 'language' }}
                        label="Webbplats"
                        value={profile.website.replace(/^https?:\/\//i, '')}
                        onPress={() => openWebsite(profile.website!)}
                        accessibilityLabel={`Öppna webbplats ${profile.website}`}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}

              <View style={styles.activitiesSection}>
                <ThemedText type="sectionTitle">Aktiviteter</ThemedText>
                {organizerActivities.length > 0 ? (
                  <ActivityList>
                    {organizerActivities.map((activity) => (
                      <ActivityListItem key={activity.id}>
                        <ActivityCard activity={activity} />
                      </ActivityListItem>
                    ))}
                  </ActivityList>
                ) : (
                  <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
                    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                      Inga aktiviteter från den här arrangören just nu.
                    </ThemedText>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    position: 'relative',
    marginBottom: Spacing.four,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.four,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  headerCard: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.seven,
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.four,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerName: {
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  body: {
    gap: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  descriptionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.three,
  },
  description: {
    lineHeight: 32,
  },
  contactCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  contactRows: {
    gap: Spacing.four,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  contactRowPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    gap: 4,
  },
  activitiesSection: {
    gap: Spacing.four,
  },
  emptyState: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  backLink: {
    padding: Spacing.three,
  },
});
