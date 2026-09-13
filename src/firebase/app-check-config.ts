export type NativeAndroidAppCheckProvider = 'debug' | 'playIntegrity';
export type NativeAppleAppCheckProvider = 'debug' | 'appAttestWithDeviceCheckFallback';

export type NativeAndroidAppCheckPlatformConfig = {
  provider: NativeAndroidAppCheckProvider;
  debugToken?: string;
};

export type NativeAppleAppCheckPlatformConfig = {
  provider: NativeAppleAppCheckProvider;
  debugToken?: string;
};

export type NativeAppCheckProviderConfig = {
  android: NativeAndroidAppCheckPlatformConfig;
  apple: NativeAppleAppCheckPlatformConfig;
};

type BuildNativeAppCheckProviderConfigOptions = {
  useDebugProvider: boolean;
  debugToken?: string;
};

/**
 * Selects attestation providers for native App Check.
 * Development uses the debug provider (register the logged token in Firebase Console).
 */
export function buildNativeAppCheckProviderConfig(
  options: BuildNativeAppCheckProviderConfigOptions,
): NativeAppCheckProviderConfig {
  const debugToken = options.debugToken?.trim();
  const useDebugProvider = options.useDebugProvider;

  const platformConfig = <TProduction extends string>(
    productionProvider: TProduction,
  ):
    | { provider: 'debug'; debugToken?: string }
    | { provider: TProduction } =>
    useDebugProvider
      ? {
          provider: 'debug' as const,
          ...(debugToken ? { debugToken } : {}),
        }
      : {
          provider: productionProvider,
        };

  return {
    android: platformConfig('playIntegrity'),
    apple: platformConfig('appAttestWithDeviceCheckFallback'),
  };
}

export { readNativeAppCheckDebugToken } from '@/firebase/app-check-runtime';
