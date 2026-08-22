import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormCheckbox } from '@/components/form-checkbox';
import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth-context';
import { submitOrganizerApplication } from '@/services/organizer-applications';

type OrganizerApplicationFormProps = {
  onSubmit: () => void;
};

type FormErrors = {
  organization?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  municipality?: string;
  activitiesDescription?: string;
  consent?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function OrganizerApplicationForm({ onSubmit }: OrganizerApplicationFormProps) {
  const theme = useTheme();
  const { user, isSignedIn } = useAuth();
  const [organization, setOrganization] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [website, setWebsite] = useState('');
  const [activitiesDescription, setActivitiesDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedOrganization = organization.trim();
    const trimmedContactPerson = contactPerson.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedMunicipality = municipality.trim();
    const trimmedDescription = activitiesDescription.trim();

    const nextErrors: FormErrors = {
      organization: trimmedOrganization ? undefined : 'Ange organisation eller förening.',
      contactPerson: trimmedContactPerson ? undefined : 'Ange kontaktperson.',
      email: !trimmedEmail
        ? 'Ange en e-postadress.'
        : isValidEmail(trimmedEmail)
          ? undefined
          : 'Ange en giltig e-postadress.',
      phone: trimmedPhone ? undefined : 'Ange telefonnummer.',
      municipality: trimmedMunicipality ? undefined : 'Ange kommun.',
      activitiesDescription: trimmedDescription
        ? undefined
        : 'Beskriv vilka aktiviteter ni vill arrangera.',
      consent: consent ? undefined : 'Du måste godkänna att SeniorHub kontaktar dig.',
    };

    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    if (!isSignedIn || !user) {
      setSubmitError('Du måste vara inloggad för att skicka en ansökan.');
      return;
    }

    if (!user.emailVerified) {
      setSubmitError('Verifiera din e-postadress innan du skickar en arrangörsansökan.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitOrganizerApplication({
        contactPerson: trimmedContactPerson,
        email: trimmedEmail,
        phone: trimmedPhone,
        organization: trimmedOrganization,
        municipality: trimmedMunicipality,
        website,
        activitiesDescription: trimmedDescription,
      });

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.card, CardShadow, { backgroundColor: theme.card }]}>
      <ThemedText type="sectionTitle" accessibilityRole="header">
        Ansök om att bli arrangör
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.intro}>
        Fyll i formuläret nedan så kontaktar vi dig när vi har granskat din ansökan.
      </ThemedText>

      <View style={styles.form}>
        <FormField
          label="Organisation/Förening"
          value={organization}
          onChangeText={setOrganization}
          autoCapitalize="words"
          error={errors.organization}
          editable={!isSubmitting}
        />
        <FormField
          label="Kontaktperson"
          value={contactPerson}
          onChangeText={setContactPerson}
          autoCapitalize="words"
          error={errors.contactPerson}
          editable={!isSubmitting}
        />
        <FormField
          label="E-postadress"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          editable={!isSubmitting}
        />
        <FormField
          label="Telefonnummer"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
          editable={!isSubmitting}
        />
        <FormField
          label="Kommun"
          value={municipality}
          onChangeText={setMunicipality}
          autoCapitalize="words"
          error={errors.municipality}
          editable={!isSubmitting}
        />
        <FormField
          label="Hemsida (valfritt)"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />
        <FormField
          label="Beskriv vilka aktiviteter ni vill arrangera"
          value={activitiesDescription}
          onChangeText={setActivitiesDescription}
          multiline
          error={errors.activitiesDescription}
          editable={!isSubmitting}
        />

        <View style={styles.checkboxBlock}>
          <FormCheckbox
            label="Jag godkänner att SeniorHub kontaktar mig angående min ansökan."
            checked={consent}
            onChange={setConsent}
            disabled={isSubmitting}
          />
          {errors.consent ? (
            <ThemedText type="small" themeColor="favorite">
              {errors.consent}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {submitError ? (
        <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
          {submitError}
        </ThemedText>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skicka ansökan"
        accessibilityState={{ disabled: isSubmitting }}
        disabled={isSubmitting}
        onPress={handleSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: theme.primary },
          (pressed || isSubmitting) && styles.pressed,
          isSubmitting && styles.disabled,
        ]}>
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <ThemedText type="bodyLarge" style={styles.submitButtonText}>
            Skicka ansökan
          </ThemedText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.four + 4,
  },
  intro: {
    fontSize: 22,
    lineHeight: 34,
  },
  form: {
    gap: Spacing.four,
  },
  checkboxBlock: {
    gap: Spacing.two,
  },
  submitError: {
    fontWeight: '600',
  },
  submitButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    marginTop: Spacing.two,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.75,
  },
});
