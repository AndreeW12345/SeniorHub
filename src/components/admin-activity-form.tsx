import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AddressSearchField } from '@/components/address-search-field';
import { AdminActivityImagePicker } from '@/components/admin-activity-image-picker';
import { AdminFormSection } from '@/components/admin-form-section';
import { AdminParticipantList } from '@/components/admin-participant-list';
import { CategoryDropdown } from '@/components/category-dropdown';
import { DateTimeField } from '@/components/date-time-field';
import { FormCheckbox } from '@/components/form-checkbox';
import { FormField } from '@/components/form-field';
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
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  saveActivityToFirestore,
  updateActivityInFirestore,
  type ActivityFormInput,
} from '@/services/activities';
import { uploadActivityImage } from '@/services/storage';
import {
  parseCoordinateInput,
  validateActivityCoordinates,
} from '@/utils/activity-coordinates';
import {
  combineStoredTimeRange,
  isEndTimeAfterStart,
  splitStoredTimeRange,
} from '@/utils/date-time-format';

type FormErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'date'
    | 'time'
    | 'endTime'
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
  date: 'Välj ett datum.',
  time: 'Välj en starttid.',
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

function clearError(errors: FormErrors, key: keyof FormErrors): FormErrors {
  if (!errors[key]) {
    return errors;
  }

  const next = { ...errors };
  delete next[key];
  return next;
}

