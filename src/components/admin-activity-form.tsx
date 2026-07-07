import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CategoryDropdown } from '@/components/category-dropdown';
import { DateTimeField } from '@/components/date-time-field';
import { FormField } from '@/components/form-field';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type ActivityCategory } from '@/constants/activities';
import { Radius, Spacing } from '@/constants/theme';
import {
  saveActivityToFirestore,
  updateActivityInFirestore,
  type ActivityFormInput,
} from '@/services/activities';
import { useTheme } from '@/hooks/use-theme';

type FormErrors = Partial<
  Record<'title' | 'description' | 'date' | 'time' | 'location' | 'organizer' | 'category', string>
>;

const REQUIRED_FIELD_ERRORS: FormErrors = {
  title: 'Ange en titel.',
  description: 'Ange en beskrivning.',
  date: 'Ange ett datum.',
  time: 'Ange en tid.',
  location: 'Ange en plats.',
  organizer: 'Ange en arrangör.',
};

type AdminActivityFormProps = {
  mode: 'create' | 'edit';
  activityId?: string;
  initialValues?: ActivityFormInput;
  onSubmitSuccess: () => Promise<void> | void;
};

const EMPTY_FORM: ActivityFormInput = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  organizer: '',
  category: 'Fika',
  imageUrl: '',
};

export function AdminActivityForm({
  mode,
  activityId,
  initialValues = EMPTY_FORM,
  onSubmitSuccess,
}: AdminActivityFormProps) {
  const theme = useTheme();
  const isEditMode = mode === 'edit';

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [date, setDate] = useState(initialValues.date);
  const [time, setTime] = useState(initialValues.time);
  const [location, setLocation] = useState(initialValues.location);
  const [organizer, setOrganizer] = useState(initialValues.organizer);
  const [category, setCategory] = useState<ActivityCategory>(initialValues.category);
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!title.trim()) {
      nextErrors.title = REQUIRED_FIELD_ERRORS.title;
    }
    if (!description.trim()) {
      nextErrors.description = REQUIRED_FIELD_ERRORS.description;
    }
    if (!date.trim()) {
      nextErrors.date = REQUIRED_FIELD_ERRORS.date;
    }
    if (!time.trim()) {
      nextErrors.time = REQUIRED_FIELD_ERRORS.time;
    }
    if (!location.trim()) {
      nextErrors.location = REQUIRED_FIELD_ERRORS.location;
    }
    if (!organizer.trim()) {
      nextErrors.organizer = REQUIRED_FIELD_ERRORS.organizer;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const input: ActivityFormInput = {
      title,
      description,
      date,
      time,
      location,
      organizer,
      category,
      imageUrl,
    };

    const result = isEditMode
      ? await updateActivityInFirestore(activityId ?? '', input)
      : await saveActivityToFirestore(input);

    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.errorMessage);
      return;
    }

    await onSubmitSuccess();
  };

  return (
    <ScreenLayout
      title={isEditMode ? 'Redigera aktivitet' : 'Lägg till aktivitet'}
      subtitle={
        isEditMode ? 'Uppdatera aktivitetens uppgifter' : 'Fyll i aktivitetens uppgifter'
      }>
      <View style={styles.form}>
        <FormField
          label="Titel"
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          placeholder="Till exempel Morgonpromenad"
          autoCapitalize="sentences"
        />
        <FormField
          label="Beskrivning"
          value={description}
          onChangeText={setDescription}
          error={errors.description}
          placeholder="Beskriv aktiviteten"
          multiline
        />
        <DateTimeField
          label="Datum"
          mode="date"
          value={date}
          onChange={setDate}
          error={errors.date}
          placeholder="Välj datum"
        />
        <DateTimeField
          label="Tid"
          mode="time"
          value={time}
          onChange={setTime}
          error={errors.time}
          placeholder="Välj tid"
        />
        <FormField
          label="Plats"
          value={location}
          onChangeText={setLocation}
          error={errors.location}
          placeholder="Till exempel Stadsparken"
        />
        <FormField
          label="Arrangör"
          value={organizer}
          onChangeText={setOrganizer}
          error={errors.organizer}
          placeholder="Till exempel Seniorföreningen"
        />
        <CategoryDropdown value={category} onChange={setCategory} error={errors.category} />
        <FormField
          label="Bild-URL (valfri)"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://..."
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        {submitError ? (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
            {submitError}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? 'Spara ändringar' : 'Spara aktivitet'}
          disabled={isSaving}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primary },
            (pressed || isSaving) && styles.saveButtonPressed,
            isSaving && styles.saveButtonDisabled,
          ]}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText type="bodyLarge" style={styles.saveButtonText}>
              {isEditMode ? 'Spara ändringar' : 'Spara aktivitet'}
            </ThemedText>
          )}
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
  saveButton: {
    minHeight: 64,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    marginTop: Spacing.two,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  saveButtonDisabled: {
    opacity: 0.75,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
