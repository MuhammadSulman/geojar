import React, {useCallback, useMemo} from 'react';
import {View, SectionList, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {Place} from '@/types';
import type {CategoryStackParamList} from '@/navigation/types';
import {CATEGORIES} from '@/constants/categories';
import {usePlacesStore} from '@/store/placesStore';
import {useAppTheme, type AppTheme} from '@/constants/theme';
import PlaceCard from '@/components/PlaceCard';

type Nav = NativeStackNavigationProp<CategoryStackParamList, 'CategoryList'>;

interface Section {
  title: string;
  emoji: string;
  color: string;
  count: number;
  data: Place[];
}

export default function CategoryListScreen() {
  const navigation = useNavigation<Nav>();
  const places = usePlacesStore(s => s.places);
  const loadPlaces = usePlacesStore(s => s.loadPlaces);
  const toggleFavorite = usePlacesStore(s => s.toggleFavorite);
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [loadPlaces]),
  );

  const sections: Section[] = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catPlaces = places.filter(p => p.category === cat.name);
      return {
        title: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        count: catPlaces.length,
        data: catPlaces,
      };
    }).filter(s => s.data.length > 0);
  }, [places]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetail', {placeId: place.id});
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Categories
      </Text>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({section}) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>{section.emoji}</Text>
            <Text style={[styles.sectionTitle, {color: section.color}]}>
              {section.title}
            </Text>
            <View
              style={[styles.badge, {backgroundColor: section.color + '33'}]}>
              <Text style={[styles.badgeText, {color: section.color}]}>
                {section.count}
              </Text>
            </View>
          </View>
        )}
        renderItem={({item}) => (
          <PlaceCard
            place={item}
            onPress={() => handlePlacePress(item)}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No places saved yet</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    title: {
      color: t.appColors.onSurface,
      paddingTop: 48,
      paddingHorizontal: 16,
      paddingBottom: 6,
      fontSize: 20,
      fontWeight: '700',
    },
    listContent: {
      paddingBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      gap: 6,
    },
    sectionEmoji: {
      fontSize: 14,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    badge: {
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
    },
    emptyText: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 14,
    },
  });
