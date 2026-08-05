import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/hooks/use-theme';

/**
 * Regular user login via Firebase Magic Link.
 * Password fields are intentionally not shown.
 */
export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { sendSignInLink, isSignedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSendLink = async () => {
    const trimmedEmail = email.trim();
    const nextEmailError = trimmedEmail ? undefined : 'Ange en e-postadress.';

    setEmailError(nextEmailError);
    setSubmitError(null);

    if (nextEmailError) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendSignInLink(trimmedEmail);
      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      setLinkSent(true);
    } finally {
      setIsSending(false);
    }
  };

  if (isSignedIn && !linkSent) {
    return (
      <ScreenLayout title="Logga in" subtitle="Du är redan inloggad" showBackButton>
        <View style={styles.form}>
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Du är redan inloggad.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Till profilen"
            onPress={() => router.replace('/profil' as Href)}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" style={styles.primaryButtonText}>
              Till profilen
            </ThemedText>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Logga in" subtitle="Inget lösenord behövs" showBackButton>
      <View style={styles.form}>
        {linkSent ? (
          <View style={[styles.successCard, { backgroundColor: theme.primaryLight }]}>
            <ThemedText type="sectionTitle" themeColor="primary">
              Kolla din e-post
            </ThemedText>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.successText}>
              Vi har skickat en inloggningslänk till {email.trim()}. Öppna länken för att logga in.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skicka länken igen"
              onPress={() => {
                setLinkSent(false);
                setSubmitError(null);
              }}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">Skicka länken igen</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <FormField
              label="E-postadress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError(undefined);
                setSubmitError(null);
              }}
              error={emailError}
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
              accessibilityLabel="Skicka inloggningslänk"
              disabled={isSending}
              onPress={() => void handleSendLink()}
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
                  Skicka inloggningslänk
                </ThemedText>
              )}
            </Pressable>

            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.helperText}>
              Vi skickar en säker inloggningslänk till din e-post. Inget lösenord behövs.
            </ThemedText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skapa konto"
              onPress={() => router.push('/register' as Href)}
              style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}>
              <ThemedText type="linkPrimary">Har du inget konto? Skapa konto</ThemedText>
            </Pressable>
          </>
        )}

        <View style={[styles.adminDivider, { borderTopColor: theme.border }]}>
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.adminLabel}>
            Är du administratör?
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Administratörsinloggning"
            onPress={() => router.push('/admin/login' as Href)}
            style={({ pressed }) => [
              styles.secondaryButton,
              { borderColor: theme.primary, backgroundColor: theme.card },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" themeColor="primary" style={styles.secondaryButtonText}>
              Administratörsinloggning
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
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
  secondaryButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  secondaryButtonText: {
    fontWeight: '700',
  },
  helperText: {
    textAlign: 'center',
    lineHeight: 30,
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
    gap: Spacing.three,
  },
  successText: {
    lineHeight: 30,
  },
  adminDivider: {
    marginTop: Spacing.four,
    paddingTop: Spacing.five,
    borderTopWidth: 1,
    gap: Spacing.three,
  },
  adminLabel: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.85,
  },
});
