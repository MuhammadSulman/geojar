import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {Text, TextInput, Button, Chip, IconButton} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import type {RootStackParamList} from '@/navigation/types';
import type {CategoryName} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';
import {getMapStyle} from '@/constants/mapStyle';
import {useAppTheme, withAlpha, type AppTheme} from '@/constants/theme';
import {useIsDark} from '@/store/themeStore';
import {useToast} from '@/components/Toast';
import {EMOJI_LIST} from '@/constants/emojis';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlaceDetail'>;
type Route = RouteProp<RootStackParamList, 'PlaceDetail'>;

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
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.top), [theme, insets.top]);
  const isDark = useIsDark();
  const mapStyle = useMemo(() => getMapStyle(isDark), [isDark]);

  const places = usePlacesStore(s => s.places);
  const place = useMemo(
    () => places.find(p => p.id === placeId),
    [places, placeId],
  );
  const updatePlace = usePlacesStore(s => s.updatePlace);
  const deletePlace = usePlacesStore(s => s.deletePlace);
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);
  const {showToast} = useToast();

  const [isEditing, setIsEditing] = useState(false);

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<CategoryName>('Other');
  const [editEmoji, setEditEmoji] = useState('📍');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editNote, setEditNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [latitudeSelection, setLatitudeSelection] = useState<
    {start: number; end: number} | undefined
  >(undefined);
  const [longitudeSelection, setLongitudeSelection] = useState<
    {start: number; end: number} | undefined
  >(undefined);

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
      setIsEditing(false);
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      showToast('Place updated');
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
  };

  const handleCopyCoords = () => {
    if (!place) {
      return;
    }
    Clipboard.setString(`${place.latitude}, ${place.longitude}`);
    showToast('Coordinates copied', 'info');
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  const handleOpenMap = () => {
    if (!place) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    if (!place) {
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    const lines = [`📍 ${place.name}`];
    if (place.note) {
      lines.push(place.note);
    }
    lines.push(url);
    try {
      await Share.open({
        title: place.name,
        message: lines.join('\n'),
        failOnCancel: false,
      });
    } catch {
      // user cancelled or share failed silently
    }
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
            showToast('Place deleted', 'error');
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
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.appColors.onSurface}
          onPress={() => navigation.goBack()}
        />
        {isEditing ? (
          <View style={styles.headerActions}>
            <Button onPress={cancelEdit} textColor={theme.appColors.onSurfaceMuted}>
              Cancel
            </Button>
            <Button
              onPress={handleSave}
              loading={isSaving}
              textColor={theme.appColors.primary}>
              Save
            </Button>
          </View>
        ) : (
          <IconButton
            icon="pencil-outline"
            iconColor={theme.appColors.onSurface}
            onPress={enterEditMode}
          />
        )}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        enableResetScrollToCoords={false}
        keyboardOpeningTime={250}
        extraHeight={160}
        extraScrollHeight={40}>
        <MapLibreGL.MapView
          style={styles.map}
          mapStyle={mapStyle}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          logoEnabled={false}
          attributionEnabled={false}>
          <MapLibreGL.Camera
            centerCoordinate={[place.longitude, place.latitude]}
            zoomLevel={15}
          />
          <MapLibreGL.PointAnnotation
            id={`detail-${place.id}`}
            coordinate={[place.longitude, place.latitude]}>
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                <Text style={styles.markerEmoji}>{place.emoji}</Text>
              </View>
              <View style={styles.markerLabel}>
                <Text style={styles.markerLabelText} numberOfLines={1}>
                  {place.name}
                </Text>
              </View>
            </View>
            <MapLibreGL.Callout title={place.name} />
          </MapLibreGL.PointAnnotation>
        </MapLibreGL.MapView>

        {isEditing ? (
          <View style={styles.editSection}>
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
                      backgroundColor: withAlpha(c.color, 0.2),
                    },
                  ]}
                  textStyle={
                    editCategory === c.name
                      ? {color: c.color}
                      : {color: theme.appColors.onSurface}
                  }
                  showSelectedOverlay>
                  {c.emoji} {c.name}
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
                  selection={latitudeSelection}
                  onFocus={() => {
                    setLatitudeSelection({start: 0, end: 0});
                    requestAnimationFrame(() =>
                      setLatitudeSelection(undefined),
                    );
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
                  selection={longitudeSelection}
                  onFocus={() => {
                    setLongitudeSelection({start: 0, end: 0});
                    requestAnimationFrame(() =>
                      setLongitudeSelection(undefined),
                    );
                  }}
                />
                {errors.longitude && (
                  <Text style={styles.errorText}>{errors.longitude}</Text>
                )}
              </View>
            </View>

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
            <Text style={styles.largeEmoji}>{place.emoji}</Text>
            <Text variant="headlineMedium" style={styles.placeName}>
              {place.name}
            </Text>

            {cat && (
              <Chip
                style={[styles.detailChip, {backgroundColor: withAlpha(cat.color, 0.2)}]}
                textStyle={{color: cat.color}}>
                {cat.emoji} {cat.name}
              </Chip>
            )}

            <Text style={styles.coords}>
              {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
            </Text>

            {place.note ? (
              <Text style={styles.note}>{place.note}</Text>
            ) : null}

            <Text style={styles.date}>
              Added {new Date(place.createdAt).toLocaleDateString()} · Updated{' '}
              {new Date(place.updatedAt).toLocaleDateString()}
            </Text>

            <View style={styles.actionRow}>
              <Pressable style={styles.actionBtn} onPress={handleToggleFavorite}>
                <Icon
                  name={place.isFavorite ? 'heart' : 'heart-outline'}
                  size={26}
                  color={
                    place.isFavorite
                      ? theme.appColors.favorite
                      : theme.appColors.onSurface
                  }
                />
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
              <Pressable style={styles.actionBtn} onPress={handleShare}>
                <Text style={styles.actionIcon}>📤</Text>
                <Text style={styles.actionLabel}>Share</Text>
              </Pressable>
            </View>

            <Button
              mode="outlined"
              onPress={handleDelete}
              textColor={theme.appColors.error}
              style={styles.deleteBtn}>
              Delete Place
            </Button>
          </View>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const makeStyles = (t: AppTheme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: t.appColors.background,
    },
    loadingText: {
      color: t.appColors.onSurfaceMuted,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: topInset + 8,
      paddingHorizontal: 4,
      backgroundColor: t.appColors.background,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scrollContent: {
      paddingBottom: 220,
    },
    map: {
      height: 200,
      width: '100%',
    },
    markerContainer: {
      alignItems: 'center',
    },
    marker: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.appColors.markerBg,
      borderWidth: 2,
      borderColor: t.appColors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    markerEmoji: {
      fontSize: 20,
    },
    markerLabel: {
      backgroundColor: t.appColors.markerLabelBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      maxWidth: 100,
    },
    markerLabelText: {
      color: t.appColors.markerLabelText,
      fontSize: 10,
      fontWeight: '600',
      textAlign: 'center',
    },
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
      color: t.appColors.onSurface,
      fontWeight: '700',
      marginBottom: 10,
      textAlign: 'center',
    },
    detailChip: {
      marginBottom: 12,
    },
    coords: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      marginBottom: 12,
    },
    note: {
      color: t.appColors.onSurface,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    date: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 12,
      marginBottom: 24,
    },
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginBottom: 32,
      paddingHorizontal: 4,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    actionIcon: {
      fontSize: 26,
    },
    actionLabel: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 12,
    },
    deleteBtn: {
      borderColor: t.appColors.error,
      width: '100%',
      marginTop: 8,
    },
    editSection: {
      padding: 16,
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
      backgroundColor: withAlpha(t.appColors.primary, 0.13),
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
      color: t.appColors.error,
      fontSize: 12,
      marginBottom: 8,
      marginLeft: 4,
    },
  });
