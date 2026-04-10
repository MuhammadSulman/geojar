import React from 'react';
import {View, Pressable, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
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
    <Pressable
      style={({pressed}) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}>
      <Text style={styles.emoji}>{place.emoji}</Text>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <HighlightText
            text={place.name}
            highlight={highlight}
            style={styles.name}
            numberOfLines={1}
          />
          {onFavoritePress && place.isFavorite && (
            <Icon name="heart" size={14} color="#EF4444" />
          )}
        </View>
        <View style={styles.meta}>
          {cat && (
            <>
              <View style={[styles.dot, {backgroundColor: cat.color}]} />
              <Text style={[styles.catText, {color: cat.color}]}>
                {cat.name}
              </Text>
            </>
          )}
          {place.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {cat ? ' · ' : ''}
              {place.note}
            </Text>
          ) : null}
        </View>
      </View>
      <Icon name="chevron-right" size={20} color="#7B82A0" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2F42',
    backgroundColor: '#1E2230',
  },
  rowPressed: {
    backgroundColor: '#252A3A',
    borderColor: '#3A4060',
  },
  emoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
    marginRight: 10,
  },
  info: {
    flex: 1,
    marginRight: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#F0F2F8',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  catText: {
    fontSize: 12,
    fontWeight: '500',
  },
  note: {
    color: '#7B82A0',
    fontSize: 12,
    flexShrink: 1,
  },
});
