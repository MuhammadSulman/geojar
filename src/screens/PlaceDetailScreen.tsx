import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  ToastAndroid,
} from 'react-native';
import {Text, TextInput, Button, Chip, IconButton} from 'react-native-paper';
import MapView, {Marker} from 'react-native-maps';
import Clipboard from '@react-native-clipboard/clipboard';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {HomeStackParamList} from '@/navigation/types';
import type {CategoryName, Place} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {getPlaceById} from '@/database/queries';
import {usePlacesStore} from '@/store/placesStore';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'PlaceDetail'>;
type Route = RouteProp<HomeStackParamList, 'PlaceDetail'>;

const EMOJI_LIST = [
  '📍', '⭐', '🏠', '🏢', '🏥', '🏫', '🏪', '🏬',
  '☕', '🍔', '🍕', '🍜', '🌮', '🍦', '🎂', '🥗',
  '🌳', '⛰️', '🏖️', '🌊', '🎾', '🎭', '🎵', '❤️',
];

interface FormErrors {
  name?: string;
  category?: string;
  latitude?: string;
  longitude?: string;
}

export default function PlaceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const {placeId} = route.params;

  const updatePlace = usePlacesStore(s => s.updatePlace);
  const deletePlace = usePlacesStore(s => s.deletePlace);
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);

  const [place, setPlace] = useState<Place | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryName>('Other');
  const [editEmoji, setEditEmoji] = useState('📍');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editNote, setEditNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadPlace = useCallback(async () => {
    const p = await getPlaceById(placeId);
    if (p) {
      setPlace(p);
    }
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  const enterEditMode = () => {
    if (!place) {
      return;
    }
    setEditName(place.name);
    setEditCategory(place.category);
    setEditEmoji(place.emoji);
    setEditLatitude(place.latitude.toString());
    setEditLongitude(place.longitude.toString());
    setEditNote(place.note ?? '');
    setErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!editName.trim()) {
      e.name = 'Place name is required';
    }
    if (!editCategory) {
      e.category = 'Select a category';
    }
    const lat = parseFloat(editLatitude);
    if (!editLatitude.trim() || isNaN(lat)) {
      e.latitude = 'Latitude is required';
    } else if (lat < -90 || lat > 90) {
      e.latitude = 'Must be between -90 and 90';
    }
    const lng = parseFloat(editLongitude);
    if (!editLongitude.trim() || isNaN(lng)) {
      e.longitude = 'Longitude is required';
    } else if (lng < -180 || lng > 180) {
      e.longitude = 'Must be between -180 and 180';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !place) {
      return;
    }
    setIsSaving(true);
    try {
      await updatePlace(place.id, {
        name: editName.trim(),
        category: editCategory,
        emoji: editEmoji,
        latitude: parseFloat(editLatitude),
        longitude: parseFloat(editLongitude),
        note: editNote.trim() || undefined,
      });
      await loadPlace();
      setIsEditing(false);
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    } catch {
      Alert.alert('Error', 'Failed to update place.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!place) {
      return;
    }
    await toggleFavorite(place.id);
    await loadPlace();
  };

  const handleCopyCoords = () => {
    if (!place) {
      return;
    }
    Clipboard.setString(`${place.latitude}, ${place.longitude}`);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Coordinates copied!', ToastAndroid.SHORT);
    }
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const handleOpenMap = () => {
    if (!place) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const handleNavigate = () => {
    if (!place) {
      return;
    }
    const {latitude, longitude} = place;
    const nativeUrl =
      Platform.OS === 'ios'
        ? `maps://app?daddr=${latitude},${longitude}`
        : `google.navigation:q=${latitude},${longitude}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.canOpenURL(nativeUrl).then(supported => {
      Linking.openURL(supported ? nativeUrl : webUrl);
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Place',
      'Are you sure you want to delete this place? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlace(placeId);
            ReactNativeHapticFeedback.trigger('notificationWarning');
            navigation.goBack();
          },
        },
      ],
    );
  };

  if (!place) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const cat = CATEGORIES.find(c => c.name === place.category);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#F0F2F8"
          onPress={() => navigation.goBack()}
        />
        {isEditing ? (
          <View style={styles.headerActions}>
            <Button onPress={cancelEdit} textColor="#7B82A0">
              Cancel
            </Button>
            <Button
              onPress={handleSave}
              loading={isSaving}
              textColor="#16A34A">
              Save
            </Button>
          </View>
        ) : (
          <IconButton
            icon="pencil-outline"
            iconColor="#F0F2F8"
            onPress={enterEditMode}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Mini Map */}
        <MapView
          style={styles.map}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          region={{
            latitude: place.latitude,
            longitude: place.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}>
          <Marker
            coordinate={{
              latitude: place.latitude,
              longitude: place.longitude,
            }}>
            <View style={styles.marker}>
              <Text style={styles.markerEmoji}>{place.emoji}</Text>
            </View>
          </Marker>
        </MapView>

        {isEditing ? (
          <View style={styles.editSection}>
            {/* Name */}
            <TextInput
              label="Place Name"
              value={editName}
              onChangeText={v => {
                setEditName(v);
                if (errors.name) {
                  setErrors(prev => ({...prev, name: undefined}));
                }
              }}
              maxLength={60}
              mode="outlined"
              error={!!errors.name}
              style={styles.input}
              right={<TextInput.Affix text={`${editName.length}/60`} />}
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}

            {/* Category */}
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <Chip
                  key={c.id}
                  selected={editCategory === c.name}
                  onPress={() => {
                    setEditCategory(c.name);
                    if (errors.category) {
                      setErrors(prev => ({...prev, category: undefined}));
                    }
                  }}
                  style={[
                    styles.chip,
                    editCategory === c.name && {
                      backgroundColor: c.color + '33',
                    },
                  ]}
                  textStyle={
                    editCategory === c.name
                      ? {color: c.color}
                      : {color: '#F0F2F8'}
                  }
                  showSelectedOverlay>
                  {c.emoji} {c.name}
                </Chip>
              ))}
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}

            {/* Emoji */}
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Emoji
            </Text>
            <FlatList
              data={EMOJI_LIST}
              keyExtractor={item => item}
              numColumns={4}
              scrollEnabled={false}
              columnWrapperStyle={styles.emojiRow}
              renderItem={({item}) => (
                <Pressable
                  style={[
                    styles.emojiCell,
                    item === editEmoji && styles.emojiCellSelected,
                  ]}
                  onPress={() => setEditEmoji(item)}>
                  <Text style={styles.emojiPickerText}>{item}</Text>
                </Pressable>
              )}
            />

            {/* Coordinates */}
            <View style={styles.coordRow}>
              <View style={styles.coordField}>
                <TextInput
                  label="Latitude"
                  value={editLatitude}
                  onChangeText={v => {
                    setEditLatitude(v);
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
                  value={editLongitude}
                  onChangeText={v => {
                    setEditLongitude(v);
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

            {/* Note */}
            <TextInput
              label="Note (optional)"
              value={editNote}
              onChangeText={setEditNote}
              maxLength={500}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.noteInput]}
              right={<TextInput.Affix text={`${editNote.length}/500`} />}
            />
          </View>
        ) : (
          <View style={styles.infoSection}>
            {/* Emoji + Name */}
            <Text style={styles.largeEmoji}>{place.emoji}</Text>
            <Text variant="headlineMedium" style={styles.placeName}>
              {place.name}
            </Text>

            {/* Category */}
            {cat && (
              <Chip
                style={[styles.detailChip, {backgroundColor: cat.color + '33'}]}
                textStyle={{color: cat.color}}>
                {cat.emoji} {cat.name}
              </Chip>
            )}

            {/* Coordinates */}
            <Text style={styles.coords}>
              {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
            </Text>

            {/* Note */}
            {place.note ? (
              <Text style={styles.note}>{place.note}</Text>
            ) : null}

            {/* Date */}
            <Text style={styles.date}>
              Added {new Date(place.createdAt).toLocaleDateString()} ·{' '}
              Updated {new Date(place.updatedAt).toLocaleDateString()}
            </Text>

            {/* Action row */}
            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={handleToggleFavorite}>
                <Text style={styles.actionIcon}>
                  {place.isFavorite ? '⭐' : '☆'}
                </Text>
                <Text style={styles.actionLabel}>Favorite</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleCopyCoords}>
                <Text style={styles.actionIcon}>📋</Text>
                <Text style={styles.actionLabel}>Copy</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleOpenMap}>
                <Text style={styles.actionIcon}>🗺</Text>
                <Text style={styles.actionLabel}>Map</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={handleNavigate}>
                <Text style={styles.actionIcon}>🧭</Text>
                <Text style={styles.actionLabel}>Navigate</Text>
              </Pressable>
            </View>

            {/* Delete */}
            <Button
              mode="outlined"
              onPress={handleDelete}
              textColor="#EF4444"
              style={styles.deleteBtn}>
              Delete Place
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0F14',
  },
  loadingText: {
    color: '#7B82A0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 44,
    paddingHorizontal: 4,
    backgroundColor: '#0D0F14',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  map: {
    height: 200,
    width: '100%',
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
  // View mode
  infoSection: {
    padding: 20,
    alignItems: 'center',
  },
  largeEmoji: {
    fontSize: 56,
    marginTop: 16,
    marginBottom: 8,
  },
  placeName: {
    color: '#F0F2F8',
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailChip: {
    marginBottom: 12,
  },
  coords: {
    color: '#7B82A0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  note: {
    color: '#F0F2F8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  date: {
    color: '#7B82A0',
    fontSize: 12,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
    minWidth: 64,
  },
  actionIcon: {
    fontSize: 26,
  },
  actionLabel: {
    color: '#7B82A0',
    fontSize: 12,
  },
  deleteBtn: {
    borderColor: '#EF4444',
    width: '100%',
    marginTop: 8,
  },
  // Edit mode
  editSection: {
    padding: 16,
  },
  input: {
    backgroundColor: '#1E2230',
    marginBottom: 4,
  },
  sectionLabel: {
    color: '#F0F2F8',
    marginTop: 16,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#1E2230',
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
    backgroundColor: '#1E2230',
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiCellSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A22',
  },
  emojiPickerText: {
    fontSize: 24,
  },
  coordRow: {
    flexDirection: 'row',
    marginTop: 12,
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
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
});
