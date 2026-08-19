# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Cursor Cloud specific instructions

SeniorHub is an Expo SDK 57 app (React Native + web, `expo-router`) named `seniorhub`, plus an
optional Firebase backend (`functions/` Cloud Functions + Hosting). On the headless cloud VM there
are no iOS/Android emulators, so the **web** target is the only interactive surface.

- Run the app (dev): `npm run web` (i.e. `npx expo start --web`). It serves on `http://localhost:8081`.
  Standard scripts live in `package.json`.
- Firebase connectivity: the client reads a **real** Firebase project from `EXPO_PUBLIC_FIREBASE_*`
  env vars in `.env` (copy `.env.example`). There is **no Firebase emulator wiring in the client**
  (`src/firebase/config.ts` has no `connect*Emulator` calls, and `firebase.json` has no `emulators`
  block). Without `.env`, `isFirebaseConfigured()` is false and the app falls back to local sample
  data (`src/constants/sample-activities.ts`); the web UI still renders fully and local features
  (e.g. Favorites via AsyncStorage) work, so the UI is testable without any secrets. Auth/Firestore/
  Storage-backed flows (login, real bookings) require a real project.
- Dev-mode gotcha: the first navigation to a given route shows a dark Expo splash (dark-blue screen
  with the Expo logo) for several seconds while Metro bundles that route — this is normal loading,
  not a crash. Wait for it to finish before judging a page.
- Lint: `npm run lint` (`expo lint`). Note the repo currently has pre-existing lint errors; do not
  assume a clean baseline.
- Tests: there is no automated test suite (no Jest configured).
- Type-checking: there is no `typecheck` script. Running raw `npx tsc --noEmit` at the root reports a
  false `@/global.css` side-effect import error because Metro (not tsc) resolves CSS imports — use
  `expo lint` as the static check instead.
- Functions (optional; Node 20 engine): build with `npm --prefix functions run build` (tsc), lint
  with `npm --prefix functions run lint` (`tsc --noEmit`). The local Functions emulator
  (`cd functions && npm run serve`) and any deploy require Firebase auth and are not needed for web
  UI testing.
