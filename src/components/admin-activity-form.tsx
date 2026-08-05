import { useRouter, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AdminActivityImagePicker } from '@/components/admin-activity-image-picker';
import { AdminFormSection } from '@/components/admin-form-section';
import { CategoryDropdown } from '@/components/category-dropdown';
import { DateTimeField } from '@/components/date-time-field';
import { FormCheckbox } from '@/components/form-checkbox';
import { FormField } from '@/components/form-field';
import { FormRadioGroup } from '@/components/form-radio-group';
import { ScreenLayout } from '@/components/screen-layout';
import { ThemedText } from '@/components/themed-text';
import { type ActivityCategory } from '@/constants/activities';
import {
  DEFAULT_REGISTRATION_METHOD,
  REGISTRATION_METHOD_LABELS,
  REGISTRATION_METHODS,
  type RegistrationMethod,
} from '@/constants/membership';
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_FREQUENCY_LABELS,
  SERIES_EDIT_SCOPE_LABELS,
  type RecurrenceFrequency,
  type RecurrenceRule,
  type SeriesEditScope,
} from '@/constants/recurrence';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useOrganizations } from '@/contexts/organizations-context';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  saveActivityToFirestore,
  updateActivityInFirestore,
  type ActivityFormInput,
} from '@/services/activities';
import { notifyActivityImportantUpdates } from '@/services/announcements';
import { geocodeAddress } from '@/services/geocoding';
import { uploadActivityImage } from '@/services/storage';
import { buildFullAddress } from '@/utils/address-format';
import {
  parseCoordinateInput,
  validateActivityCoordinates,
} from '@/utils/activity-coordinates';
import {
  combineStoredTimeRange,
  isEndTimeAfterStart,
  parseDateValue,
  splitStoredTimeRange,
} from '@/utils/date-time-format';
import { getWeekdayLabel, isSeriesActivity } from '@/utils/recurrence';

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
    | 'street'
    | 'postalCode'
    | 'city'
    | 'address'
    | 'latitude'
    | 'longitude'
    | 'maxParticipants'
    | 'membershipOrganization'
    | 'membershipCustomOrganization'
    | 'membershipUrl'
    | 'registrationUrl'
    | 'registrationPhone'
    | 'registrationEmail'
    | 'recurrenceEndDate'
    | 'recurrenceMaxOccurrences',
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
  /** Present when editing a materialized occurrence in a series. */
  seriesId?: string | null;
  initialRecurrence?: RecurrenceRule | null;
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
  street: '',
  postalCode: '',
  city: '',
  fullAddress: '',
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
  isCancelled: false,
};

const REGISTRATION_METHOD_OPTIONS = REGISTRATION_METHODS.map((method) => ({
  value: method,
  label: REGISTRATION_METHOD_LABELS[method],
}));

const RECURRENCE_FREQUENCY_OPTIONS = RECURRENCE_FREQUENCIES.map((frequency) => ({
  value: frequency,
  label: RECURRENCE_FREQUENCY_LABELS[frequency],
}));

