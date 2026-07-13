import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { FormField } from '@/components/form-field';
import { ThemedText } from '@/components/themed-text';
import {
  MEMBERSHIP_ORGANIZATION_OTHER,
  MEMBERSHIP_ORGANIZATION_PRESETS,
} from '@/constants/membership';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MembershipOrganizationPickerProps = {
  organization: string;
  customOrganization: string;
  onOrganizationChange: (organization: string) => void;
  onCustomOrganizationChange: (customOrganization: string) => void;
  organizationError?: string;
  customOrganizationError?: string;
  disabled?: boolean;
};

export function MembershipOrganizationPicker({
  organization,
  customOrganization,
  onOrganizationChange,
  onCustomOrganizationChange,
  organizationError,
  customOrganizationError,
  disabled = false,
}: MembershipOrganizationPickerProps) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const isOther = organization === MEMBERSHIP_ORGANIZATION_OTHER;

  const displayValue = useMemo(() => {
    if (isOther) {
      return customOrganization.trim() || MEMBERSHIP_ORGANIZATION_OTHER;
    }

    return organization;
  }, [customOrganization, isOther, organization]);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        Organisation
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Välj organisation"
        accessibilityState={{ expanded: isOpen, disabled }}
        disabled={disabled}
        onPress={() => setIsOpen((open) => !open)}
        style={({ pressed }) => [
          styles.trigger,
          CardShadow,
          {
            backgroundColor: theme.card,
            borderColor: organizationError ? theme.favorite : theme.border,
          },
          pressed && !disabled && styles.pressed,
        ]}>
        <ThemedText type="bodyLarge" style={styles.triggerText}>
          {displayValue}
        </ThemedText>
        <SymbolView
          tintColor={theme.primary}
          name={{ ios: 'chevron.down', android: 'arrow_drop_down', web: 'arrow_drop_down' }}
          size={24}
        />
      </Pressable>

      {organizationError ? (
        <ThemedText type="small" themeColor="favorite">
          {organizationError}
        </ThemedText>
      ) : null}

      {isOpen ? (
        <View style={[styles.options, CardShadow, { backgroundColor: theme.card }]}>
          {MEMBERSHIP_ORGANIZATION_PRESETS.map((preset) => {
            const selected = organization === preset;

            return (
              <Pressable
                key={preset}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  onOrganizationChange(preset);
                  setIsOpen(false);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.primaryLight : theme.card,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="bodyLarge" style={styles.optionText}>
                  {preset}
                </ThemedText>
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isOther }}
            onPress={() => {
              onOrganizationChange(MEMBERSHIP_ORGANIZATION_OTHER);
              setIsOpen(false);
            }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: isOther ? theme.primaryLight : theme.card,
              },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="bodyLarge" style={styles.optionText}>
              {MEMBERSHIP_ORGANIZATION_OTHER}
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {isOther ? (
        <FormField
          label="Annan organisation"
          value={customOrganization}
          onChangeText={onCustomOrganizationChange}
          error={customOrganizationError}
          placeholder="Till exempel Min förening"
          editable={!disabled}
        />
      ) : null}
    </View>
  );
}

export function resolveMembershipOrganization(organization: string, customOrganization: string): string {
  if (organization === MEMBERSHIP_ORGANIZATION_OTHER) {
    return customOrganization.trim();
  }

  return organization.trim();
}

export function splitMembershipOrganizationForForm(organization: string | null | undefined): {
  organization: string;
  customOrganization: string;
} {
  const trimmed = organization?.trim() ?? '';

  if (!trimmed) {
    return { organization: MEMBERSHIP_ORGANIZATION_PRESETS[0], customOrganization: '' };
  }

  if ((MEMBERSHIP_ORGANIZATION_PRESETS as readonly string[]).includes(trimmed)) {
    return { organization: trimmed, customOrganization: '' };
  }

  return {
    organization: MEMBERSHIP_ORGANIZATION_OTHER,
    customOrganization: trimmed,
  };
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  trigger: {
    minHeight: 60,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three + 2,
  },
  triggerText: {
    flex: 1,
    fontWeight: '600',
  },
  options: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  option: {
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  optionText: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.92,
  },
});
