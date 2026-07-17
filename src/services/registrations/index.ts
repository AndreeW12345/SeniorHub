export {
  fetchActivityRegistrations,
  createActivityRegistration,
  type CreateRegistrationInput,
  type RegistrationMutationResult,
} from '@/services/registrations/fetch-registrations';
export { countActivityRegistrations } from '@/services/registrations/count-registrations';
export {
  submitActivityRegistration,
  type SubmitActivityRegistrationInput,
  type SubmitActivityRegistrationResult,
} from '@/services/registrations/submit-activity-registration';
export {
  cancelActivityRegistration,
  type CancelActivityRegistrationResult,
} from '@/services/registrations/cancel-activity-registration';
export { mapRegistrationDocument } from '@/services/registrations/map-registration-document';
