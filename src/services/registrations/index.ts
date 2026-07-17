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
  submitWaitlistRegistration,
  type SubmitWaitlistRegistrationInput,
  type SubmitWaitlistRegistrationResult,
} from '@/services/registrations/submit-waitlist-registration';
export {
  cancelActivityRegistration,
  type CancelActivityRegistrationResult,
} from '@/services/registrations/cancel-activity-registration';
export { leaveWaitlistRegistration } from '@/services/registrations/leave-waitlist-registration';
export {
  promoteNextWaitlistRegistration,
  type PromoteNextWaitlistResult,
} from '@/services/registrations/promote-next-waitlist-registration';
export { subscribeActivityRegistrations } from '@/services/registrations/subscribe-activity-registrations';
export { mapRegistrationDocument } from '@/services/registrations/map-registration-document';
