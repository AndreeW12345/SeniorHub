import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/activity-card';
import { ActivityList, ActivityListItem } from '@/components/activity-list';
import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  getActivitiesForOrganization,
  type Organization,
} from '@/constants/organizations';
import {
  getActivitiesByOrganizerSlug,
  resolveOrganizerName,
  type Organizer,
} from '@/constants/organizers';
import { CardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useActivities } from '@/contexts/activities-context';
import { useOrganizations } from '@/contexts/organizations-context';
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

type ProfileView = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  membershipUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
};

function toProfileView(
  organization: Organization | undefined,
  organizer: Organizer | undefined,
  fallbackName: string | null,
): ProfileView | null {
  if (organization) {
    return organization;
  }

  if (organizer) {
    return {
      name: organizer.name,
      description: organizer.description,
      website: organizer.website,
      email: organizer.email,
      phone: organizer.phone,
    };
  }

  if (fallbackName) {
    return { name: fallbackName };
  }

  return null;
}

export default function OrganizerScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const goBack = useSafeBack();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { horizontalPadding, contentWidth } = useResponsive();
  const { activities, isLoading: isLoadingActivities } = useActivities();
  const { getOrganizationBySlug, isLoading: isLoadingOrganizations } = useOrganizations();
  const { getOrganizerBySlug, organizers, isLoading: isLoadingOrganizers } = useOrganizers();

  const organizerSlug = typeof slug === 'string' ? slug : '';
  const organization = organizerSlug ? getOrganizationBySlug(organizerSlug) : undefined;
  const legacyOrganizer = organizerSlug ? getOrganizerBySlug(organizerSlug) : undefined;
  const fallbackName = organizerSlug
    ? resolveOrganizerName(organizers, activities, organizerSlug)
    : null;
  const profile = toProfileView(organization, legacyOrganizer, fallbackName);
  const listedActivities = organization
    ? getActivitiesForOrganization(activities, organization)
    : organizerSlug
      ? getActivitiesByOrganizerSlug(activities, organizerSlug)
      : [];
  const isLoading = isLoadingActivities || isLoadingOrganizations || isLoadingOrganizers;

  if (!organizerSlug || (!isLoading && !profile)) {
    return (
      <ThemedView style={[styles.notFound, { paddingTop: insets.top + Spacing.four }]}>
        <ThemedText type="subtitle">Organisationen hittades inte</ThemedText>
        <Pressable onPress={goBack} style={styles.backLink}>
          <ThemedText type="linkPrimary">Gå tillbaka</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const displayProfile = profile ?? { name: fallbackName ?? 'Organisation' };

  const openPhone = (phone: string) => {
    void Linking.openURL(getPhoneUrl(phone));
  };

  const openEmail = (email: string) => {
    void Linking.openURL(getEmailUrl(email));
  };

  const openWebsite = (website: string) => {
    void Linking.openURL(normalizeWebsiteUrl(website));
  };

  const openMembership = (membershipUrl: string) => {
    void Linking.openURL(normalizeWebsiteUrl(membershipUrl));
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
          <BackButton style={[styles.backButton, { top: insets.top + Spacing.three }]} />

          <View style={[styles.headerCard, CardShadow, { backgroundColor: theme.card }]}>
            {displayProfile.logoUrl ? (
              <Image
                source={{ uri: displayProfile.logoUrl }}
                style={styles.logoImage}
                accessibilityLabel={`Logotyp för ${displayProfile.name}`}
              />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
                <SymbolView
                  tintColor={theme.primary}
                  name={{ ios: 'building.2.fill', android: 'apartment', web: 'apartment' }}
                  size={40}
                  weight="medium"
                />
              </View>
            )}
            <ThemedText type="title" style={styles.organizerName}>
              {displayProfile.name}
            </ThemedText>
            {displayProfile.description ? (
              <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.headerDescription}>
                {displayProfile.description}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <View style={[styles.body, { paddingHorizontal: horizontalPadding }]}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : (
            <>
              {displayProfile.website ||
              displayProfile.phone ||
              displayProfile.email ||
              displayProfile.city ? (
                <View style={[styles.contactCard, CardShadow, { backgroundColor: theme.card }]}>
                  <ThemedText type="sectionTitle">Kontakt</ThemedText>
                  <View style={styles.contactRows}>
                    {displayProfile.city ? (
                      <View style={styles.cityRow}>
                        <ThemedText type="smallBold" themeColor="textSecondary">
                          Ort
                        </ThemedText>
                        <ThemedText type="bodyLarge">{displayProfile.city}</ThemedText>
                      </View>
                    ) : null}
                    {displayProfile.website ? (
                      <ContactRow
                        icon={{ ios: 'globe', android: 'language', web: 'language' }}
                        label="Hemsida"
                        value={displayProfile.website.replace(/^https?:\/\//i, '')}
                        onPress={() => openWebsite(displayProfile.website!)}
                        accessibilityLabel={`Öppna hemsida ${displayProfile.website}`}
                      />
                    ) : null}
                    {displayProfile.phone ? (
                      <ContactRow
                        icon={{ ios: 'phone.fill', android: 'phone', web: 'phone' }}
                        label="Telefon"
                        value={displayProfile.phone}
                        onPress={() => openPhone(displayProfile.phone!)}
                        accessibilityLabel={`Ring ${displayProfile.phone}`}
                      />
                    ) : null}
                    {displayProfile.email ? (
                      <ContactRow
                        icon={{ ios: 'envelope.fill', android: 'email', web: 'email' }}
                        label="E-post"
                        value={displayProfile.email}
                        onPress={() => openEmail(displayProfile.email!)}
                        accessibilityLabel={`Skicka e-post till ${displayProfile.email}`}
                      />
                    ) : null}
                  </View>
                </View>
              ) : null}

              {displayProfile.membershipUrl ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Bli medlem i ${displayProfile.name}`}
                  onPress={() => openMembership(displayProfile.membershipUrl!)}
                  style={({ pressed }) => [
                    styles.membershipButton,
                    CardShadow,
                    { backgroundColor: theme.primary },
                    pressed && styles.membershipButtonPressed,
                  ]}>
                  <ThemedText type="bodyLarge" style={styles.membershipButtonText}>
                    Bli medlem
                  </ThemedText>
                </Pressable>
              ) : null}

              <View style={styles.activitiesSection}>
                <ThemedText type="sectionTitle">Alla aktiviteter</ThemedText>
                {listedActivities.length > 0 ? (
                  <ActivityList>
                    {listedActivities.map((activity) => (
                      <ActivityListItem key={activity.id}>
                        <ActivityCard activity={activity} />
                      </ActivityListItem>
                    ))}
                  </ActivityList>
                ) : (
                  <View style={[styles.emptyState, CardShadow, { backgroundColor: theme.card }]}>
                    <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.emptyText}>
                      Inga aktiviteter från den här organisationen just nu.
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
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: Radius.xl,
  },
  organizerName: {
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  headerDescription: {
    textAlign: 'center',
    lineHeight: 32,
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
  contactCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  contactRows: {
    gap: Spacing.four,
  },
  cityRow: {
    gap: Spacing.one,
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
  membershipButton: {
    minHeight: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  membershipButtonPressed: {
    opacity: 0.9,
  },
  membershipButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
