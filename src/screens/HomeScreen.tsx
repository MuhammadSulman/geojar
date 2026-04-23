import React, {useCallback, useMemo} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native';
import {Text} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {CompositeNavigationProp} from '@react-navigation/native';
import type {HomeStackParamList, RootStackParamList, MainTabParamList} from '@/navigation/types';
import type {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {Place} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';
import {useAppTheme, withAlpha, type AppTheme} from '@/constants/theme';
import PlaceCard from '@/components/PlaceCard';
import EmptyState from '@/components/EmptyState';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) {
    return 'Good night';
  }
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const places = usePlacesStore(s => s.places);
  const loadPlaces = usePlacesStore(s => s.loadPlaces);
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme, insets.top), [theme, insets.top]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces]),
  );

  const stats = useMemo(() => {
    const favorites = places.filter(p => p.isFavorite).length;
    const categoriesUsed = new Set(places.map(p => p.category)).size;
    return {total: places.length, favorites, categoriesUsed};
  }, [places]);

  const recent = useMemo(
    () =>
      [...places]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [places],
  );

  const favorites = useMemo(
    () => places.filter(p => p.isFavorite).slice(0, 10),
    [places],
  );

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return CATEGORIES.map(c => ({...c, count: counts.get(c.name) ?? 0}))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [places]);

  const goToTab = (tab: 'MapTab' | 'SearchTab' | 'CategoryTab') => {
    navigation.navigate(tab);
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetail', {placeId: place.id});
  };

  const handleCategoryPress = () => {
    goToTab('CategoryTab');
  };

  if (places.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.tagline}>Your places, your map.</Text>
        </View>
        <EmptyState
          emoji="📍"
          title="Save your first place"
          subtitle="Drop a pin for somewhere you love — a café, a friend's home, a trailhead. It'll live here forever."
          ctaLabel="Add a place"
          onCTA={() => navigation.navigate('AddPlace')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.tagline}>
          {stats.total === 1 ? '1 place saved' : `${stats.total} places saved`}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="map-marker-multiple"
          label="Total"
          value={stats.total}
          color={theme.appColors.primary}
          theme={theme}
        />
        <StatCard
          icon="heart"
          label="Favorites"
          value={stats.favorites}
          color={theme.appColors.favorite}
          theme={theme}
        />
        <StatCard
          icon="shape"
          label="Categories"
          value={stats.categoriesUsed}
          color="#3B82F6"
          theme={theme}
        />
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={({pressed}) => [
            styles.primaryAction,
            pressed && styles.actionPressed,
          ]}
          onPress={() => navigation.navigate('AddPlace')}>
          <Icon name="map-marker-plus" size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Add place</Text>
        </Pressable>
        <Pressable
          style={({pressed}) => [
            styles.secondaryAction,
            pressed && styles.actionPressed,
          ]}
          onPress={() => goToTab('MapTab')}>
          <Icon name="map-outline" size={20} color={theme.appColors.primary} />
          <Text style={styles.secondaryActionText}>Map</Text>
        </Pressable>
      </View>

      {favorites.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <Icon name="heart" size={14} color={theme.appColors.favorite} />
          </View>
          <FlatList
            data={favorites}
            keyExtractor={p => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favRow}
            renderItem={({item}) => (
              <Pressable
                style={({pressed}) => [
                  styles.favCard,
                  pressed && styles.favCardPressed,
                ]}
                onPress={() => handlePlacePress(item)}>
                <Text style={styles.favEmoji}>{item.emoji}</Text>
                <Text style={styles.favName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.favCat} numberOfLines={1}>
                  {item.category}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {topCategories.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by category</Text>
            <Pressable onPress={() => goToTab('CategoryTab')} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.catGrid}>
            {topCategories.map(c => (
              <Pressable
                key={c.id}
                style={({pressed}) => [
                  styles.catTile,
                  {borderColor: withAlpha(c.color, 0.33)},
                  pressed && {backgroundColor: withAlpha(c.color, 0.08)},
                ]}
                onPress={handleCategoryPress}>
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={styles.catName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={[styles.catCount, {color: c.color}]}>
                  {c.count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently added</Text>
          {places.length > recent.length && (
            <Pressable onPress={() => goToTab('SearchTab')} hitSlop={8}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.recentList}>
          {recent.map(item => (
            <PlaceCard
              key={item.id}
              place={item}
              onPress={() => handlePlacePress(item)}
              onFavoritePress={() => toggleFavorite(item.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

interface StatProps {
  icon: string;
  label: string;
  value: number;
  color: string;
  theme: AppTheme;
}

function StatCard({icon, label, value, color, theme}: StatProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.appColors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.appColors.outline,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        gap: 4,
      }}>
      <Icon name={icon} size={18} color={color} />
      <Text
        style={{
          color: theme.appColors.onSurface,
          fontSize: 20,
          fontWeight: '700',
        }}>
        {value}
      </Text>
      <Text style={{color: theme.appColors.onSurfaceMuted, fontSize: 11}}>
        {label}
      </Text>
    </View>
  );
}

const makeStyles = (t: AppTheme, topInset: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    content: {
      paddingBottom: 32,
    },
    header: {
      paddingTop: topInset + 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    greeting: {
      color: t.appColors.onSurface,
      fontSize: 24,
      fontWeight: '700',
    },
    tagline: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 13,
      marginTop: 2,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      marginTop: 4,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 12,
      marginTop: 12,
    },
    primaryAction: {
      flex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: t.appColors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      gap: 8,
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryAction: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: withAlpha(t.appColors.primary, 0.33),
      paddingVertical: 12,
      gap: 6,
    },
    secondaryActionText: {
      color: t.appColors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    actionPressed: {
      opacity: 0.75,
    },
    section: {
      marginTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
      gap: 6,
    },
    sectionTitle: {
      color: t.appColors.onSurface,
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      flex: 1,
    },
    seeAll: {
      color: t.appColors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    favRow: {
      paddingHorizontal: 12,
      gap: 8,
    },
    favCard: {
      width: 120,
      backgroundColor: t.appColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.appColors.outline,
      padding: 10,
      marginRight: 8,
    },
    favCardPressed: {
      backgroundColor: t.appColors.surfacePressed,
    },
    favEmoji: {
      fontSize: 24,
      marginBottom: 4,
    },
    favName: {
      color: t.appColors.onSurface,
      fontSize: 13,
      fontWeight: '600',
    },
    favCat: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 11,
      marginTop: 1,
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      gap: 8,
    },
    catTile: {
      width: '31.5%',
      backgroundColor: t.appColors.surface,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 6,
      alignItems: 'center',
      gap: 2,
    },
    catEmoji: {
      fontSize: 22,
    },
    catName: {
      color: t.appColors.onSurface,
      fontSize: 12,
      fontWeight: '600',
    },
    catCount: {
      fontSize: 11,
      fontWeight: '700',
    },
    recentList: {
      paddingTop: 2,
    },
  });
