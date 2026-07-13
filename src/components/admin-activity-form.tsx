import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AddressSearchField } from '@/components/address-search-field';
import { CategoryDropdown } from '@/components/category-dropdown';
import { AdminActivityImagePicker } from '@/components/admin-activity-image-picker';
import { DateTimeField } from '@/components/date-time-field';
import { FormField } from '@/components/form-field';
import { FormCheckbox } from '@/components/form-checkbox';
import { FormRadioGroup } from '@/components/form-radio-group';
import {
  MembershipOrganizationPicker,
  resolveMembershipOrganization,
  splitMembershipOrganizationForForm,
} from '@/components/membership-organization-picker';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type ActivityCategory } from '@/constants/activities';
import {
  DEFAULT_REGISTRATION_METHOD,
  REGISTRATION_METHOD_LABELS,
  REGISTRATION_METHODS,
  type RegistrationMethod,
} from '@/constants/membership';
import { Radius, Spacing } from '@/constants/theme';
import {
  saveActivityToFirestore,
  updateActivityInFirestore,
  type ActivityFormInput,
} from '@/services/activities';
import { uploadActivityImage } from '@/services/storage';
import { useTheme } from '@/hooks/use-theme';
import {
  parseCoordinateInput,
  validateActivityCoordinates,
} from '@/utils/activity-coordinates';

type FormErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'date'
    | 'time'
    | 'location'
    | 'organizer'
    | 'category'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'maxParticipants'
    | 'membershipOrganization'
    | 'membershipCustomOrganization'
    | 'membershipUrl'
    | 'registrationUrl'
    | 'registrationPhone'
    | 'registrationEmail',
    string
  >
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
  latitude: '',
  longitude: '',
  address: '',
  registrationRequired: false,
  hasParticipantLimit: false,
  maxParticipants: '',
  participants: 0,
  membershipRequired: false,
  membershipOrganization: '',
  membershipUrl: '',
  registrationMethod: DEFAULT_REGISTRATION_METHOD,
  registrationUrl: '',
  registrationPhone: '',
  registrationEmail: '',
};

