import React, {useCallback, useMemo, useState} from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {CategoryName, SortOrder} from '@/types';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {SearchStackParamList, RootStackParamList} from '@/navigation/types';
import {CATEGORIES} from '@/constants/categories';
import PlaceCard from '@/components/PlaceCard';
import {usePlacesStore} from '@/store/placesStore';
import {useLocation} from '@/hooks/useLocation';
import {useAppTheme, withAlpha, type AppTheme} from '@/constants/theme';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<SearchStackParamList, 'Search'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const SORT_OPTS: {label: string; value: SortOrder}[] = [
  {label: 'New', value: 'newest'},
  {label: 'Old', value: 'oldest'},
  {label: 'A-Z', value: 'az'},
  {label: 'Near', value: 'nearest'},
];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const places = usePlacesStore(s => s.places);
  const loadPlaces = usePlacesStore(s => s.loadPlaces);
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.top), [theme, insets.top]);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<CategoryName | null>(null);
  const [sort, setSort] = useState<SortOrder>('newest');
  const [userLoc, setUserLoc] = useState<{lat: number; lng: number} | null>(
    null,
  );
  const {getCurrentLocation} = useLocation();

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces]),
  );

  const filtered = React.useMemo(() => {
    let data = places;
    if (activeCat) {
      data = data.filter(p => p.category === activeCat);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          (p.note && p.note.toLowerCase().includes(q)),
      );
    }
    const sorted = [...data];
    switch (sort) {
      case 'newest':
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case 'oldest':
        sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case 'az':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nearest':
        if (userLoc) {
          sorted.sort(
            (a, b) =>
              haversine(userLoc.lat, userLoc.lng, a.latitude, a.longitude) -
              haversine(userLoc.lat, userLoc.lng, b.latitude, b.longitude),
          );
        }
        break;
    }
    return sorted;
  }, [places, query, activeCat, sort, userLoc]);

  const handleSort = async (s: SortOrder) => {
    if (s !== 'nearest') {
      setSort(s);
      return;
    }
    try {
      const loc = await getCurrentLocation();
      setUserLoc({lat: loc.latitude, lng: loc.longitude});
      setSort('nearest');
    } catch {
      // User cancelled, denied, or blocked — useLocation surfaces the blocked alert.
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Icon name="magnify" size={18} color={theme.appColors.onSurfaceMuted} />
        <TextInput
          style={styles.input}
          placeholder="Search places..."
          placeholderTextColor={theme.appColors.placeholder}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon
              name="close-circle"
              size={16}
              color={theme.appColors.placeholder}
            />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        <Pressable
          style={[styles.pill, !activeCat && styles.pillActive]}
          onPress={() => setActiveCat(null)}>
          <Text style={[styles.pillText, !activeCat && styles.pillTextActive]}>
            All
          </Text>
        </Pressable>
        {CATEGORIES.map(c => {
          const on = activeCat === c.name;
          return (
            <Pressable
              key={c.id}
              style={[
                styles.pill,
                on && {
                  backgroundColor: withAlpha(c.color, 0.13),
                  borderColor: withAlpha(c.color, 0.27),
                },
              ]}
              onPress={() =>
                setActiveCat(prev => (prev === c.name ? null : c.name))
              }>
              <Text style={[styles.pillText, on && {color: c.color}]}>
                {c.emoji} {c.name}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.divider} />
        {SORT_OPTS.map(o => {
          const on = sort === o.value;
          return (
            <Pressable
              key={o.value}
              style={[styles.pill, on && styles.pillActive]}
              onPress={() => handleSort(o.value)}>
              <Text style={[styles.pillText, on && styles.pillTextActive]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        places.length === 0 ? (
          <Pressable
            style={({pressed}) => [styles.empty, pressed && styles.emptyPressed]}
            onPress={() => navigation.navigate('AddPlace')}>
            <Icon
              name="map-marker-plus-outline"
              size={40}
              color={theme.appColors.primary}
            />
            <Text style={styles.emptyText}>No places saved yet</Text>
            <Text style={styles.emptyHint}>Tap to add your first place</Text>
          </Pressable>
        ) : (
          <View style={styles.empty}>
            <Icon
              name="magnify-close"
              size={40}
              color={theme.appColors.outline}
            />
            <Text style={styles.emptyText}>No results</Text>
          </View>
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          renderItem={({item}) => (
            <PlaceCard
              place={item}
              highlight={query}
              onPress={() => navigation.navigate('PlaceDetail', {placeId: item.id})}
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (t: AppTheme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
      paddingTop: topInset + 12,
    },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.appColors.surface,
      borderRadius: 8,
      marginHorizontal: 12,
      paddingHorizontal: 8,
      height: 36,
      gap: 6,
      marginBottom: 4,
    },
    input: {
      flex: 1,
      color: t.appColors.onSurface,
      fontSize: 13,
      paddingVertical: 0,
    },
    filterScroll: {
      flexGrow: 0,
      marginTop: 4,
      marginBottom: 8,
    },
    filterRow: {
      paddingHorizontal: 12,
      gap: 4,
      alignItems: 'center',
    },
    pill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: t.appColors.surface,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    pillActive: {
      backgroundColor: t.appColors.primarySoft,
      borderColor: withAlpha(t.appColors.primary, 0.27),
    },
    pillText: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 11,
      fontWeight: '500',
    },
    pillTextActive: {
      color: t.appColors.primary,
    },
    divider: {
      width: 1,
      height: 12,
      backgroundColor: t.appColors.outline,
      marginHorizontal: 1,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 60,
    },
    emptyPressed: {
      opacity: 0.6,
    },
    emptyText: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 14,
    },
    emptyHint: {
      color: t.appColors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
