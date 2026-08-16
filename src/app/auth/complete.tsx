import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  clearPendingRegistration,
  completeMagicLinkSignIn,
  readEmailForSignIn,
  readPendingRegistration,
} from '@/services/auth';
import { readPendingActivityBooking } from '@/services/auth/pending-activity-booking';
import { fetchUserProfile, migrateDeviceProfileToUid, saveUserProfile } from '@/services/profile';
import { readSearchParam, resolveAuthEmailLink } from '@/utils/resolve-auth-email-link';

async function resolvePostSignInRoute(): Promise<Href> {
  const pendingBooking = await readPendingActivityBooking();
  if (pendingBooking?.activityId) {
    return `/activity/${pendingBooking.activityId}?resumeBooking=1` as Href;
  }

  return '/profil' as Href;
}

/**
 * Completes Firebase Magic Link sign-in when the email link opens the app.
 */
export default function AuthCompleteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    link?: string | string[];
    apiKey?: string | string[];
    oobCode?: string | string[];
    mode?: string | string[];
    lang?: string | string[];
  }>();
  const [status, setStatus] = useState<'working' | 'need-email' | 'success' | 'error'>('working');
  const [message, setMessage] = useState('Loggar in...');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const startedRef = useRef(false);

  const finishSignIn = useCallback(
    async (nextEmail: string, url: string) => {
      setStatus('working');
      setMessage('Loggar in...');

      const result = await completeMagicLinkSignIn(nextEmail, url);
      if (!result.ok) {
        setStatus('error');
        setMessage(result.errorMessage);
        return;
      }

      const pending = await readPendingRegistration();
      const uid = result.user.uid;
      await migrateDeviceProfileToUid(uid);

      const existing = await fetchUserProfile(uid);
      const existingProfile = existing.ok ? existing.profile : null;
      const profileEmail = result.user.email?.trim() || nextEmail;
      const fullName = pending
        ? `${pending.firstName} ${pending.lastName}`.trim()
        : existingProfile?.name?.trim() || '';

      await saveUserProfile(uid, {
        name: fullName,
        phone: existingProfile?.phone ?? '',
        email: profileEmail,
        photoUrl: existingProfile?.photoUrl,
      });

      if (pending) {
        await clearPendingRegistration();
      }

      setStatus('success');
      setMessage('Du är nu inloggad.');
      router.replace(await resolvePostSignInRoute());
    },
    [router],
  );

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    void (async () => {
      const initialUrl = await Linking.getInitialURL();
      const href = resolveAuthEmailLink(
        readSearchParam(params.link),
        initialUrl,
        params,
      );

      if (!href) {
        setStatus('error');
        setMessage('Inloggningslänken är ogiltig eller har gått ut. Be om en ny länk.');
        return;
      }

      setLinkUrl(href);

      const storedEmail = await readEmailForSignIn();
      if (storedEmail) {
        await finishSignIn(storedEmail, href);
        return;
      }

      setStatus('need-email');
      setMessage('Ange samma e-postadress som du fick länken till.');
    })();
  }, [finishSignIn, params]);

  const handleConfirmEmail = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Ange en e-postadress.');
      return;
    }

    if (!linkUrl) {
      setStatus('error');
      setMessage('Inloggningslänken saknas. Öppna länken från din e-post igen.');
      return;
    }

    void finishSignIn(trimmed, linkUrl);
  };

  return (
    <ScreenLayout title="Logga in" subtitle="Slutför inloggningen" showBackButton>
      <View style={styles.body}>
        {status === 'working' ? (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.message}>
              {message}
            </ThemedText>
          </>
        ) : null}

        {status === 'need-email' ? (
          <>
            <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.message}>
              {message}
            </ThemedText>
            <FormField
              label="E-postadress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setEmailError(undefined);
              }}
              error={emailError}
              placeholder="din@epost.se"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fortsätt"
              onPress={handleConfirmEmail}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.buttonText}>
                Fortsätt
              </ThemedText>
            </Pressable>
          </>
        ) : null}

        {status === 'error' ? (
          <>
            <ThemedText type="bodyLarge" themeColor="favorite" style={styles.message}>
              {message}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Till inloggning"
              onPress={() => router.replace('/login' as Href)}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.buttonText}>
                Till inloggning
              </ThemedText>
            </Pressable>
          </>
        ) : null}

        {status === 'success' ? (
          <ThemedText type="bodyLarge" themeColor="textSecondary" style={styles.message}>
            {message}
          </ThemedText>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: Spacing.four,
    alignItems: 'stretch',
  },
  message: {
    textAlign: 'center',
    lineHeight: 30,
  },
  button: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
