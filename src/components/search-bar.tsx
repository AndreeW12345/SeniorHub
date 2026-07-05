import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

import { Radius, SoftShadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Sök aktivitet, plats eller arrangör...',
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        SoftShadow,
        { backgroundColor: theme.searchBackground },
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
        style={[styles.input, { color: theme.text }]}
        accessibilityLabel="Sök aktiviteter"
        accessibilityHint="Skriv för att filtrera aktiviteter"
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
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
  input: {
    flex: 1,
    fontSize: 21,
    lineHeight: 30,
    fontWeight: '500',
    paddingVertical: 0,
    letterSpacing: 0.1,
  },
});
