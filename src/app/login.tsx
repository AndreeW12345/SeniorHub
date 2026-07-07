import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useSafeBack } from '@/hooks/use-safe-back';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const router = useRouter();
  const goBack = useSafeBack();
  const theme = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const nextEmailError = trimmedEmail ? undefined : 'Ange en e-postadress.';
    const nextPasswordError = password ? undefined : 'Ange ett lösenord.';

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setSubmitError(null);

    if (nextEmailError || nextPasswordError) {
      return;
    }

    setIsSigningIn(true);

    try {
      const result = await signIn(trimmedEmail, password);

      if (!result.ok) {
        setSubmitError(result.errorMessage);
        return;
      }

      router.replace('/admin' as Href);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ScreenLayout title="Administratörsinloggning" subtitle="Logga in för att hantera aktiviteter">
      <View style={styles.form}>
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Endast administratörer behöver logga in. Vanliga användare kan fortsätta bläddra i appen utan
          konto.
        </ThemedText>

        <FormField
          label="E-postadress"
          value={email}
          onChangeText={setEmail}
          error={emailError}
          placeholder="admin@exempel.se"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <FormField
          label="Lösenord"
          value={password}
          onChangeText={setPassword}
          error={passwordError}
          placeholder="Ange lösenord"
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        {submitError ? (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
            {submitError}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Logga in"
          disabled={isSigningIn}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.signInButton,
            { backgroundColor: theme.primary },
            (pressed || isSigningIn) && styles.signInButtonPressed,
            isSigningIn && styles.signInButtonDisabled,
          ]}>
          {isSigningIn ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="bodyLarge" style={styles.signInButtonText}>
              Logga in
            </ThemedText>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avbryt och gå tillbaka"
          onPress={goBack}
          style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}>
          <ThemedText type="linkPrimary" style={styles.cancelButtonText}>
            Avbryt
          </ThemedText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.four,
  },
  submitError: {
    textAlign: 'center',
  },
  signInButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  signInButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  signInButtonDisabled: {
    opacity: 0.85,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    textAlign: 'center',
  },
});
