import type { ConfigContext, ExpoConfig } from 'expo/config';

function getFirebaseHostingLinkDomain(): string | undefined {
  const hostingDomain = process.env.EXPO_PUBLIC_FIREBASE_HOSTING_DOMAIN?.trim();
  if (hostingDomain) {
    return hostingDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (projectId) {
    return `${projectId}.web.app`;
  }

  return undefined;
}

function withExpoRouterOrigin(
  plugins: ExpoConfig['plugins'],
  hostingDomain: string | undefined,
): ExpoConfig['plugins'] {
  if (!hostingDomain || !plugins) {
    return plugins;
  }

  const origin = `https://${hostingDomain}`;

  return plugins.map((plugin) => {
    if (plugin === 'expo-router') {
      return ['expo-router', { origin }];
    }

    if (Array.isArray(plugin) && plugin[0] === 'expo-router') {
      return [
        'expo-router',
        {
          ...(typeof plugin[1] === 'object' && plugin[1] !== null ? plugin[1] : {}),
          origin,
        },
      ];
    }

    return plugin;
  });
}

/** Web hosting export only — set by scripts/build-hosting.mjs. Native builds omit this. */
function getWebBaseUrl(): string | undefined {
  const configured = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim();
  if (!configured) {
    return undefined;
  }

  const normalized = configured.replace(/\/$/, '');
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const hostingDomain = getFirebaseHostingLinkDomain();
  const webBaseUrl = getWebBaseUrl();
  const existingIntentFilters = config.android?.intentFilters ?? [];

  const firebaseAppLinkFilter = hostingDomain
    ? {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: hostingDomain,
            pathPrefix: '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      }
    : null;

  return {
    ...config,
    ios: {
      ...config.ios,
      ...(hostingDomain
        ? {
            associatedDomains: [`applinks:${hostingDomain}`],
          }
        : {}),
    },
    android: {
      ...config.android,
      intentFilters: [
        ...existingIntentFilters,
        ...(firebaseAppLinkFilter ? [firebaseAppLinkFilter] : []),
      ],
    },
    plugins: withExpoRouterOrigin(config.plugins, hostingDomain),
    experiments: {
      ...config.experiments,
      ...(webBaseUrl ? { baseUrl: webBaseUrl } : {}),
    },
  };
};
