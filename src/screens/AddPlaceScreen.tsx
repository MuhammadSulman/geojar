import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Pressable,
} from 'react-native';
import {TextInput, Button, Text, Chip} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {HomeStackParamList} from '@/navigation/types';
import type {CategoryName} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';
import {useAppTheme, type AppTheme} from '@/constants/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'AddPlace'>;
type Route = RouteProp<HomeStackParamList, 'AddPlace'>;

const EMOJI_LIST = [
  '📍', '⭐', '🏠', '🏢', '🏥', '🏫', '🏪', '🏬',
  '☕', '🍔', '🍕', '🍜', '🌮', '🍦', '🎂', '🥗',
  '🌳', '⛰️', '🏖️', '🌊', '🎾', '🎭', '🎵', '❤️',
];

interface FormErrors {
  name?: string;
  category?: string;
  emoji?: string;
  latitude?: string;
  longitude?: string;
}

export default function AddPlaceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const addPlace = usePlacesStore(s => s.addPlace);
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryName | null>(null);
  const [emoji, setEmoji] = useState<string>('📍');
  const [latitude, setLatitude] = useState(
    route.params?.latitude?.toString() ?? '',
  );
  const [longitude, setLongitude] = useState(
    route.params?.longitude?.toString() ?? '',
  );
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validate = useCallback((): boolean => {
    const e: FormErrors = {};

    if (!name.trim()) {
      e.name = 'Place name is required';
    }
    if (!category) {
      e.category = 'Select a category';
    }
    if (!emoji) {
      e.emoji = 'Select an emoji';
    }

    const lat = parseFloat(latitude);
    if (!latitude.trim() || isNaN(lat)) {
      e.latitude = 'Latitude is required';
    } else if (lat < -90 || lat > 90) {
      e.latitude = 'Must be between -90 and 90';
    }

    const lng = parseFloat(longitude);
    if (!longitude.trim() || isNaN(lng)) {
      e.longitude = 'Longitude is required';
    } else if (lng < -180 || lng > 180) {
      e.longitude = 'Must be between -180 and 180';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, category, emoji, latitude, longitude]);

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
      'Please enable location access in Settings to use this feature.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Open Settings', onPress: () => Linking.openSettings()},
      ],
    );
    return false;
  };

  const handleUseMyLocation = async () => {
    const granted = await requestLocationPermission();
    if (!granted) {
      return;
    }

    setIsLocating(true);
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setErrors(prev => ({
          ...prev,
          latitude: undefined,
          longitude: undefined,
        }));
        setIsLocating(false);
      },
      error => {
        setIsLocating(false);
        Alert.alert('Location Error', error.message);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await addPlace({
        name: name.trim(),
        category: category!,
        emoji,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        note: note.trim() || undefined,
        isFavorite: false,
      });

      ReactNativeHapticFeedback.trigger('notificationSuccess');
      Alert.alert('Success', 'Place saved!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save place. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderEmojiItem = ({item}: {item: string}) => (
    <Pressable
      style={[styles.emojiCell, item === emoji && styles.emojiCellSelected]}
      onPress={() => {
        setEmoji(item);
        setErrors(prev => ({...prev, emoji: undefined}));
      }}>
      <Text style={styles.emojiText}>{item}</Text>
    </Pressable>
  );

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      enableOnAndroid
      extraScrollHeight={20}>
      <Text variant="headlineMedium" style={styles.title}>
        Add Place
      </Text>

      <TextInput
        label="Place Name"
        value={name}
        onChangeText={v => {
          setName(v);
          if (errors.name) {
            setErrors(prev => ({...prev, name: undefined}));
          }
        }}
        maxLength={60}
        mode="outlined"
        error={!!errors.name}
        style={styles.input}
        right={<TextInput.Affix text={`${name.length}/60`} />}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

      <Text variant="labelLarge" style={styles.sectionLabel}>
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}>
        {CATEGORIES.map(cat => (
          <Chip
            key={cat.id}
            selected={category === cat.name}
            onPress={() => {
              setCategory(cat.name);
              if (errors.category) {
                setErrors(prev => ({...prev, category: undefined}));
              }
            }}
            style={[
              styles.chip,
              category === cat.name && {backgroundColor: cat.color + '33'},
            ]}
            textStyle={
              category === cat.name
                ? {color: cat.color}
                : {color: theme.appColors.onSurface}
            }
            showSelectedOverlay>
            {cat.emoji} {cat.name}
          </Chip>
        ))}
      </ScrollView>
      {errors.category && (
        <Text style={styles.errorText}>{errors.category}</Text>
      )}

      <Text variant="labelLarge" style={styles.sectionLabel}>
        Emoji
      </Text>
      <FlatList
        data={EMOJI_LIST}
        renderItem={renderEmojiItem}
        keyExtractor={item => item}
        numColumns={4}
        scrollEnabled={false}
        columnWrapperStyle={styles.emojiRow}
      />
      {errors.emoji && <Text style={styles.errorText}>{errors.emoji}</Text>}

      <Button
        mode="outlined"
        onPress={handleUseMyLocation}
        disabled={isLocating}
        style={styles.locationBtn}
        textColor={theme.appColors.primary}
        icon={isLocating ? undefined : 'crosshairs-gps'}>
        {isLocating ? '' : '📡 Use My Location'}
      </Button>
      {isLocating && (
        <View style={styles.locatingRow}>
          <ActivityIndicator size="small" color={theme.appColors.primary} />
          <Text style={styles.locatingText}>Getting location...</Text>
        </View>
      )}

      <View style={styles.coordRow}>
        <View style={styles.coordField}>
          <TextInput
            label="Latitude"
            value={latitude}
            onChangeText={v => {
              setLatitude(v);
              if (errors.latitude) {
                setErrors(prev => ({...prev, latitude: undefined}));
              }
            }}
            keyboardType="numeric"
            mode="outlined"
            error={!!errors.latitude}
            style={styles.input}
          />
          {errors.latitude && (
            <Text style={styles.errorText}>{errors.latitude}</Text>
          )}
        </View>
        <View style={styles.coordSpacer} />
        <View style={styles.coordField}>
          <TextInput
            label="Longitude"
            value={longitude}
            onChangeText={v => {
              setLongitude(v);
              if (errors.longitude) {
                setErrors(prev => ({...prev, longitude: undefined}));
              }
            }}
            keyboardType="numeric"
            mode="outlined"
            error={!!errors.longitude}
            style={styles.input}
          />
          {errors.longitude && (
            <Text style={styles.errorText}>{errors.longitude}</Text>
          )}
        </View>
      </View>

      <TextInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        maxLength={500}
        mode="outlined"
        multiline
        numberOfLines={4}
        style={[styles.input, styles.noteInput]}
        right={<TextInput.Affix text={`${note.length}/500`} />}
      />

      <Button
        mode="contained"
        onPress={handleSave}
        loading={isSaving}
        disabled={isSaving}
        style={styles.saveBtn}
        buttonColor={theme.appColors.primary}>
        Save Place
      </Button>
    </KeyboardAwareScrollView>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      color: t.appColors.onSurface,
      marginBottom: 20,
    },
    input: {
      backgroundColor: t.appColors.surface,
      marginBottom: 4,
    },
    sectionLabel: {
      color: t.appColors.onSurface,
      marginTop: 16,
      marginBottom: 8,
    },
    chipRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    chip: {
      marginRight: 8,
      backgroundColor: t.appColors.surface,
    },
    emojiRow: {
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    emojiCell: {
      flex: 1,
      aspectRatio: 1,
      maxWidth: '23%',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.appColors.surface,
      borderRadius: 12,
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiCellSelected: {
      borderColor: t.appColors.primary,
      backgroundColor: t.appColors.primary + '22',
    },
    emojiText: {
      fontSize: 24,
    },
    locationBtn: {
      marginTop: 16,
      marginBottom: 8,
      borderColor: t.appColors.primary,
    },
    locatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locatingText: {
      color: t.appColors.onSurfaceMuted,
      marginLeft: 8,
    },
    coordRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    coordField: {
      flex: 1,
    },
    coordSpacer: {
      width: 12,
    },
    noteInput: {
      marginTop: 12,
      minHeight: 100,
    },
    saveBtn: {
      marginTop: 24,
      paddingVertical: 4,
    },
    errorText: {
      color: t.appColors.error,
      fontSize: 12,
      marginBottom: 8,
      marginLeft: 4,
    },
  });
