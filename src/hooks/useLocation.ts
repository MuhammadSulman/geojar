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

    if (!granted && status === RESULTS.BLOCKED) {
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
    return new Promise<Location>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          setIsLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          setIsLoading(false);
          reject(error);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  }, [requestPermission]);

  return {getCurrentLocation, hasPermission, requestPermission, isLoading};
}
