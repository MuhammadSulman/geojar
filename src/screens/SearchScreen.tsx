import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  FlatList,
  Pressable,
  Platform,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import {Searchbar, Text, Chip, Menu, IconButton} from 'react-native-paper';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {Place, CategoryName, SortOrder} from '@/types';
import type {HomeStackParamList} from '@/navigation/types';
import {CATEGORIES} from '@/constants/categories';
import {searchPlaces} from '@/database/queries';
import PlaceCard from '@/components/PlaceCard';
import {usePlacesStore} from '@/store/placesStore';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 5;

const SORT_OPTIONS: {label: string; value: SortOrder}[] = [
  {label: 'Newest', value: 'newest'},
  {label: 'Oldest', value: 'oldest'},
  {label: 'A → Z', value: 'az'},
  {label: 'Nearest to Me', value: 'nearest'},
];

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
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
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryName | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [results, setResults] = useState<Place[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(raw => {
      if (raw) {
        try {
          setRecentSearches(JSON.parse(raw));
        } catch {}
      }
    });
  }, []);

  const saveRecentSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      return;
    }
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    let list: string[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {}
    }
    list = [trimmed, ...list.filter(s => s !== trimmed)].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
    setRecentSearches(list);
  }, []);

  const performSearch = useCallback(
    async (q: string, cat: CategoryName | null) => {
      const data = await searchPlaces(q, cat ?? undefined);
      setResults(data);
    },
    [],
  );

  const sortResults = useCallback(
    (data: Place[], order: SortOrder): Place[] => {
      const sorted = [...data];
      switch (order) {
        case 'newest':
          sorted.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime(),
          );
          break;
        case 'oldest':
          sorted.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime(),
          );
          break;
        case 'az':
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'nearest':
          if (userLocation) {
            sorted.sort(
              (a, b) =>
                haversineDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  a.latitude,
                  a.longitude,
                ) -
                haversineDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  b.latitude,
                  b.longitude,
                ),
            );
          }
          break;
      }
      return sorted;
    },
    [userLocation],
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!query.trim() && !activeCategory) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      await performSearch(query, activeCategory);
      if (query.trim()) {
        saveRecentSearch(query);
      }
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeCategory, performSearch, saveRecentSearch]);

  const sortedResults = sortResults(results, sortOrder);

  const requestLocationAndSort = async () => {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
    if (!permission) {
      return;
    }
    let status = await check(permission);
    if (status === RESULTS.DENIED) {
      status = await request(permission);
    }
    if (status !== RESULTS.GRANTED && status !== RESULTS.LIMITED) {
      Alert.alert(
        'Location Permission Required',
        'Enable location access to sort by distance.',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Open Settings', onPress: () => Linking.openSettings()},
        ],
      );
      return;
    }
    Geolocation.getCurrentPosition(
      pos => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setSortOrder('nearest');
      },
      err => Alert.alert('Location Error', err.message),
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleSortSelect = (order: SortOrder) => {
    setMenuVisible(false);
    if (order === 'nearest') {
      requestLocationAndSort();
    } else {
      setSortOrder(order);
    }
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetail', {placeId: place.id});
  };

  const showEmpty = query.trim() || activeCategory;

  return (
    <View style={styles.container}>
      {/* Search bar + sort */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search places..."
          value={query}
          onChangeText={setQuery}
          autoFocus
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#7B82A0"
          placeholderTextColor="#7B82A0"
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="sort"
              iconColor="#7B82A0"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
          contentStyle={styles.menuContent}>
          {SORT_OPTIONS.map(opt => (
            <Menu.Item
              key={opt.value}
              onPress={() => handleSortSelect(opt.value)}
              title={opt.label}
              leadingIcon={
                sortOrder === opt.value ? 'check' : undefined
              }
            />
          ))}
        </Menu>
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={c => c.id}
        contentContainerStyle={styles.chipList}
        renderItem={({item}) => (
          <Chip
            selected={activeCategory === item.name}
            onPress={() =>
              setActiveCategory(prev =>
                prev === item.name ? null : item.name,
              )
            }
            style={[
              styles.chip,
              activeCategory === item.name && {
                backgroundColor: item.color + '33',
              },
            ]}
            textStyle={
              activeCategory === item.name
                ? {color: item.color}
                : {color: '#F0F2F8'}
            }
            showSelectedOverlay>
            {item.emoji} {item.name}
          </Chip>
        )}
      />

      {/* Results or recent searches */}
      {!showEmpty ? (
        <View style={styles.recentSection}>
          <Text variant="titleSmall" style={styles.recentTitle}>
            Recent Searches
          </Text>
          {recentSearches.length === 0 ? (
            <Text style={styles.recentEmpty}>No recent searches</Text>
          ) : (
            recentSearches.map((term, idx) => (
              <Pressable
                key={idx}
                style={styles.recentItem}
                onPress={() => handleRecentPress(term)}>
                <Icon name="history" size={18} color="#7B82A0" />
                <Text style={styles.recentText}>{term}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : sortedResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="map-search-outline" size={64} color="#2A2F42" />
          <Text variant="titleMedium" style={styles.emptyTitle}>
            No places found
          </Text>
          <Text style={styles.emptySubtitle}>Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={sortedResults}
          keyExtractor={p => p.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <PlaceCard
              place={item}
              highlight={query}
              onPress={() => handlePlacePress(item)}
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#1E2230',
    elevation: 0,
  },
  searchInput: {
    color: '#F0F2F8',
  },
  menuContent: {
    backgroundColor: '#1E2230',
  },
  chipList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    backgroundColor: '#1E2230',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  recentSection: {
    padding: 16,
  },
  recentTitle: {
    color: '#7B82A0',
    marginBottom: 12,
  },
  recentEmpty: {
    color: '#2A2F42',
    fontSize: 14,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  recentText: {
    color: '#F0F2F8',
    fontSize: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: '#F0F2F8',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#7B82A0',
    fontSize: 14,
  },
});
