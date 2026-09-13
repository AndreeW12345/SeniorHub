import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function buildNativeAppCheckProviderConfig({ useDebugProvider, debugToken }) {
  const normalizedDebugToken = debugToken?.trim();

  const platformConfig = (productionProvider) =>
    useDebugProvider
      ? {
          provider: 'debug',
          ...(normalizedDebugToken ? { debugToken: normalizedDebugToken } : {}),
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
      buildNativeAppCheckProviderConfig({ useDebugProvider: false, debugToken: 'debug-token' }),
      {
        android: { provider: 'playIntegrity' },
        apple: { provider: 'appAttestWithDeviceCheckFallback' },
      },
    );
  });

  it('uses debug provider in development when a debug token is configured', () => {
    assert.deepEqual(
      buildNativeAppCheckProviderConfig({ useDebugProvider: true, debugToken: '  debug-token  ' }),
      {
        android: { provider: 'debug', debugToken: 'debug-token' },
        apple: { provider: 'debug', debugToken: 'debug-token' },
      },
    );
  });

  it('uses debug provider in development without a preconfigured debug token', () => {
    assert.deepEqual(
      buildNativeAppCheckProviderConfig({ useDebugProvider: true, debugToken: '' }),
      {
        android: { provider: 'debug' },
        apple: { provider: 'debug' },
      },
    );
  });
});
