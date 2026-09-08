import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ANDROID_PACKAGE = 'com.andreew12345.seniorhub';
const IOS_BUNDLE_ID = 'com.andreew12345.seniorhub';

const REQUIRED_ENV_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  const env = { ...process.env };

  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      env[key] = value;
    }
  } catch {
    // EAS Build injects env vars directly; .env is optional locally.
  }

  return env;
}

function resolvePlatformAppId(env, platform) {
  const platformKey =
    platform === 'android'
      ? 'EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID'
      : 'EXPO_PUBLIC_FIREBASE_IOS_APP_ID';
  const platformAppId = env[platformKey]?.trim();
  if (platformAppId) {
    return platformAppId;
  }

  const fallbackAppId = env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim();
  if (!fallbackAppId) {
    return undefined;
  }

  const marker = platform === 'android' ? ':android:' : ':ios:';
  if (fallbackAppId.includes(marker)) {
    return fallbackAppId;
  }

  return undefined;
}

function buildGoogleServicesJson(env) {
  const androidAppId = resolvePlatformAppId(env, 'android');
  if (!androidAppId) {
    throw new Error(
      'Missing Android Firebase app id. Set EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID or EXPO_PUBLIC_FIREBASE_APP_ID with an :android: suffix.',
    );
  }

  return {
    project_info: {
      project_number: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      project_id: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storage_bucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    },
    client: [
      {
        client_info: {
          mobilesdk_app_id: androidAppId,
          android_client_info: {
            package_name: ANDROID_PACKAGE,
          },
        },
        oauth_client: [],
        api_key: [
          {
            current_key: env.EXPO_PUBLIC_FIREBASE_API_KEY,
          },
        ],
        services: {
          appinvite_service: {
            other_platform_oauth_client: [],
          },
        },
      },
    ],
    configuration_version: '1',
  };
}

function buildGoogleServiceInfoPlist(env) {
  const iosAppId = resolvePlatformAppId(env, 'ios');
  if (!iosAppId) {
    throw new Error(
      'Missing iOS Firebase app id. Set EXPO_PUBLIC_FIREBASE_IOS_APP_ID or EXPO_PUBLIC_FIREBASE_APP_ID with an :ios: suffix.',
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>API_KEY</key>
  <string>${env.EXPO_PUBLIC_FIREBASE_API_KEY}</string>
  <key>GCM_SENDER_ID</key>
  <string>${env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}</string>
  <key>PLIST_VERSION</key>
  <string>1</string>
  <key>BUNDLE_ID</key>
  <string>${IOS_BUNDLE_ID}</string>
  <key>PROJECT_ID</key>
  <string>${env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}</string>
  <key>STORAGE_BUCKET</key>
  <string>${env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}</string>
  <key>IS_ADS_ENABLED</key>
  <false></false>
  <key>IS_ANALYTICS_ENABLED</key>
  <false></false>
  <key>IS_APPINVITE_ENABLED</key>
  <true></true>
  <key>IS_GCM_ENABLED</key>
  <true></true>
  <key>IS_SIGNIN_ENABLED</key>
  <true></true>
  <key>GOOGLE_APP_ID</key>
  <string>${iosAppId}</string>
</dict>
</plist>
`;
}

function parsePlatformArg(argv) {
  const platformIndex = argv.indexOf('--platform');
  if (platformIndex === -1) {
    return undefined;
  }

  const platform = argv[platformIndex + 1];
  if (platform !== 'android' && platform !== 'ios') {
    throw new Error(`Unsupported --platform value: ${platform ?? '(missing)'}`);
  }

  return platform;
}

function main() {
  const platform = parsePlatformArg(process.argv.slice(2));

  const env = loadEnvFile();
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required Firebase env vars: ${missing.join(', ')}`);
  }

  const googleServicesPath = resolve(process.cwd(), 'google-services.json');
  const googleServiceInfoPath = resolve(process.cwd(), 'GoogleService-Info.plist');

  if (!platform || platform === 'android') {
    writeFileSync(googleServicesPath, `${JSON.stringify(buildGoogleServicesJson(env), null, 2)}\n`, 'utf8');
    console.log(`Wrote ${googleServicesPath}`);
  }

  if (!platform || platform === 'ios') {
    writeFileSync(googleServiceInfoPath, buildGoogleServiceInfoPlist(env), 'utf8');
    console.log(`Wrote ${googleServiceInfoPath}`);
  }
}

main();
