import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {Text, Chip} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type {Place} from '@/types';
import {CATEGORIES} from '@/constants/categories';
import HighlightText from './HighlightText';

interface Props {
  place: Place;
  highlight?: string;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export default function PlaceCard({
  place,
  highlight = '',
  onPress,
  onFavoritePress,
}: Props) {
  const cat = CATEGORIES.find(c => c.name === place.category);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{place.emoji}</Text>
        <View style={styles.info}>
          <HighlightText
            text={place.name}
            highlight={highlight}
            style={styles.name}
          />
          {cat && (
            <Chip
              compact
              style={[styles.chip, {backgroundColor: cat.color + '22'}]}
              textStyle={{color: cat.color, fontSize: 11}}>
              {cat.emoji} {cat.name}
            </Chip>
          )}
          {place.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {place.note}
            </Text>
          ) : null}
        </View>
        {onFavoritePress && (
          <Pressable onPress={onFavoritePress} hitSlop={8}>
            <Icon
              name={place.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={place.isFavorite ? '#EF4444' : '#7B82A0'}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E2230',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#F0F2F8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
    height: 24,
  },
  note: {
    color: '#7B82A0',
    fontSize: 13,
  },
});
