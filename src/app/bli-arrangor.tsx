import type { ReactNode } from 'react';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FormCheckbox } from '@/components/form-checkbox';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

const BENEFIT_CARDS = [
  { icon: '📅', text: 'Skapa aktiviteter på några minuter' },
  { icon: '👥', text: 'Hantera bokningar och deltagare enkelt' },
  { icon: '📍', text: 'Nå seniorer i ditt närområde' },
  { icon: '📢', text: 'Kommunicera med deltagare' },
  { icon: '❤️', text: 'Bidra till ökad gemenskap och minskad ensamhet' },
  { icon: '🏛', text: 'Perfekt för kommuner, föreningar, kyrkor, caféer och företag' },
] as const;

const ELIGIBLE_ORGANIZERS = [
  'Kommuner',
  'Föreningar',
  'SPF och PRO',
  'Kyrkor',
  'Caféer',
  'Företag',
  'Ideella organisationer',
  'Aktivitetssamordnare',
] as const;

type FormValues = {
  organization: string;
  contactPerson: string;
  email: string;
  phone: string;
  municipality: string;
  website: string;
  activitiesDescription: string;
};

type FormErrors = Partial<Record<keyof FormValues | 'consent', string>>;

const INITIAL_VALUES: FormValues = {
  organization: '',
  contactPerson: '',
  email: '',
  phone: '',
  municipality: '',
  website: '',
  activitiesDescription: '',
};

