import {useCallback, useState} from 'react';
import {Alert, Linking, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

interface Location {
  latitude: number;
  longitude: number;
}

const LOCATION_PERMISSION = Platform.select({
  ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
})!;

const HIGH_ACCURACY_OPTS = {
  enableHighAccuracy: true,
  timeout: 8000,
  maximumAge: 10000,
};
const COARSE_OPTS = {
  enableHighAccuracy: false,
  timeout: 12000,
  maximumAge: 60000,
};

// Session-scoped: once the user has BLOCKED the permission and either
// dismissed or navigated away from the settings prompt, don't re-prompt
// them on every subsequent tap within the same session.
let blockedPromptShownThisSession = false;

function readPosition(
  opts: typeof HIGH_ACCURACY_OPTS | typeof COARSE_OPTS,
): Promise<Location> {
  return new Promise<Location>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error => reject(error),
      opts,
    );
  });
}

async function readPositionWithFallback(): Promise<Location> {
  try {
    return await readPosition(HIGH_ACCURACY_OPTS);
  } catch (err) {
    // High-accuracy often fails indoors (timeout, no GPS fix).
    // Fall back to coarse/network location so the feature still works.
    return await readPosition(COARSE_OPTS);
  }
}

export function useLocation() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    let status = await check(LOCATION_PERMISSION);
    if (status === RESULTS.DENIED) {
      status = await request(LOCATION_PERMISSION);
    }

    const granted = status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    setHasPermission(granted);

    if (!granted && status === RESULTS.BLOCKED && !blockedPromptShownThisSession) {
      blockedPromptShownThisSession = true;
      Alert.alert(
        'Location Permission Blocked',
        'Location access has been blocked. Please enable it in your device settings.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
    }

    return granted;
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Location> => {
    const granted = await requestPermission();
    if (!granted) {
      throw new Error('Location permission not granted');
    }

    setIsLoading(true);
    try {
      return await readPositionWithFallback();
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission]);

  const getCurrentLocationIfAllowed =
    useCallback(async (): Promise<Location | null> => {
      const status = await check(LOCATION_PERMISSION);
      const granted =
        status === RESULTS.GRANTED || status === RESULTS.LIMITED;
      setHasPermission(granted);
      if (!granted) {
        return null;
      }
      try {
        return await readPositionWithFallback();
      } catch {
        return null;
      }
    }, []);

  return {
    getCurrentLocation,
    getCurrentLocationIfAllowed,
    hasPermission,
    requestPermission,
    isLoading,
  };
}
