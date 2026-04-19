import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import type {Category} from '@/types';
import {useAppTheme} from '@/constants/theme';

interface Props {
  category: Category;
  selected: boolean;
  onPress: () => void;
}

export default function CategoryChip({category, selected, onPress}: Props) {
  const theme = useAppTheme();
  return (
    <Pressable
      style={[
        styles.chip,
        selected
          ? {
              backgroundColor: category.color + '33',
              borderColor: category.color,
            }
          : {
              backgroundColor: 'transparent',
              borderColor: theme.appColors.outline,
            },
      ]}
      onPress={onPress}>
      <Text
        style={[
          styles.label,
          {
            color: selected ? category.color : theme.appColors.onSurfaceMuted,
          },
        ]}>
        {category.emoji} {category.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