const SERIES_EDIT_SCOPE_OPTIONS = (Object.keys(SERIES_EDIT_SCOPE_LABELS) as SeriesEditScope[]).map(
  (scope) => ({
    value: scope,
    label: SERIES_EDIT_SCOPE_LABELS[scope],
  }),
);

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
  seriesId = null,
  initialRecurrence = null,
  onSubmitSuccess,
}: AdminActivityFormProps) {
  const router = useRouter();
  const theme = useTheme();
  const { adminAccount } = useAuth();
  const { getOrganizationById } = useOrganizations();
  const organizationId = adminAccount?.organizationId?.trim();
  const hostOrganization = getOrganizationById(organizationId);
  const hostOrganizationName = hostOrganization?.name?.trim() || '';
  const { isCompact, isDesktop } = useResponsive();
  const isEditMode = mode === 'edit';
  const useTwoColumns = !isCompact;
  const belongsToSeries = isSeriesActivity({ seriesId });

  const initialTimes = splitStoredTimeRange(initialValues.time);

  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [date, setDate] = useState(initialValues.date);
  const [startTime, setStartTime] = useState(initialTimes.startTime);
  const [endTime, setEndTime] = useState(initialTimes.endTime);
  const [location, setLocation] = useState(initialValues.location);
  const [organizer] = useState(hostOrganizationName || initialValues.organizer);
  const [category, setCategory] = useState<ActivityCategory>(initialValues.category);
  const [imageUrl, setImageUrl] = useState(initialValues.imageUrl ?? '');
  const [latitude, setLatitude] = useState(initialValues.latitude ?? '');
  const [longitude, setLongitude] = useState(initialValues.longitude ?? '');
  const [street, setStreet] = useState(initialValues.street ?? '');
  const [postalCode, setPostalCode] = useState(initialValues.postalCode ?? '');
  const [city, setCity] = useState(initialValues.city ?? '');
  const [fullAddress, setFullAddress] = useState(initialValues.fullAddress ?? '');
  const [registrationRequired, setRegistrationRequired] = useState(
    initialValues.registrationRequired ?? false,
  );
  const [hasParticipantLimit, setHasParticipantLimit] = useState(
    initialValues.hasParticipantLimit ?? false,
  );
  const [maxParticipants, setMaxParticipants] = useState(initialValues.maxParticipants ?? '');
  const [participants] = useState(initialValues.participants ?? 0);
  const [membershipRequired, setMembershipRequired] = useState(
    initialValues.membershipRequired ?? false,
  );
  const [registrationMethod, setRegistrationMethod] = useState<RegistrationMethod>(
    initialValues.registrationMethod ?? DEFAULT_REGISTRATION_METHOD,
  );
  const [registrationUrl, setRegistrationUrl] = useState(initialValues.registrationUrl ?? '');
  const [registrationPhone, setRegistrationPhone] = useState(initialValues.registrationPhone ?? '');
  const [registrationEmail, setRegistrationEmail] = useState(initialValues.registrationEmail ?? '');
  const [isCancelled, setIsCancelled] = useState(initialValues.isCancelled === true);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    initialRecurrence?.frequency ?? 'none',
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(initialRecurrence?.endDate ?? '');
  const [recurrenceMaxOccurrences, setRecurrenceMaxOccurrences] = useState(
    initialRecurrence?.maxOccurrences != null ? String(initialRecurrence.maxOccurrences) : '',
  );
  const [seriesEditScope, setSeriesEditScope] = useState<SeriesEditScope>('occurrence');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isBusy = isSaving || isUploadingImage;
  const isRecurringSelected = !isEditMode && recurrenceFrequency !== 'none';
  const recurrenceHint = useMemo(() => {
    if (!date.trim() || !startTime.trim()) {
      return 'Välj startdatum och starttid – upprepningen följer automatiskt samma veckodag och tid.';
    }

    const weekday = getWeekdayLabel(date);
    const timeLabel = startTime.trim();
    if (!weekday) {
      return 'Upprepningen följer automatiskt startdatumets veckodag och starttid.';
    }

    if (recurrenceFrequency === 'weekly') {
      return `Upprepas varje ${weekday.toLowerCase()} kl. ${timeLabel}.`;
    }
    if (recurrenceFrequency === 'biweekly') {
      return `Upprepas varannan ${weekday.toLowerCase()} kl. ${timeLabel}.`;
    }
    if (recurrenceFrequency === 'monthly') {
      return `Upprepas samma datum varje månad kl. ${timeLabel}.`;
    }

    return '';
  }, [date, recurrenceFrequency, startTime]);
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
    const resolvedOrganizer = hostOrganizationName || organizer.trim();
    if (!resolvedOrganizer) {
      nextErrors.organizer =
        'Organisationen saknar namn. Uppdatera organisationsprofilen under Admin.';
    }
    if (!street.trim()) {
      nextErrors.street = 'Ange gatuadress.';
    }
    if (!postalCode.trim()) {
      nextErrors.postalCode = 'Ange postnummer.';
    }
    if (!city.trim()) {
      nextErrors.city = 'Ange ort.';
    }

    if (hasParticipantLimit && !maxParticipants.trim()) {
      nextErrors.maxParticipants = 'Ange max antal deltagare.';
    }

    if (membershipRequired && hostOrganization && !hostOrganization.membershipUrl?.trim()) {
      nextErrors.membershipUrl =
        'Lägg till medlemslänk i organisationsprofilen innan medlemskap kan krävas.';
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

    if (isRecurringSelected) {
      if (recurrenceEndDate.trim()) {
        const start = parseDateValue(date);
        const end = parseDateValue(recurrenceEndDate);
        if (!end) {
          nextErrors.recurrenceEndDate = 'Ange ett giltigt slutdatum.';
        } else if (start && end.getTime() < start.getTime()) {
          nextErrors.recurrenceEndDate = 'Slutdatum måste vara samma dag eller senare.';
        }
      }

      if (recurrenceMaxOccurrences.trim()) {
        if (!/^\d+$/.test(recurrenceMaxOccurrences.trim())) {
          nextErrors.recurrenceMaxOccurrences = 'Ange ett giltigt antal tillfällen.';
        } else {
          const parsedMax = Number(recurrenceMaxOccurrences.trim());
          if (!Number.isFinite(parsedMax) || parsedMax < 1) {
            nextErrors.recurrenceMaxOccurrences = 'Ange minst 1 tillfälle.';
          }
        }
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

    if (!isEditMode && !organizationId) {
      setSubmitError(
        'Ditt adminkonto saknar organisationskoppling. Aktiviteten kan inte sparas.',
      );
      return;
    }

    setIsSaving(true);

    let nextLatitude = latitude.trim();
    let nextLongitude = longitude.trim();
    let nextFullAddress = fullAddress.trim() || buildFullAddress(street, postalCode, city);

    const initialStreet = (initialValues.street ?? '').trim();
    const initialPostalCode = (initialValues.postalCode ?? '').trim();
    const initialCity = (initialValues.city ?? '').trim();
    const addressChanged =
      street.trim() !== initialStreet ||
      postalCode.trim() !== initialPostalCode ||
      city.trim() !== initialCity;
    const hasExistingCoordinates =
      parseCoordinateInput(nextLatitude) !== null &&
      parseCoordinateInput(nextLongitude) !== null &&
      validateActivityCoordinates(
        parseCoordinateInput(nextLatitude),
        parseCoordinateInput(nextLongitude),
      ) === null;

    if (addressChanged || !hasExistingCoordinates) {
      const geocodeResult = await geocodeAddress({
        street,
        postalCode,
        city,
      });

      if (!geocodeResult.ok) {
        setIsSaving(false);
        setSubmitError(geocodeResult.errorMessage);
        setErrors((current) => ({
          ...current,
          street: geocodeResult.errorMessage,
        }));
        return;
      }

      nextFullAddress = geocodeResult.fullAddress;
      nextLatitude = String(geocodeResult.latitude);
      nextLongitude = String(geocodeResult.longitude);
      setFullAddress(nextFullAddress);
      setLatitude(nextLatitude);
      setLongitude(nextLongitude);
    } else {
      nextFullAddress = buildFullAddress(street, postalCode, city);
      setFullAddress(nextFullAddress);
    }

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
      organizer: hostOrganizationName || organizer.trim(),
      category,
      imageUrl: finalImageUrl,
      latitude: nextLatitude,
      longitude: nextLongitude,
      street: street.trim(),
      postalCode: postalCode.trim(),
      city: city.trim(),
      fullAddress: nextFullAddress,
      address: nextFullAddress,
      registrationRequired,
      hasParticipantLimit,
      maxParticipants: hasParticipantLimit ? maxParticipants : '',
      participants,
      membershipRequired,
      membershipOrganization: '',
      membershipUrl: '',
      registrationMethod: registrationRequired ? registrationMethod : DEFAULT_REGISTRATION_METHOD,
      registrationUrl: registrationRequired && registrationMethod === 'external' ? registrationUrl : '',
      registrationPhone: registrationRequired && registrationMethod === 'phone' ? registrationPhone : '',
      registrationEmail: registrationRequired && registrationMethod === 'email' ? registrationEmail : '',
      isCancelled,
    };

    const result = isEditMode
      ? await updateActivityInFirestore(activityId ?? '', input, {
          scope: belongsToSeries ? seriesEditScope : 'occurrence',
          seriesId: belongsToSeries ? seriesId : null,
        })
      : await saveActivityToFirestore(input, {
          organizationId,
          recurrence:
            recurrenceFrequency === 'none'
              ? null
              : {
                  frequency: recurrenceFrequency,
                  endDate: recurrenceEndDate.trim() || null,
                  maxOccurrences: recurrenceMaxOccurrences.trim()
                    ? Number(recurrenceMaxOccurrences.trim())
                    : null,
                },
        });

    setIsSaving(false);

    if (!result.ok) {
      setSubmitError(result.errorMessage);
      return;
    }

    if (isEditMode && activityId) {
      void notifyActivityImportantUpdates({
        activityId,
        previous: initialValues,
        next: input,
        seriesScope:
          belongsToSeries && seriesEditScope === 'series' && seriesId
            ? { seriesId }
            : null,
      });
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
      showBackButton
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
          description="Välj datum och tid. Fyll i adressen – koordinater hämtas automatiskt vid sparning.">
          <DateTimeField
            label={isRecurringSelected ? 'Startdatum *' : 'Datum *'}
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
              <View style={styles.hostOrganizationField}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Arrangör
                </ThemedText>
                <View
                  style={[
                    styles.hostOrganizationValue,
                    CardShadow,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}>
                  <ThemedText type="bodyLarge">
                    {hostOrganizationName || organizer || 'Hämtas från er organisation'}
                  </ThemedText>
                </View>
                <ThemedText type="bodyLarge" themeColor="textSecondary">
                  Arrangörsnamnet hämtas automatiskt från organisationsprofilen.
                </ThemedText>
                {errors.organizer ? (
                  <ThemedText type="bodyLarge" themeColor="favorite">
                    {errors.organizer}
                  </ThemedText>
                ) : null}
              </View>
            </View>
          </View>

          <ThemedText type="bodyLarge" themeColor="textSecondary">
            Fyll i adressen. Koordinater hämtas automatiskt när du sparar.
          </ThemedText>

          <FormField
            label="Gatuadress *"
            value={street}
            onChangeText={(value) => {
              setStreet(value);
              setErrors((current) => clearError(current, 'street'));
            }}
            error={errors.street}
            placeholder="Till exempel Tyresö centrum 1"
            editable={!isBusy}
          />

          <View style={rowStyle}>
            <View style={fieldHalfStyle}>
              <FormField
                label="Postnummer *"
                value={postalCode}
                onChangeText={(value) => {
                  setPostalCode(value);
                  setErrors((current) => clearError(current, 'postalCode'));
                }}
                error={errors.postalCode}
                placeholder="Till exempel 13540"
                keyboardType="number-pad"
                editable={!isBusy}
              />
            </View>
            <View style={fieldHalfStyle}>
              <FormField
                label="Ort *"
                value={city}
                onChangeText={(value) => {
                  setCity(value);
                  setErrors((current) => clearError(current, 'city'));
                }}
                error={errors.city}
                placeholder="Till exempel Tyresö"
                editable={!isBusy}
              />
            </View>
          </View>

          {fullAddress ? (
            <View style={[styles.selectedAddressCard, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="smallBold" themeColor="primary">
                Sparad adress
              </ThemedText>
              <ThemedText type="bodyLarge" themeColor="primary">
                {fullAddress}
              </ThemedText>
            </View>
          ) : null}
        </AdminFormSection>

        {!isEditMode ? (
          <AdminFormSection
            title="Återkommande"
            description="Skapa en engångsaktivitet eller låt den återkomma automatiskt utifrån startdatum och starttid.">
            <FormRadioGroup
              label="Upprepning"
              value={recurrenceFrequency}
              options={RECURRENCE_FREQUENCY_OPTIONS}
              onChange={(value) => {
                setRecurrenceFrequency(value);
                setErrors((current) =>
                  clearError(clearError(current, 'recurrenceEndDate'), 'recurrenceMaxOccurrences'),
                );
              }}
              disabled={isBusy}
            />

            {isRecurringSelected ? (
              <>
                <ThemedText type="bodyLarge" themeColor="textSecondary">
                  {recurrenceHint}
                </ThemedText>
                <DateTimeField
                  label="Slutdatum (valfritt)"
                  mode="date"
                  value={recurrenceEndDate}
                  onChange={(value) => {
                    setRecurrenceEndDate(value);
                    setErrors((current) => clearError(current, 'recurrenceEndDate'));
                  }}
                  error={errors.recurrenceEndDate}
                  placeholder="Välj slutdatum"
                />
                <FormField
                  label="Max antal tillfällen (valfritt)"
                  value={recurrenceMaxOccurrences}
                  onChangeText={(value) => {
                    setRecurrenceMaxOccurrences(value);
                    setErrors((current) => clearError(current, 'recurrenceMaxOccurrences'));
                  }}
                  error={errors.recurrenceMaxOccurrences}
                  placeholder="Till exempel 12"
                  keyboardType="number-pad"
                  editable={!isBusy}
                />
              </>
            ) : null}
          </AdminFormSection>
        ) : null}

        {isEditMode && belongsToSeries ? (
          <AdminFormSection
            title="Återkommande serie"
            description="Välj om ändringarna ska gälla endast detta tillfälle eller hela serien.">
            <FormRadioGroup
              label="Omfattning"
              value={seriesEditScope}
              options={SERIES_EDIT_SCOPE_OPTIONS}
              onChange={setSeriesEditScope}
              disabled={isBusy}
            />
            {initialRecurrence ? (
              <ThemedText type="bodyLarge" themeColor="textSecondary">
                {RECURRENCE_FREQUENCY_LABELS[initialRecurrence.frequency]}
                {initialRecurrence.endDate ? ` · till ${initialRecurrence.endDate}` : ''}
                {initialRecurrence.maxOccurrences
                  ? ` · max ${initialRecurrence.maxOccurrences} tillfällen`
                  : ''}
              </ThemedText>
            ) : (
              <ThemedText type="bodyLarge" themeColor="textSecondary">
                Detta tillfälle ingår i en återkommande serie.
              </ThemedText>
            )}
          </AdminFormSection>
        ) : null}

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
          description="Om medlemskap krävs används organisationens namn och medlemslänk automatiskt.">
          <FormCheckbox
            label="Medlemskap krävs"
            checked={membershipRequired}
            onChange={(checked) => {
              setMembershipRequired(checked);
              if (!checked) {
                setErrors((current) => ({
                  ...current,
                  membershipUrl: undefined,
                }));
              }
            }}
            disabled={isBusy}
          />
          {membershipRequired ? (
            <View style={[styles.membershipInfoCard, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="bodyLarge" themeColor="primary">
                {hostOrganizationName
                  ? 'Visas som: Endast för medlemmar i organisationen.'
                  : 'Organisationsnamnet hämtas från er organisationsprofil.'}
              </ThemedText>
              <ThemedText type="bodyLarge" themeColor="textSecondary">
                {hostOrganization?.membershipUrl
                  ? 'Medlemsknappen öppnar organisationens medlemslänk.'
                  : 'Lägg till medlemslänk under Organisationsprofil i adminpanelen.'}
              </ThemedText>
              {errors.membershipUrl ? (
                <ThemedText type="bodyLarge" themeColor="favorite">
                  {errors.membershipUrl}
                </ThemedText>
              ) : null}
            </View>
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

        {isEditMode ? (
          <AdminFormSection
            title="Status"
            description="Om aktiviteten ställs in får anmälda deltagare en notis (om de har aktivitetsuppdateringar på).">
            <FormCheckbox
              label="Markera som inställd"
              checked={isCancelled}
              onChange={setIsCancelled}
              disabled={isBusy}
            />
          </AdminFormSection>
        ) : null}

        {isEditMode && activityId ? (
          <AdminFormSection
            title="Deltagare"
            description="Se anmälda deltagare och väntelista för aktiviteten.">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Öppna deltagarsidan"
              onPress={() => router.push(`/admin/participants/${activityId}` as Href)}
              style={({ pressed }) => [
                styles.participantsButton,
                { borderColor: theme.primary, backgroundColor: theme.background },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="bodyLarge" themeColor="primary" style={styles.participantsButtonText}>
                👥 Deltagare
              </ThemedText>
            </Pressable>
          </AdminFormSection>
        ) : null}
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
  participantsButton: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  participantsButtonText: {
    fontWeight: '700',
  },
  selectedAddressCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  hostOrganizationField: {
    gap: Spacing.two,
  },
  hostOrganizationValue: {
    minHeight: 56,
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  membershipInfoCard: {
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.88,
  },
});
