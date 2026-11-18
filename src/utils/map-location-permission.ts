import type { LocationPermissionResponse } from 'expo-location';

export type MapLocationAccessBanner = 'none' | 'denied' | 'settings';

/** Maps foreground location permission to the discrete banner shown on the map tab. */
export function getMapLocationAccessBanner(
  permission: Pick<LocationPermissionResponse, 'granted' | 'canAskAgain'>,
): MapLocationAccessBanner {
  if (permission.granted) {
    return 'none';
  }

  if (permission.canAskAgain === false) {
    return 'settings';
  }

  return 'denied';
}