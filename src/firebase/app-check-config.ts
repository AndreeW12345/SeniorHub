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
  isDev: boolean;
  debugToken?: string;
};

/**
 * Selects attestation providers for native App Check.
 * Development uses the debug provider when a token is configured.
 */
export function buildNativeAppCheckProviderConfig(
  options: BuildNativeAppCheckProviderConfigOptions,
): NativeAppCheckProviderConfig {
  const debugToken = options.debugToken?.trim();
  const useDebugProvider = options.isDev && Boolean(debugToken);

  const platformConfig = <TProduction extends string>(
    productionProvider: TProduction,
  ): { provider: 'debug'; debugToken: string | undefined } | { provider: TProduction } =>
    useDebugProvider
      ? {
          provider: 'debug' as const,
          debugToken,
        }
      : {
          provider: productionProvider,
        };

  return {
    android: platformConfig('playIntegrity'),
    apple: platformConfig('appAttestWithDeviceCheckFallback'),
  };
}

/** Reads the runtime debug token used by native App Check in development. */
export function readNativeAppCheckDebugToken(): string | undefined {
  return process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN?.trim() || undefined;
}
