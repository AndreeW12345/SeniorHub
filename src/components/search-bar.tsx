import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Sök på namn, beskrivning eller plats...',
}: SearchBarProps) {
  const theme = useTheme();
  const { isCompact } = useResponsive();
  const isMobileWeb = Platform.OS === 'web' && isCompact;
  const hasValue = value.trim().length > 0;

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View
      style={[
        styles.container,
        SoftShadow,
        { backgroundColor: theme.searchBackground },
        isMobileWeb && styles.containerMobileWeb,
      ]}>
      <SymbolView
        tintColor={theme.primary}
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={28}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }, isMobileWeb && styles.inputMobileWeb]}
        accessibilityLabel="Sök aktiviteter"
        accessibilityHint="Skriv för att filtrera aktiviteter på namn, beskrivning eller plats"
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        {...(isMobileWeb ? { inputMode: 'search' as const } : null)}
      />
      {hasValue ? (
        <Pressable
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Rensa sökning"
          hitSlop={10}
          style={({ pressed }) => [styles.clearButton, pressed && styles.clearPressed]}>
          <SymbolView
            tintColor={theme.textSecondary}
            name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
            size={26}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.four + 4,
    paddingVertical: Spacing.three + 4,
    minHeight: 68,
  },
  containerMobileWeb: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '500',
    paddingVertical: 0,
    letterSpacing: 0.1,
  },
  inputMobileWeb: {
    minWidth: 0,
    maxWidth: '100%',
    fontSize: 16,
    lineHeight: 24,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPressed: {
    opacity: 0.7,
  },
});
