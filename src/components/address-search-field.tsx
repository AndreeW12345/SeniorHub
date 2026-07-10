import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { searchAddresses, type AddressSuggestion } from '@/services/geocoding';
import { useTheme } from '@/hooks/use-theme';

type AddressSearchFieldProps = {
  value: string;
  onChange: (address: string) => void;
  latitude: string;
  longitude: string;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
  error?: string;
  disabled?: boolean;
};

export function AddressSearchField({
  value,
  onChange,
  latitude,
  longitude,
  onCoordinatesChange,
  error,
  disabled = false,
}: AddressSearchFieldProps) {
  const theme = useTheme();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 3 || trimmed === value.trim()) {
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      setIsSearching(true);

      void (async () => {
        const result = await searchAddresses(trimmed);

        if (cancelled) {
          return;
        }

        setIsSearching(false);

        if (!result.ok) {
          setSuggestions([]);
          setSearchError(result.errorMessage);
          return;
        }

        setSuggestions(result.suggestions);
        setSearchError(null);
      })();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, value]);

  const handleQueryChange = (text: string) => {
    setQuery(text);

    if (text.trim().length < 3) {
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    onCoordinatesChange(String(suggestion.latitude), String(suggestion.longitude));
    setQuery(suggestion.label);
    setSuggestions([]);
    setSearchError(null);
    setIsFocused(false);
  };

  const handleClearSelection = () => {
    onChange('');
    onCoordinatesChange('', '');
    setQuery('');
    setSuggestions([]);
    setSearchError(null);
  };

  const showSuggestions = isFocused && suggestions.length > 0 && query.trim().length >= 3;
  const displayError = error ?? searchError;

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Sök adress eller plats
      </ThemedText>
      <ThemedText type="bodyLarge" themeColor="textSecondary">
        Sök till exempel &quot;Tyresö centrum&quot; och välj adressen i listan för att placera
        aktiviteten på kartan.
      </ThemedText>

      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsFocused(false), 150);
        }}
        editable={!disabled}
        placeholder="Till exempel Tyresö centrum"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          CardShadow,
          {
            backgroundColor: theme.card,
            color: theme.text,
            borderColor: displayError ? theme.favorite : theme.border,
          },
        ]}
      />

      {isSearching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator color={theme.primary} />
          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Söker adress...
          </ThemedText>
        </View>
      ) : null}

      {showSuggestions ? (
        <View style={[styles.suggestions, CardShadow, { backgroundColor: theme.card }]}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              accessibilityRole="button"
              accessibilityLabel={`Välj adress ${suggestion.label}`}
              onPress={() => handleSelectSuggestion(suggestion)}
              style={({ pressed }) => [
                styles.suggestionItem,
                { borderBottomColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" style={styles.suggestionLabel}>
                {suggestion.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {value ? (
        <View style={[styles.selectedCard, { backgroundColor: theme.primaryLight }]}>
          <ThemedText type="smallBold" themeColor="primary">
            Vald adress
          </ThemedText>
          <ThemedText type="bodyLarge" themeColor="primary">
            {value}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ta bort vald adress"
            disabled={disabled}
            onPress={handleClearSelection}
            style={({ pressed }) => [pressed && styles.pressed]}>
            <ThemedText type="linkPrimary">Ta bort adress</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {latitude || longitude ? (
        <View style={styles.debugBlock}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Koordinater (felsökning)
          </ThemedText>
          <FormReadOnlyValue label="Latitud" value={latitude || '–'} />
          <FormReadOnlyValue label="Longitud" value={longitude || '–'} />
        </View>
      ) : null}

      {displayError ? (
        <ThemedText type="small" themeColor="favorite">
          {displayError}
        </ThemedText>
      ) : null}
    </View>
  );
}

function FormReadOnlyValue({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.readOnlyRow}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="bodyLarge" style={{ color: theme.textSecondary }}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    minHeight: 60,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  suggestions: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
    borderBottomWidth: 1,
    minHeight: 56,
    justifyContent: 'center',
  },
  suggestionLabel: {
    fontWeight: '600',
  },
  selectedCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  debugBlock: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  readOnlyRow: {
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.88,
  },
});
