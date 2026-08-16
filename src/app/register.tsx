import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { readPendingActivityBooking } from '@/services/auth/pending-activity-booking';

/** Passwordless account creation for regular users. */
export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { registerWithMagicLink, isSignedIn } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    void (async () => {
      const pendingBooking = await readPendingActivityBooking();
      if (pendingBooking?.activityId) {
        router.replace(
          `/activity/${pendingBooking.activityId}?resumeBooking=1` as Href,
        );
        return;
      }

      router.replace('/profil' as Href);
    })();
  }, [isSignedIn, router]);

  const handleRegister = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    const nextErrors = {
      firstName: trimmedFirst ? undefined : 'Ange ditt förnamn.',
      lastName: trimmedLast ? undefined : 'Ange ditt efternamn.',
      email: trimmedEmail ? undefined : 'Ange en e-postadress.',
    };

    setErrors(nextErrors);
    setSubmitError(null);

    if (nextErrors.firstName || nextErrors.lastName || nextErrors.email) {
      return;
    }

    setIsSending(true);

    try {
      const result = await registerWithMagicLink({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
      });

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      setLinkSent(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScreenLayout title="Skapa konto" subtitle="Inget lösenord behövs" showBackButton>
      <View style={styles.form}>
        {isSignedIn ? (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.intro}>
              Loggar in …
            </ThemedText>
          </>
        ) : linkSent ? (
          <View style={[styles.successCard, { backgroundColor: theme.primaryLight }]}>
            <ThemedText type="sectionTitle" themeColor="primary">
              Kolla din e-post
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.successText}>
              Vi har skickat en inloggningslänk till {email.trim()}. Öppna länken för att aktivera
              ditt konto och logga in.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Till inloggning"
              onPress={() => router.replace('/login' as Href)}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                Till inloggning
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.intro}>
              Fyll i dina uppgifter. Vi skickar en säker länk till din e-post så att du kan logga in
              utan lösenord.
            </ThemedText>

            <FormField
              label="Förnamn"
              value={firstName}
              onChangeText={(value) => {
                setFirstName(value);
                setErrors((current) => ({ ...current, firstName: undefined }));
              }}
              error={errors.firstName}
              placeholder="Förnamn"
              autoCapitalize="words"
              textContentType="givenName"
              autoComplete="given-name"
            />

            <FormField
              label="Efternamn"
              value={lastName}
              onChangeText={(value) => {
                setLastName(value);
                setErrors((current) => ({ ...current, lastName: undefined }));
              }}
              error={errors.lastName}
              placeholder="Efternamn"
              autoCapitalize="words"
              textContentType="familyName"
              autoComplete="family-name"
            />

            <FormField
              label="E-postadress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrors((current) => ({ ...current, email: undefined }));
                setSubmitError(null);
              }}
              error={errors.email}
              placeholder="din@epost.se"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            {submitError ? (
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.errorText}>
                {submitError}
              </ThemedText>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skapa konto"
              disabled={isSending}
              onPress={() => void handleRegister()}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary },
                (pressed || isSending) && styles.pressed,
                isSending && styles.disabled,
              ]}>
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
                  Skapa konto
                </ThemedText>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Logga in"
              onPress={() => router.replace('/login' as Href)}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">Har du redan konto? Logga in</ThemedText>
            </Pressable>
          </>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  intro: {
    lineHeight: 30,
  },
  primaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorText: {
    textAlign: 'center',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  successCard: {
    borderRadius: Radius.xl,
    padding: Spacing.five,
    gap: Spacing.four,
  },
  successText: {
    lineHeight: 30,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.85,
  },
});