const REGISTRATION_METHOD_OPTIONS = REGISTRATION_METHODS.map((method) => ({
  value: method,
  label: REGISTRATION_METHOD_LABELS[method],
}));

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
  const [latitude, setLatitude] = useState(initialValues.latitude ?? '');
  const [longitude, setLongitude] = useState(initialValues.longitude ?? '');
  const [address, setAddress] = useState(initialValues.address ?? '');
  const [registrationRequired, setRegistrationRequired] = useState(
    initialValues.registrationRequired ?? false,
  );
  const [hasParticipantLimit, setHasParticipantLimit] = useState(
    initialValues.hasParticipantLimit ?? false,
  );
  const [maxParticipants, setMaxParticipants] = useState(initialValues.maxParticipants ?? '');
  const [participants] = useState(initialValues.participants ?? 0);
  const initialMembership = splitMembershipOrganizationForForm(initialValues.membershipOrganization);
  const [membershipRequired, setMembershipRequired] = useState(
    initialValues.membershipRequired ?? false,
  );
  const [membershipOrganization, setMembershipOrganization] = useState(
    initialMembership.organization,
  );
  const [membershipCustomOrganization, setMembershipCustomOrganization] = useState(
    initialMembership.customOrganization,
  );
  const [membershipUrl, setMembershipUrl] = useState(initialValues.membershipUrl ?? '');
  const [registrationMethod, setRegistrationMethod] = useState<RegistrationMethod>(
    initialValues.registrationMethod ?? DEFAULT_REGISTRATION_METHOD,
  );
  const [registrationUrl, setRegistrationUrl] = useState(initialValues.registrationUrl ?? '');
  const [registrationPhone, setRegistrationPhone] = useState(initialValues.registrationPhone ?? '');
  const [registrationEmail, setRegistrationEmail] = useState(initialValues.registrationEmail ?? '');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

    const parsedLatitude = parseCoordinateInput(latitude);
    const parsedLongitude = parseCoordinateInput(longitude);
    const coordinateError = validateActivityCoordinates(parsedLatitude, parsedLongitude);

    if (coordinateError) {
      nextErrors.address = coordinateError;
    }

    if (hasParticipantLimit && !maxParticipants.trim()) {
      nextErrors.maxParticipants = 'Ange max antal deltagare.';
    }

    if (membershipRequired) {
      const resolvedOrganization = resolveMembershipOrganization(
        membershipOrganization,
        membershipCustomOrganization,
      );

      if (!resolvedOrganization) {
        nextErrors.membershipCustomOrganization = 'Ange organisation.';
      }

      if (!membershipUrl.trim()) {
        nextErrors.membershipUrl = 'Ange länk för medlemskap.';
      }
    }

    if (registrationRequired) {
      if (registrationMethod === 'external' && !registrationUrl.trim()) {
        nextErrors.registrationUrl = 'Ange webbadress för anmälan.';
      }

      if (registrationMethod === 'phone' && !registrationPhone.trim()) {
        nextErrors.registrationPhone = 'Ange telefonnummer för anmälan.';
      }

      if (registrationMethod === 'email' && !registrationEmail.trim()) {
        nextErrors.registrationEmail = 'Ange e-postadress för anmälan.';
      }
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

    let finalImageUrl = imageUrl.trim();

    if (localImageUri) {
      setIsUploadingImage(true);
      const uploadResult = await uploadActivityImage(localImageUri, activityId);
      setIsUploadingImage(false);

      if (!uploadResult.ok) {
        setIsSaving(false);
        setSubmitError(uploadResult.errorMessage);
        return;
      }

      finalImageUrl = uploadResult.downloadUrl;
    }

    const input: ActivityFormInput = {
      title,
      description,
      date,
      time,
      location,
      organizer,
      category,
      imageUrl: finalImageUrl,
      latitude,
      longitude,
      address,
      registrationRequired,
      hasParticipantLimit,
      maxParticipants: hasParticipantLimit ? maxParticipants : '',
      participants,
      membershipRequired,
      membershipOrganization: membershipRequired
        ? resolveMembershipOrganization(membershipOrganization, membershipCustomOrganization)
        : '',
      membershipUrl: membershipRequired ? membershipUrl : '',
      registrationMethod: registrationRequired ? registrationMethod : DEFAULT_REGISTRATION_METHOD,
      registrationUrl: registrationRequired && registrationMethod === 'external' ? registrationUrl : '',
      registrationPhone: registrationRequired && registrationMethod === 'phone' ? registrationPhone : '',
      registrationEmail: registrationRequired && registrationMethod === 'email' ? registrationEmail : '',
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
        <AddressSearchField
          key={`${activityId ?? 'new'}-${initialValues.address ?? ''}`}
          value={address}
          onChange={(nextAddress) => {
            setAddress(nextAddress);
            if (!nextAddress.trim()) {
              setLatitude('');
              setLongitude('');
              return;
            }

            if (!location.trim()) {
              setLocation(nextAddress);
            }
          }}
          latitude={latitude}
          longitude={longitude}
          onCoordinatesChange={(nextLatitude, nextLongitude) => {
            setLatitude(nextLatitude);
            setLongitude(nextLongitude);
          }}
          error={errors.address}
          disabled={isSaving || isUploadingImage}
        />
        <AdminActivityImagePicker
          imageUrl={imageUrl}
          localImageUri={localImageUri}
          onImageUrlChange={setImageUrl}
          onLocalImageUriChange={setLocalImageUri}
          disabled={isSaving || isUploadingImage}
        />

        <View style={styles.registrationSection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Medlemskap
          </ThemedText>
          <FormCheckbox
            label="Medlemskap krävs"
            checked={membershipRequired}
            onChange={(checked) => {
              setMembershipRequired(checked);
              if (!checked) {
                setMembershipUrl('');
                setErrors((current) => ({
                  ...current,
                  membershipOrganization: undefined,
                  membershipCustomOrganization: undefined,
                  membershipUrl: undefined,
                }));
              }
            }}
            disabled={isSaving || isUploadingImage}
          />
          {membershipRequired ? (
            <>
              <MembershipOrganizationPicker
                organization={membershipOrganization}
                customOrganization={membershipCustomOrganization}
                onOrganizationChange={setMembershipOrganization}
                onCustomOrganizationChange={setMembershipCustomOrganization}
                organizationError={errors.membershipOrganization}
                customOrganizationError={errors.membershipCustomOrganization}
                disabled={isSaving || isUploadingImage}
              />
              <FormField
                label="Medlemskapets länk"
                value={membershipUrl}
                onChangeText={setMembershipUrl}
                error={errors.membershipUrl}
                placeholder="https://example.se/bli-medlem"
                keyboardType="url"
                autoCapitalize="none"
                editable={!isSaving && !isUploadingImage}
              />
            </>
          ) : null}
        </View>

        <View style={styles.registrationSection}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Anmälan
          </ThemedText>
          <FormCheckbox
            label="Anmälan krävs"
            checked={registrationRequired}
            onChange={(checked) => {
              setRegistrationRequired(checked);
              if (!checked) {
                setErrors((current) => ({
                  ...current,
                  registrationUrl: undefined,
                  registrationPhone: undefined,
                  registrationEmail: undefined,
                }));
              }
            }}
            disabled={isSaving || isUploadingImage}
          />
          {registrationRequired ? (
            <FormRadioGroup
              label="Anmälningsmetod"
              value={registrationMethod}
              options={REGISTRATION_METHOD_OPTIONS}
              onChange={setRegistrationMethod}
              disabled={isSaving || isUploadingImage}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'external' ? (
            <FormField
              label="Webbadress för anmälan"
              value={registrationUrl}
              onChangeText={setRegistrationUrl}
              error={errors.registrationUrl}
              placeholder="https://example.se/anmalan"
              keyboardType="url"
              autoCapitalize="none"
              editable={!isSaving && !isUploadingImage}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'phone' ? (
            <FormField
              label="Telefonnummer för anmälan"
              value={registrationPhone}
              onChangeText={setRegistrationPhone}
              error={errors.registrationPhone}
              placeholder="Till exempel 08-123 456 78"
              keyboardType="phone-pad"
              editable={!isSaving && !isUploadingImage}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'email' ? (
            <FormField
              label="E-postadress för anmälan"
              value={registrationEmail}
              onChangeText={setRegistrationEmail}
              error={errors.registrationEmail}
              placeholder="Till exempel anmalan@example.se"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSaving && !isUploadingImage}
            />
          ) : null}
          <FormCheckbox
            label="Begränsat antal deltagare"
            checked={hasParticipantLimit}
            onChange={(checked) => {
              setHasParticipantLimit(checked);
              if (!checked) {
                setMaxParticipants('');
                setErrors((current) => ({ ...current, maxParticipants: undefined }));
              }
            }}
            disabled={isSaving || isUploadingImage}
          />
          {hasParticipantLimit ? (
            <FormField
              label="Max antal deltagare"
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              error={errors.maxParticipants}
              placeholder="Till exempel 20"
              keyboardType="number-pad"
            />
          ) : null}
        </View>

        {submitError ? (
          <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
            {submitError}
          </ThemedText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? 'Spara ändringar' : 'Spara aktivitet'}
          disabled={isSaving || isUploadingImage}
          onPress={() => void handleSubmit()}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primary },
            (pressed || isSaving || isUploadingImage) && styles.saveButtonPressed,
            (isSaving || isUploadingImage) && styles.saveButtonDisabled,
          ]}>
          {isSaving || isUploadingImage ? (
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
  registrationSection: {
    gap: Spacing.three,
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
