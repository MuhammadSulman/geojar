import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Linking,
  Platform,
  StyleSheet,
  Animated,
  BackHandler,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {Text, Button, Chip} from 'react-native-paper';
import Share from 'react-native-share';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {Place} from '@/types';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {MapStackParamList, RootStackParamList} from '@/navigation/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';
import {useLocation} from '@/hooks/useLocation';
import {getMapStyle} from '@/constants/mapStyle';
import {useAppTheme, withAlpha, type AppTheme} from '@/constants/theme';
import {useIsDark} from '@/store/themeStore';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<MapStackParamList, 'Map'>,
  NativeStackNavigationProp<RootStackParamList>
>;
type Route = RouteProp<MapStackParamList, 'Map'>;

const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749];
const DEFAULT_ZOOM = 12;

MapLibreGL.setAccessToken(null);

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const focusLat = route.params?.focusLatitude;
  const focusLng = route.params?.focusLongitude;
  const places = usePlacesStore(s => s.places);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.bottom), [theme, insets.bottom]);
  const isDark = useIsDark();
  const mapStyle = useMemo(() => getMapStyle(isDark), [isDark]);

  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%'], []);
  const {getCurrentLocationIfAllowed} = useLocation();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [centerCoords, setCenterCoords] = useState<{
    latitude: number;
    longitude: number;
  }>({latitude: DEFAULT_CENTER[1], longitude: DEFAULT_CENTER[0]});
  const [isDragging, setIsDragging] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const pinTranslateY = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const hasAutoFittedRef = useRef(false);

  const animatePin = useCallback(
    (lifting: boolean) => {
      Animated.parallel([
        Animated.spring(pinTranslateY, {
          toValue: lifting ? -16 : 0,
          useNativeDriver: true,
          friction: 6,
        }),
        Animated.spring(pinScale, {
          toValue: lifting ? 1.15 : 1,
          useNativeDriver: true,
          friction: 6,
        }),
      ]).start();
    },
    [pinTranslateY, pinScale],
  );

  useEffect(() => {
    let cancelled = false;
    getCurrentLocationIfAllowed().then(loc => {
      if (cancelled || !loc) {
        return;
      }
      const coord: [number, number] = [loc.longitude, loc.latitude];
      setUserLocation(coord);
      if (focusLat == null && focusLng == null) {
        setCenterCoords({latitude: loc.latitude, longitude: loc.longitude});
        cameraRef.current?.setCamera({
          centerCoordinate: coord,
          zoomLevel: 15,
          animationDuration: 500,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [focusLat, focusLng, getCurrentLocationIfAllowed]);

  useEffect(() => {
    if (focusLat != null || focusLng != null) {
      return;
    }
    if (hasAutoFittedRef.current || places.length === 0 || !cameraRef.current) {
      return;
    }
    hasAutoFittedRef.current = true;

    if (places.length === 1) {
      cameraRef.current.setCamera({
        centerCoordinate: [places[0].longitude, places[0].latitude],
        zoomLevel: 14,
        animationDuration: 500,
      });
      return;
    }

    const lngs = places.map(p => p.longitude);
    const lats = places.map(p => p.latitude);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const boundsAreDegenerate =
      Math.abs(maxLng - minLng) < 1e-6 && Math.abs(maxLat - minLat) < 1e-6;
    if (boundsAreDegenerate) {
      cameraRef.current.setCamera({
        centerCoordinate: [lngs[0], lats[0]],
        zoomLevel: 14,
        animationDuration: 500,
      });
    } else {
      cameraRef.current.fitBounds(
        [maxLng, maxLat],
        [minLng, minLat],
        60,
        500,
      );
    }
  }, [places, focusLat, focusLng]);

  // React to a shared / deep-linked location: center camera and align the
  // floating pin so "Save This Location" saves the shared coords.
  useEffect(() => {
    if (focusLat == null || focusLng == null) {
      return;
    }
    setCenterCoords({latitude: focusLat, longitude: focusLng});
    cameraRef.current?.setCamera({
      centerCoordinate: [focusLng, focusLat],
      zoomLevel: 16,
      animationDuration: 600,
    });
  }, [focusLat, focusLng]);

  // Android hardware back: if the place details sheet is open, close it
  // instead of popping the screen off the stack.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isSheetOpen) {
          bottomSheetRef.current?.close();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [isSheetOpen]),
  );

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleRegionIsChanging = () => {
    if (!isDragging) {
      setIsDragging(true);
      animatePin(true);
    }
  };

  const handleRegionDidChange = async () => {
    setIsDragging(false);
    animatePin(false);
    if (mapRef.current) {
      const center = await mapRef.current.getCenter();
      setCenterCoords({longitude: center[0], latitude: center[1]});
    }
  };

  const handleSavePin = () => {
    bottomSheetRef.current?.close();
    navigation.navigate('AddPlace', {
      latitude: centerCoords.latitude,
      longitude: centerCoords.longitude,
    });
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

  const handleShare = useCallback(async () => {
    if (!selectedPlace) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${selectedPlace.latitude},${selectedPlace.longitude}`;
    const lines = [`📍 ${selectedPlace.name}`];
    if (selectedPlace.note) {
      lines.push(selectedPlace.note);
    }
    lines.push(url);
    try {
      await Share.open({
        title: selectedPlace.name,
        message: lines.join('\n'),
        failOnCancel: false,
      });
    } catch {
      // user cancelled or share failed silently
    }
  }, [selectedPlace]);

  const selectedCategory = selectedPlace
    ? CATEGORIES.find(c => c.name === selectedPlace.category)
    : null;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={mapStyle}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFailLoadingMap={() => setMapLoadFailed(true)}
        onDidFinishLoadingMap={() => setMapLoadFailed(false)}
        onRegionIsChanging={handleRegionIsChanging}
        onRegionDidChange={handleRegionDidChange}>
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate:
              focusLat != null && focusLng != null
                ? [focusLng, focusLat]
                : DEFAULT_CENTER,
            zoomLevel: focusLat != null ? 16 : DEFAULT_ZOOM,
          }}
        />
        {userLocation && (
          <MapLibreGL.PointAnnotation
            id="user-location"
            coordinate={userLocation}>
            <View style={styles.userDotOuter}>
              <View style={styles.userDotInner} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}
        {places.map(place => {
          const cat = CATEGORIES.find(c => c.name === place.category);
          const pinColor = cat?.color ?? theme.appColors.primary;
          return (
            <MapLibreGL.PointAnnotation
              key={place.id}
              id={place.id}
              coordinate={[place.longitude, place.latitude]}
              onSelected={() => handleMarkerPress(place)}>
              <View style={styles.markerContainer}>
                <View style={[styles.placeMarker, {backgroundColor: pinColor}]}>
                  <Text style={styles.placeMarkerEmoji}>{place.emoji}</Text>
                </View>
                <View style={[styles.markerTail, {borderTopColor: pinColor}]} />
              </View>
              <MapLibreGL.Callout title={place.name} />
            </MapLibreGL.PointAnnotation>
          );
        })}
      </MapLibreGL.MapView>

      <View style={styles.centerPinWrapper} pointerEvents="none">
        <Animated.View
          style={[
            styles.centerPin,
            {
              transform: [{translateY: pinTranslateY}, {scale: pinScale}],
            },
          ]}>
          <View style={styles.pinHead}>
            <Text style={styles.pinIcon}>📍</Text>
          </View>
        </Animated.View>
      </View>

      <View style={styles.coordBadge}>
        <Text style={styles.coordText}>
          {centerCoords.latitude.toFixed(5)},{' '}
          {centerCoords.longitude.toFixed(5)}
        </Text>
      </View>

      {mapLoadFailed && (
        <View style={styles.mapErrorBanner}>
          <Text style={styles.mapErrorText}>
            Map tiles failed to load. Check your connection.
          </Text>
        </View>
      )}

      <View style={styles.saveBar}>
        <Text style={styles.saveHint}>Drag the map to move the pin</Text>
        <Button
          mode="contained"
          onPress={handleSavePin}
          buttonColor={theme.appColors.primary}
          style={styles.saveBtn}
          icon="content-save-outline">
          Save This Location
        </Button>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={index => setIsSheetOpen(index >= 0)}
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
                    {backgroundColor: withAlpha(selectedCategory.color, 0.2)},
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
                  buttonColor={theme.appColors.primary}>
                  Detail
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleGetDirections}
                  style={styles.sheetBtn}
                  textColor={theme.appColors.primary}>
                  Directions
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleShare}
                  style={styles.sheetBtn}
                  icon="share-variant"
                  textColor={theme.appColors.primary}>
                  Share
                </Button>
              </View>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const makeStyles = (t: AppTheme, bottomInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    map: {
      flex: 1,
    },
    centerPinWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    centerPin: {
      alignItems: 'center',
    },
    pinHead: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pinIcon: {
      fontSize: 32,
    },
    coordBadge: {
      position: 'absolute',
      top: 52,
      alignSelf: 'center',
      backgroundColor: withAlpha(t.appColors.surface, 0.93),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      elevation: 4,
    },
    coordText: {
      color: t.appColors.onSurface,
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    mapErrorBanner: {
      position: 'absolute',
      top: 96,
      left: 16,
      right: 16,
      backgroundColor: withAlpha(t.appColors.error, 0.92),
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      elevation: 6,
    },
    mapErrorText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
    },
    userDotOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(66, 133, 244, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    userDotInner: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#4285F4',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    markerContainer: {
      alignItems: 'center',
    },
    placeMarker: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    placeMarkerEmoji: {
      fontSize: 16,
    },
    markerTail: {
      width: 0,
      height: 0,
      marginTop: -2,
      borderLeftWidth: 5,
      borderRightWidth: 5,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    saveBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: t.appColors.surface,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Math.max(bottomInset, 16),
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -3},
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    saveHint: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 12,
      textAlign: 'center',
      marginBottom: 8,
    },
    saveBtn: {
      borderRadius: 12,
    },
    sheetBackground: {
      backgroundColor: t.appColors.surface,
    },
    sheetHandle: {
      backgroundColor: t.appColors.onSurfaceMuted,
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
      color: t.appColors.onSurface,
      marginBottom: 8,
    },
    sheetChip: {
      marginBottom: 10,
    },
    sheetNote: {
      color: t.appColors.onSurfaceMuted,
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