function HeroIllustration() {
  const theme = useTheme();
  const { isDesktop } = useResponsive();

  return (
    <View
      style={[
        styles.heroIllustration,
        SoftShadow,
        { backgroundColor: theme.primaryLight },
        isDesktop && styles.heroIllustrationDesktop,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Illustration som symboliserar gemenskap, aktiviteter och seniorer">
      <View style={styles.heroBadge}>
        <ThemedText style={styles.heroBadgeText}>Gemenskap</ThemedText>
      </View>
      <View style={styles.heroEmojiRow}>
        <ThemedText style={styles.heroEmoji}>👥</ThemedText>
        <ThemedText style={styles.heroEmoji}>🎉</ThemedText>
        <ThemedText style={styles.heroEmoji}>☕</ThemedText>
        <ThemedText style={styles.heroEmoji}>🚶</ThemedText>
      </View>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.heroCaption}>
        Aktiviteter som skapar gemenskap i ditt närområde
      </ThemedText>
    </View>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={[styles.sectionCard, CardShadow, { backgroundColor: theme.card }]}>
      <ThemedText type="sectionTitle">{title}</ThemedText>
      {children}
    </View>
  );
}

function BenefitCard({ icon, text }: { icon: string; text: string }) {
  const theme = useTheme();
  const { isDesktop, isTablet } = useResponsive();

  return (
    <View
      style={[
        styles.benefitCard,
        CardShadow,
        { backgroundColor: theme.backgroundElement },
        (isTablet || isDesktop) && styles.benefitCardRowItem,
      ]}>
      <ThemedText style={styles.benefitIcon} accessibilityLabel={text}>
        {icon}
      </ThemedText>
      <ThemedText type="bodyLarge" style={styles.benefitText}>
        {text}
      </ThemedText>
    </View>
  );
}

function ApplicationConfirmation({ onBackHome }: { onBackHome: () => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.confirmationCard, CardShadow, { backgroundColor: theme.primaryLight }]}>
      <View style={[styles.confirmationIconWrap, { backgroundColor: theme.card }]}>
        <SymbolView
          tintColor={theme.primary}
          name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
          size={56}
        />
      </View>
      <ThemedText type="sectionTitle" themeColor="primary" style={styles.confirmationTitle}>
        Tack för din ansökan!
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.confirmationText}>
        Vi har tagit emot din ansökan.
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.confirmationText}>
        Vi granskar alla ansökningar manuellt och återkommer till dig via e-post inom några
        arbetsdagar.
      </ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tillbaka till aktiviteter"
        onPress={onBackHome}
        style={({ pressed }) => [
          styles.primaryButton,
          { backgroundColor: theme.primary },
          pressed && styles.buttonPressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
          Tillbaka till aktiviteter
        </ThemedText>
      </Pressable>
    </View>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Information and application page for prospective organizers. */
export default function BliArrangorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isDesktop, isTablet } = useResponsive();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const updateField = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(null);
  };

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const organization = values.organization.trim();
    const contactPerson = values.contactPerson.trim();
    const email = values.email.trim();
    const phone = values.phone.trim();
    const municipality = values.municipality.trim();
    const activitiesDescription = values.activitiesDescription.trim();

    if (!organization) {
      nextErrors.organization = 'Ange organisation eller förening.';
    }
    if (!contactPerson) {
      nextErrors.contactPerson = 'Ange kontaktperson.';
    }
    if (!email) {
      nextErrors.email = 'Ange en e-postadress.';
    } else if (!isValidEmail(email)) {
      nextErrors.email = 'Ange en giltig e-postadress.';
    }
    if (!phone) {
      nextErrors.phone = 'Ange telefonnummer.';
    }
    if (!municipality) {
      nextErrors.municipality = 'Ange kommun.';
    }
    if (!activitiesDescription) {
      nextErrors.activitiesDescription = 'Beskriv vilka aktiviteter ni vill arrangera.';
    }
    if (!consentChecked) {
      nextErrors.consent =
        'Du behöver godkänna att SeniorHub kontaktar dig angående din ansökan.';
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setConsentError(nextErrors.consent);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Applications are reviewed manually; no account is created here.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setIsSubmitted(true);
    } catch {
      setSubmitError('Något gick fel. Försök igen om en stund.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <ScreenLayout
        title="Bli arrangör i SeniorHub"
        subtitle="Din ansökan är skickad"
        showBackButton
        omitTabInset>
        <ApplicationConfirmation onBackHome={() => router.replace('/' as Href)} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Bli arrangör i SeniorHub"
      subtitle="Skapa aktiviteter som gör skillnad och hjälp seniorer att hitta gemenskap i ditt närområde."
      showBackButton
      omitTabInset>
      <HeroIllustration />

      <SectionCard title="Varför bli arrangör?">
        <View
          style={[
            styles.benefitGrid,
            (isTablet || isDesktop) && styles.benefitGridRow,
          ]}>
          {BENEFIT_CARDS.map((card) => (
            <BenefitCard key={card.text} icon={card.icon} text={card.text} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Vem kan bli arrangör?">
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          SeniorHub välkomnar bland annat:
        </ThemedText>
        <View style={styles.bulletList}>
          {ELIGIBLE_ORGANIZERS.map((item) => (
            <View key={item} style={styles.bulletRow}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.bulletMarker}>
                •
              </ThemedText>
              <ThemedText type="bodyLarge" style={styles.bulletText}>
                {item}
              </ThemedText>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Ansök om att bli arrangör">
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Fyll i formuläret nedan så kontaktar vi dig när vi har granskat din ansökan.
        </ThemedText>

        <View style={styles.form}>
          <FormField
            label="Organisation/Förening"
            value={values.organization}
            onChangeText={(value) => updateField('organization', value)}
            error={errors.organization}
            placeholder="Till exempel Pensionärsföreningen"
            autoCapitalize="words"
          />
          <FormField
            label="Kontaktperson"
            value={values.contactPerson}
            onChangeText={(value) => updateField('contactPerson', value)}
            error={errors.contactPerson}
            placeholder="För- och efternamn"
            autoCapitalize="words"
          />
          <FormField
            label="E-postadress"
            value={values.email}
            onChangeText={(value) => updateField('email', value)}
            error={errors.email}
            placeholder="kontakt@organisation.se"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
          />
          <FormField
            label="Telefonnummer"
            value={values.phone}
            onChangeText={(value) => updateField('phone', value)}
            error={errors.phone}
            placeholder="070-123 45 67"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
          />
          <FormField
            label="Kommun"
            value={values.municipality}
            onChangeText={(value) => updateField('municipality', value)}
            error={errors.municipality}
            placeholder="Till exempel Uppsala"
            autoCapitalize="words"
          />
          <FormField
            label="Hemsida (valfritt)"
            value={values.website}
            onChangeText={(value) => updateField('website', value)}
            placeholder="https://www.er-organisation.se"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            textContentType="URL"
            autoComplete="url"
          />
          <FormField
            label="Beskriv vilka aktiviteter ni vill arrangera"
            value={values.activitiesDescription}
            onChangeText={(value) => updateField('activitiesDescription', value)}
            error={errors.activitiesDescription}
            placeholder="Berätta kort om era planerade aktiviteter"
            multiline
          />

          <FormCheckbox
            label="Jag godkänner att SeniorHub kontaktar mig angående min ansökan."
            checked={consentChecked}
            onChange={(checked) => {
              setConsentChecked(checked);
              setConsentError(undefined);
              setErrors((current) => ({ ...current, consent: undefined }));
            }}
          />
          {consentError ? (
            <ThemedText type="small" themeColor="favorite">
              {consentError}
            </ThemedText>
          ) : null}

          {submitError ? (
            <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
              {submitError}
            </ThemedText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skicka ansökan"
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary },
              (pressed || isSubmitting) && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Skicka ansökan
              </ThemedText>
            )}
          </Pressable>
        </View>
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroIllustration: {
    borderRadius: Radius.lg,
    padding: Spacing.five,
    gap: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  heroIllustrationDesktop: {
    maxWidth: 420,
    alignSelf: 'flex-end',
  },
  heroBadge: {
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  heroBadgeText: {
    color: '#004E87',
    fontWeight: '700',
    fontSize: 18,
  },
  heroEmojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  heroEmoji: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroCaption: {
    textAlign: 'center',
    maxWidth: 320,
  },
  sectionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.four,
  },
  benefitGrid: {
    gap: Spacing.three,
  },
  benefitGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  benefitCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  benefitCardRowItem: {
    flexBasis: '47%',
    maxWidth: '47%',
  },
  benefitIcon: {
    fontSize: 34,
    lineHeight: 42,
  },
  benefitText: {
    fontWeight: '600',
  },
  bulletList: {
    gap: Spacing.two,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  bulletMarker: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  bulletText: {
    flex: 1,
  },
  form: {
    gap: Spacing.four,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.85,
  },
  submitError: {
    textAlign: 'center',
  },
  confirmationCard: {
    borderRadius: Radius.xl,
    padding: Spacing.six,
    gap: Spacing.four,
    alignItems: 'center',
  },
  confirmationIconWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationTitle: {
    textAlign: 'center',
  },
  confirmationText: {
    textAlign: 'center',
    lineHeight: 32,
  },
});
