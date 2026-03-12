import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Pressable,
  Linking,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  MapPressEvent,
  Region,
} from 'react-native-maps';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {Text, Button, Chip} from 'react-native-paper';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {Place} from '@/types';
import type {MapStackParamList} from '@/navigation/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';

type Nav = NativeStackNavigationProp<MapStackParamList, 'Map'>;

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const places = usePlacesStore(s => s.places);
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  useEffect(() => {
    if (places.length > 0 && mapRef.current) {
      const coords = places.map(p => ({
        latitude: p.latitude,
        longitude: p.longitude,
      }));
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: {top: 60, right: 60, bottom: 60, left: 60},
        animated: true,
      });
    }
  }, [places]);

  const requestLocationPermission = async (): Promise<boolean> => {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
    if (!permission) {
      return false;
    }
    let status = await check(permission);
    if (status === RESULTS.DENIED) {
      status = await request(permission);
    }
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true;
    }
    Alert.alert(
      'Location Permission Required',
      'Please enable location access in Settings.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
    );
    return false;
  };

  const handleMyLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      return;
    }
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
      },
      error => Alert.alert('Location Error', error.message),
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleToggleMapType = () => {
    setMapType(prev => (prev === 'standard' ? 'satellite' : 'standard'));
  };

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleLongPress = (e: MapPressEvent) => {
    const {latitude, longitude} = e.nativeEvent.coordinate;
    navigation.navigate('AddPlace', {latitude, longitude});
  };

  const handleGetDirections = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    const {latitude, longitude} = selectedPlace;
    const nativeUrl =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

    Linking.canOpenURL(nativeUrl).then(supported => {
      Linking.openURL(supported ? nativeUrl : webUrl);
    });
  }, [selectedPlace]);

  const handleViewDetail = useCallback(() => {
    if (!selectedPlace) {
      return;
    }
    bottomSheetRef.current?.close();
    navigation.navigate('PlaceDetail', {placeId: selectedPlace.id});
  }, [selectedPlace, navigation]);

  const selectedCategory = selectedPlace
    ? CATEGORIES.find(c => c.name === selectedPlace.category)
    : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton={false}
        onLongPress={handleLongPress}>
        {places.map(place => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}
            onPress={() => handleMarkerPress(place)}>
            <View style={styles.marker}>
              <Text style={styles.markerEmoji}>{place.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top-right button strip */}
      <View style={styles.buttonStrip}>
        <Pressable style={styles.mapBtn} onPress={handleMyLocation}>
          <Text style={styles.mapBtnText}>📡</Text>
        </Pressable>
        <Pressable style={styles.mapBtn} onPress={handleToggleMapType}>
          <Text style={styles.mapBtnText}>
            {mapType === 'standard' ? '🛰' : '🗺'}
          </Text>
        </Pressable>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}>
        <BottomSheetView style={styles.sheetContent}>
          {selectedPlace && (
            <>
              <Text style={styles.sheetEmoji}>{selectedPlace.emoji}</Text>
              <Text variant="titleLarge" style={styles.sheetName}>
                {selectedPlace.name}
              </Text>
              {selectedCategory && (
                <Chip
                  style={[
                    styles.sheetChip,
                    {backgroundColor: selectedCategory.color + '33'},
                  ]}
                  textStyle={{color: selectedCategory.color}}>
                  {selectedCategory.emoji} {selectedCategory.name}
                </Chip>
              )}
              {selectedPlace.note ? (
                <Text
                  variant="bodyMedium"
                  style={styles.sheetNote}
                  numberOfLines={2}>
                  {selectedPlace.note}
                </Text>
              ) : null}
              <View style={styles.sheetButtons}>
                <Button
                  mode="contained"
                  onPress={handleViewDetail}
                  style={styles.sheetBtn}
                  buttonColor="#16A34A">
                  View Detail
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleGetDirections}
                  style={styles.sheetBtn}
                  textColor="#16A34A">
                  Get Directions
                </Button>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerEmoji: {
    fontSize: 20,
  },
  buttonStrip: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 10,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2230',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mapBtnText: {
    fontSize: 20,
  },
  sheetBackground: {
    backgroundColor: '#1E2230',
  },
  sheetHandle: {
    backgroundColor: '#7B82A0',
  },
  sheetContent: {
    padding: 20,
    alignItems: 'center',
  },
  sheetEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  sheetName: {
    color: '#F0F2F8',
    marginBottom: 8,
  },
  sheetChip: {
    marginBottom: 10,
  },
  sheetNote: {
    color: '#7B82A0',
    textAlign: 'center',
    marginBottom: 16,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  sheetBtn: {
    flex: 1,
  },
});
