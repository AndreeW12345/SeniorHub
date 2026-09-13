import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * True when native App Check should use the debug provider.
 * EAS development clients remain StoreClient even if the embedded bundle sets __DEV__ false.
 */
export function isNativeAppCheckDevelopmentRuntime(): boolean {
  if (Platform.OS === 'web') {
    return __DEV__;
  }

  if (__DEV__) {
    return true;
  }

  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** Reads the App Check debug token from Expo or native build env vars. */
export function readNativeAppCheckDebugToken(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim() ||
    process.env.FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim() ||
    undefined
  );
}

/** Mirrors web App Check debug setup for native development runtimes. */
export function configureNativeAppCheckDebugTokenGlobal(): void {
  if (!isNativeAppCheckDevelopmentRuntime()) {
    return;
  }

  const debugToken = readNativeAppCheckDebugToken();
  if (!debugToken) {
    return;
  }

  (globalThis as Record<string, unknown>).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}
