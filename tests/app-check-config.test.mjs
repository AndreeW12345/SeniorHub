import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function buildNativeAppCheckProviderConfig({ isDev, debugToken }) {
  const normalizedDebugToken = debugToken?.trim();
  const useDebugProvider = isDev && Boolean(normalizedDebugToken);

  const platformConfig = (productionProvider) =>
    useDebugProvider
      ? {
          provider: 'debug',
          debugToken: normalizedDebugToken,
        }
      : {
          provider: productionProvider,
        };

  return {
    android: platformConfig('playIntegrity'),
    apple: platformConfig('appAttestWithDeviceCheckFallback'),
  };
}

describe('native App Check provider config', () => {
  it('uses production attestation providers in release builds', () => {
    assert.deepEqual(
      buildNativeAppCheckProviderConfig({ isDev: false, debugToken: 'debug-token' }),
      {
        android: { provider: 'playIntegrity' },
        apple: { provider: 'appAttestWithDeviceCheckFallback' },
      },
    );
  });

  it('uses debug provider in development when a debug token is configured', () => {
    assert.deepEqual(
      buildNativeAppCheckProviderConfig({ isDev: true, debugToken: '  debug-token  ' }),
      {
        android: { provider: 'debug', debugToken: 'debug-token' },
        apple: { provider: 'debug', debugToken: 'debug-token' },
      },
    );
  });

  it('falls back to production providers in development without a debug token', () => {
    assert.deepEqual(
      buildNativeAppCheckProviderConfig({ isDev: true, debugToken: '' }),
      {
        android: { provider: 'playIntegrity' },
        apple: { provider: 'appAttestWithDeviceCheckFallback' },
      },
    );
  });
});
