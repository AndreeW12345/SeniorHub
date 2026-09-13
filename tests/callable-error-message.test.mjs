import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FirebaseError } from 'firebase/app';

function isAppCheckFailure(error) {
  const code = error.code ?? '';
  const message = error.message ?? '';

  return (
    code.includes('app-check') ||
    message.includes('App attestation failed') ||
    message.includes('App Check') ||
    (code === 'functions/permission-denied' && message.includes('PERMISSION_DENIED'))
  );
}

function readCallableErrorMessage(error) {
  if (error instanceof FirebaseError) {
    const code = error.code ?? '';
    const message = error.message?.trim() ?? '';

    if (isAppCheckFailure(error)) {
      return 'App Check kunde inte verifieras. Registrera debug-token i Firebase Console och starta om appen.';
    }

    if (code === 'functions/unauthenticated' || message === 'Unauthenticated') {
      return 'Du måste vara inloggad för att fortsätta. Logga in och försök igen.';
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    const message = error.message.trim();

    if (message.includes('App attestation failed') || message.includes('App Check')) {
      return 'App Check kunde inte verifieras. Registrera debug-token i Firebase Console och starta om appen.';
    }

    return message;
  }

  return 'Kunde inte slutföra begäran. Försök igen.';
}

describe('readCallableErrorMessage', () => {
  it('maps App Check attestation failures to a clear message', () => {
    const error = new FirebaseError('functions/permission-denied', 'App attestation failed.');
    assert.match(readCallableErrorMessage(error), /App Check kunde inte verifieras/);
  });

  it('maps unauthenticated callable errors to a login message', () => {
    const error = new FirebaseError('functions/unauthenticated', 'Unauthenticated');
    assert.match(readCallableErrorMessage(error), /inloggad/);
  });
});