export function AdminActivityForm({
  mode,
  activityId,
  initialValues = EMPTY_FORM,
  onSubmitSuccess,
}: AdminActivityFormProps) {
  const theme = useTheme();
  const { isCompact, isDesktop } = useResponsive();
  const isEditMode = mode === 'edit';
  const useTwoColumns = !isCompact;

  const initialTimes = splitStoredTimeRange(initialValues.time);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialTimes.startTime);
  const [endTime, setEndTime] = useState(initialTimes.endTime);
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

  const isBusy = isSaving || isUploadingImage;
  const errorMessages = useMemo(
    () => Object.values(errors).filter((message): message is string => Boolean(message)),
    [errors],
  );

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
    if (!startTime.trim()) {
      nextErrors.time = REQUIRED_FIELD_ERRORS.time;
    }
    if (endTime.trim() && startTime.trim() && !isEndTimeAfterStart(startTime, endTime)) {
      nextErrors.endTime = 'Sluttiden måste vara efter starttiden.';
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
      setSubmitError('Kontrollera de markerade fälten och försök igen.');
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
      time: combineStoredTimeRange(startTime, endTime),
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

  const rowStyle = useTwoColumns ? styles.row : styles.stack;
  const fieldHalfStyle = useTwoColumns ? styles.fieldHalf : undefined;

  return (
    <ScreenLayout
      title={isEditMode ? 'Redigera aktivitet' : 'Lägg till aktivitet'}
      subtitle={
        isEditMode
          ? 'Uppdatera uppgifterna och spara när du är klar'
          : 'Fyll i sektionerna nedan och spara aktiviteten'
      }
      omitTabInset
      footer={
        <>
          {submitError ? (
            <View
              style={[
                styles.alertBanner,
                CardShadow,
                { backgroundColor: '#FDF2F4', borderColor: theme.favorite },
              ]}>
              <ThemedText type="bodyLarge" themeColor="favorite" style={styles.submitError}>
                {submitError}
              </ThemedText>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isUploadingImage
                ? 'Laddar upp bild'
                : isSaving
                  ? 'Sparar aktivitet'
                  : isEditMode
                    ? 'Spara ändringar'
                    : 'Spara aktivitet'
            }
            disabled={isBusy}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.saveButton,
              CardShadow,
              { backgroundColor: theme.primary },
              (pressed || isBusy) && styles.saveButtonPressed,
              isBusy && styles.saveButtonDisabled,
            ]}>
            {isBusy ? (
              <View style={styles.saveBusyRow}>
                <ActivityIndicator color="#FFFFFF" />
                <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                  {isUploadingImage ? 'Laddar upp bild...' : 'Sparar aktivitet...'}
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="bodyLarge" style={styles.saveButtonText}>
                {isEditMode ? 'Spara ändringar' : 'Spara aktivitet'}
              </ThemedText>
            )}
          </Pressable>
        </>
      }>
      <View style={[styles.form, isDesktop && styles.formDesktop]}>
        <View
          style={[styles.infoBanner, CardShadow]}
          accessibilityRole="text"
          accessibilityLabel="Alla ändringar sparas först när du klickar på Spara aktivitet.">
          <View style={styles.infoIconWrap}>
            <SymbolView
              tintColor="#1B7A4E"
              name={{
                ios: 'checkmark.circle.fill',
                android: 'check_circle',
                web: 'check_circle',
              }}
              size={28}
            />
          </View>
          <ThemedText type="bodyLarge" style={styles.infoText}>
            Alla ändringar sparas först när du klickar på &apos;Spara aktivitet&apos;.
          </ThemedText>
        </View>

        {errorMessages.length > 0 ? (
          <View
            style={[styles.alertBanner, CardShadow, { backgroundColor: '#FDF2F4', borderColor: theme.favorite }]}
            accessibilityRole="alert">
            <ThemedText type="smallBold" themeColor="favorite">
              Saknade eller felaktiga uppgifter
            </ThemedText>
            {errorMessages.map((message) => (
              <ThemedText key={message} type="bodyLarge" themeColor="favorite">
                • {message}
              </ThemedText>
            ))}
          </View>
        ) : null}

        {isBusy ? (
          <View
            style={[styles.statusBanner, CardShadow, { backgroundColor: theme.primaryLight }]}
            accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.primary} size="large" />
            <View style={styles.statusTextWrap}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.statusTitle}>
                {isUploadingImage ? 'Laddar upp bild...' : 'Sparar aktivitet...'}
              </ThemedText>
              <ThemedText type="bodyLarge" themeColor="textSecondary">
                {isUploadingImage
                  ? 'Vänta medan bilden skickas till Firebase Storage.'
                  : 'Vänta medan uppgifterna sparas.'}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <AdminFormSection
          title="Grunduppgifter"
          description="Titel, beskrivning och kategori som syns för deltagarna.">
          <FormField
            label="Titel *"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setErrors((current) => clearError(current, 'title'));
            }}
            error={errors.title}
            placeholder="Till exempel Morgonpromenad"
            autoCapitalize="sentences"
            editable={!isBusy}
          />
          <FormField
            label="Beskrivning *"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              setErrors((current) => clearError(current, 'description'));
            }}
            error={errors.description}
            placeholder="Beskriv aktiviteten"
            multiline
            editable={!isBusy}
          />
          <CategoryDropdown
            value={category}
            onChange={setCategory}
            error={errors.category}
          />
        </AdminFormSection>

        <AdminFormSection
          title="Tid och plats"
          description="Välj datum och tid med kalender och klocka. Sluttid är valfri.">
          <DateTimeField
            label="Datum *"
            mode="date"
            value={date}
            onChange={(value) => {
              setDate(value);
              setErrors((current) => clearError(current, 'date'));
            }}
            error={errors.date}
            placeholder="Välj datum"
          />
          <View style={rowStyle}>
            <View style={fieldHalfStyle}>
              <DateTimeField
                label="Starttid *"
                mode="time"
                value={startTime}
                onChange={(value) => {
                  setStartTime(value);
                  setErrors((current) => clearError(clearError(current, 'time'), 'endTime'));
                }}
                error={errors.time}
                placeholder="Välj starttid"
              />
            </View>
            <View style={fieldHalfStyle}>
              <DateTimeField
                label="Sluttid (valfri)"
                mode="time"
                value={endTime}
                onChange={(value) => {
                  setEndTime(value);
                  setErrors((current) => clearError(current, 'endTime'));
                }}
                error={errors.endTime}
                placeholder="Välj sluttid"
              />
            </View>
          </View>
          <View style={rowStyle}>
            <View style={fieldHalfStyle}>
              <FormField
                label="Plats *"
                value={location}
                onChangeText={(value) => {
                  setLocation(value);
                  setErrors((current) => clearError(current, 'location'));
                }}
                error={errors.location}
                placeholder="Till exempel Stadsparken"
                editable={!isBusy}
              />
            </View>
            <View style={fieldHalfStyle}>
              <FormField
                label="Arrangör *"
                value={organizer}
                onChangeText={(value) => {
                  setOrganizer(value);
                  setErrors((current) => clearError(current, 'organizer'));
                }}
                error={errors.organizer}
                placeholder="Till exempel Seniorföreningen"
                editable={!isBusy}
              />
            </View>
          </View>
          <AddressSearchField
            key={`${activityId ?? 'new'}-${initialValues.address ?? ''}`}
            value={address}
            onChange={(nextAddress) => {
              setAddress(nextAddress);
              setErrors((current) => clearError(current, 'address'));
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
            disabled={isBusy}
          />
        </AdminFormSection>

        <AdminFormSection
          title="Bild"
          description="Välj en tydlig bild. Förhandsvisningen visas direkt när du valt en fil.">
          <AdminActivityImagePicker
            imageUrl={imageUrl}
            localImageUri={localImageUri}
            onImageUrlChange={setImageUrl}
            onLocalImageUriChange={setLocalImageUri}
            disabled={isBusy}
            isUploading={isUploadingImage}
          />
        </AdminFormSection>

        <AdminFormSection
          title="Medlemskap"
          description="Kräv medlemskap om aktiviteten endast är öppen för medlemmar.">
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
            disabled={isBusy}
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
                disabled={isBusy}
              />
              <FormField
                label="Medlemskapets länk"
                value={membershipUrl}
                onChangeText={(value) => {
                  setMembershipUrl(value);
                  setErrors((current) => clearError(current, 'membershipUrl'));
                }}
                error={errors.membershipUrl}
                placeholder="https://example.se/bli-medlem"
                keyboardType="url"
                autoCapitalize="none"
                editable={!isBusy}
              />
            </>
          ) : null}
        </AdminFormSection>

        <AdminFormSection
          title="Anmälan och platser"
          description="Ställ in hur deltagare anmäler sig och om antalet platser är begränsat.">
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
            disabled={isBusy}
          />
          {registrationRequired ? (
            <FormRadioGroup
              label="Anmälningsmetod"
              value={registrationMethod}
              options={REGISTRATION_METHOD_OPTIONS}
              onChange={setRegistrationMethod}
              disabled={isBusy}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'external' ? (
            <FormField
              label="Webbadress för anmälan"
              value={registrationUrl}
              onChangeText={(value) => {
                setRegistrationUrl(value);
                setErrors((current) => clearError(current, 'registrationUrl'));
              }}
              error={errors.registrationUrl}
              placeholder="https://example.se/anmalan"
              keyboardType="url"
              autoCapitalize="none"
              editable={!isBusy}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'phone' ? (
            <FormField
              label="Telefonnummer för anmälan"
              value={registrationPhone}
              onChangeText={(value) => {
                setRegistrationPhone(value);
                setErrors((current) => clearError(current, 'registrationPhone'));
              }}
              error={errors.registrationPhone}
              placeholder="Till exempel 08-123 456 78"
              keyboardType="phone-pad"
              editable={!isBusy}
            />
          ) : null}
          {registrationRequired && registrationMethod === 'email' ? (
            <FormField
              label="E-postadress för anmälan"
              value={registrationEmail}
              onChangeText={(value) => {
                setRegistrationEmail(value);
                setErrors((current) => clearError(current, 'registrationEmail'));
              }}
              error={errors.registrationEmail}
              placeholder="Till exempel anmalan@example.se"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isBusy}
            />
          ) : null}
          <FormCheckbox
            label="Begränsat antal deltagare"
            checked={hasParticipantLimit}
            onChange={(checked) => {
              setHasParticipantLimit(checked);
              if (!checked) {
                setMaxParticipants('');
                setErrors((current) => clearError(current, 'maxParticipants'));
              }
            }}
            disabled={isBusy}
          />
          {hasParticipantLimit ? (
            <FormField
              label="Max antal deltagare"
              value={maxParticipants}
              onChangeText={(value) => {
                setMaxParticipants(value);
                setErrors((current) => clearError(current, 'maxParticipants'));
              }}
              error={errors.maxParticipants}
              placeholder="Till exempel 20"
              keyboardType="number-pad"
              editable={!isBusy}
            />
          ) : null}
        </AdminFormSection>

        {isEditMode && activityId ? <AdminParticipantList activityId={activityId} /> : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.five,
    width: '100%',
  },
  formDesktop: {
    gap: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  stack: {
    gap: Spacing.four,
  },
  fieldHalf: {
    flexGrow: 1,
    flexBasis: 260,
    minWidth: 220,
  },
  alertBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  infoBanner: {
    borderRadius: Radius.xl,
    backgroundColor: '#E8F6EE',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: '#D4EFDF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    color: '#1B7A4E',
    fontWeight: '600',
    lineHeight: 30,
  },
  statusBanner: {
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  statusTextWrap: {
    flex: 1,
    gap: Spacing.one,
  },
  statusTitle: {
    fontWeight: '700',
  },
  submitError: {
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    minHeight: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
  },
  saveBusyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  saveButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  saveButtonDisabled: {
    opacity: 0.8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
