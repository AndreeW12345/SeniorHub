import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function resolveFirebaseAppIdForPlatform(platform, env) {
  const fallbackAppId = env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() ?? '';

  if (platform === 'ios') {
    const iosAppId = env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID?.trim();
    if (iosAppId) {
      return iosAppId;
    }

    if (fallbackAppId.includes(':ios:')) {
      return fallbackAppId;
    }
  }

  if (platform === 'android') {
    const androidAppId = env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID?.trim();
    if (androidAppId) {
      return androidAppId;
    }

    if (fallbackAppId.includes(':android:')) {
      return fallbackAppId;
    }
  }

  return fallbackAppId;
}

const WEB_APP_ID = '1:559111915490:web:ec23d5eccccd286ac2dbbb';
const IOS_APP_ID = '1:559111915490:ios:eb64d88ebb8ebc54c2dbbb';
const ANDROID_APP_ID = '1:559111915490:android:e0c30c8b1400c74ec2dbbb';

describe('resolveFirebaseAppIdForPlatform', () => {
  it('prefers the iOS app id on iOS when configured', () => {
    assert.equal(
      resolveFirebaseAppIdForPlatform('ios', {
        EXPO_PUBLIC_FIREBASE_APP_ID: WEB_APP_ID,
        EXPO_PUBLIC_FIREBASE_IOS_APP_ID: IOS_APP_ID,
      }),
      IOS_APP_ID,
    );
  });

  it('keeps the web app id on web', () => {
    assert.equal(
      resolveFirebaseAppIdForPlatform('web', {
        EXPO_PUBLIC_FIREBASE_APP_ID: WEB_APP_ID,
        EXPO_PUBLIC_FIREBASE_IOS_APP_ID: IOS_APP_ID,
      }),
      WEB_APP_ID,
    );
  });

  it('prefers the Android app id on Android when configured', () => {
    assert.equal(
      resolveFirebaseAppIdForPlatform('android', {
        EXPO_PUBLIC_FIREBASE_APP_ID: WEB_APP_ID,
        EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID: ANDROID_APP_ID,
      }),
      ANDROID_APP_ID,
    );
  });
});
