import type { Persistence } from 'firebase/auth';

// The public `firebase/auth` type definitions resolve to the web build, which
// does not expose `getReactNativePersistence`. The React Native build of the
// package (used by Expo on iOS/Android) does export it at runtime, so we augment
// the module here to keep the native persistence setup type-safe.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
