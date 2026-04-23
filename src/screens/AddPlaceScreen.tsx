import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import {TextInput, Button, Text, Chip} from 'react-native-paper';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';
import type {CategoryName} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {EMOJI_LIST} from '@/constants/emojis';
import {usePlacesStore} from '@/store/placesStore';
import {useLocation} from '@/hooks/useLocation';
import {useAppTheme, withAlpha, type AppTheme} from '@/constants/theme';
import {useToast} from '@/components/Toast';

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddPlace'>;
type Route = RouteProp<RootStackParamList, 'AddPlace'>;

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
  const insets = useSafeAreaInsets();
  const {showToast} = useToast();
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
  const [isSaving, setIsSaving] = useState(false);
  const [latitudeSelection, setLatitudeSelection] = useState<
    {start: number; end: number} | undefined
  >(undefined);
  const [longitudeSelection, setLongitudeSelection] = useState<
    {start: number; end: number} | undefined
  >(undefined);
  const {getCurrentLocation, isLoading: isLocating} = useLocation();

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

  const handleUseMyLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLatitude(loc.latitude.toFixed(6));
      setLongitude(loc.longitude.toFixed(6));
      setErrors(prev => ({
        ...prev,
        latitude: undefined,
        longitude: undefined,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to get location';
      if (message !== 'Location permission not granted') {
        Alert.alert('Location Error', message);
      }
    }
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
      // Coords present → this flow was launched from the Map's "Save this
      // location" bar, so the user is about to land back on the Map.
      // Offset the toast so it doesn't overlap the save bar.
      const returningToMap = route.params?.latitude != null;
      showToast(
        'Place saved',
        'success',
        returningToMap ? {bottomOffset: 100} : undefined,
      );
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save place. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        {paddingTop: insets.top + 16},
      ]}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      enableResetScrollToCoords={false}
      keyboardOpeningTime={250}
      extraHeight={160}
      extraScrollHeight={40}>
      <Text variant="headlineMedium" style={styles.title}>
        Add Place
      </Text>

      <TextInput
        label="Enter place name"
        value={name}
        onChangeText={v => {
          setName(v);
          if (errors.name) {
            setErrors(prev => ({...prev, name: undefined}));
          }
        }}
        maxLength={60}
        mode="outlined"
        dense
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
              category === cat.name && {backgroundColor: withAlpha(cat.color, 0.2)},
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
      <View style={styles.emojiGrid}>
        {EMOJI_LIST.map(item => (
          <Pressable
            key={item}
            style={[
              styles.emojiCell,
              item === emoji && styles.emojiCellSelected,
            ]}
            onPress={() => {
              setEmoji(item);
              setErrors(prev => ({...prev, emoji: undefined}));
            }}>
            <Text style={styles.emojiText}>{item}</Text>
          </Pressable>
        ))}
      </View>
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
            selection={latitudeSelection}
            onFocus={() => {
              setLatitudeSelection({start: 0, end: 0});
              requestAnimationFrame(() => setLatitudeSelection(undefined));
            }}
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
            selection={longitudeSelection}
            onFocus={() => {
              setLongitudeSelection({start: 0, end: 0});
              requestAnimationFrame(() => setLongitudeSelection(undefined));
            }}
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
      paddingBottom: 220,
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
      marginTop: 8,
      marginBottom: 4,
    },
    chipRow: {
      flexDirection: 'row',
      marginBottom: 0,
    },
    chip: {
      marginRight: 8,
      backgroundColor: t.appColors.surface,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -2,
    },
    emojiCell: {
      width: '19%',
      aspectRatio: 1.4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.appColors.surface,
      borderRadius: 10,
      margin: '0.5%',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiCellSelected: {
      borderColor: t.appColors.primary,
      backgroundColor: withAlpha(t.appColors.primary, 0.13),
    },
    emojiText: {
      fontSize: 24,
    },
    locationBtn: {
      marginTop: 4,
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
