import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={[styles.section, CardShadow, { backgroundColor: theme.card }]}>
      <ThemedText type="sectionTitle">{title}</ThemedText>
      {children}
    </View>
  );
}

function InfoStep({ icon, text }: { icon: SymbolViewProps['name']; text: string }) {
  const theme = useTheme();

  return (
    <View style={styles.step}>
      <View style={[styles.stepIcon, { backgroundColor: theme.primaryLight }]}>
        <SymbolView tintColor={theme.primary} name={icon} size={26} />
      </View>
      <ThemedText type="bodyLarge" style={styles.stepText}>
        {text}
      </ThemedText>
    </View>
  );
}

export default function InformationScreen() {
  return (
    <ScreenLayout title="Information" subtitle="Om SeniorHub">
      <InfoSection title="Välkommen till SeniorHub">
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          SeniorHub hjälper dig att hitta aktiviteter och evenemang i ditt närområde. Appen har
          stora texter och enkel navigation för att vara lätt att använda.
        </ThemedText>
      </InfoSection>

      <InfoSection title="I den här versionen">
        <View style={styles.stepList}>
          <InfoStep
            icon={{ ios: 'calendar', android: 'event', web: 'event' }}
            text="Bläddra bland aktiviteter och tryck på ett kort för att läsa mer"
          />
          <InfoStep
            icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            text="Sök och filtrera aktiviteter efter kategori"
          />
          <InfoStep
            icon={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            text="Spara favoriter genom att trycka på hjärtat på en aktivitet"
          />
          <InfoStep
            icon={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
            text="Läs mer om appen här under Information"
          />
        </View>
      </InfoSection>

      <InfoSection title="Kommande funktioner">
        <ThemedText type="bodyLarge" themeColor="textSecondary">
          Karta och koppling till en databas läggs till steg för steg i kommande versioner.
          Dina favoriter sparas lokalt på enheten.
        </ThemedText>
      </InfoSection>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  section: {
    borderRadius: Radius.xl,
    padding: Spacing.five + 4,
    gap: Spacing.four,
  },
  stepList: {
    gap: Spacing.four,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  stepIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
});
