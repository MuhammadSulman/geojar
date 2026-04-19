import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';
import {useAppTheme} from '@/constants/theme';

export default function CategoryScreen() {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.container, {backgroundColor: theme.appColors.background}]}>
      <Text
        variant="headlineSmall"
        style={{color: theme.appColors.onSurface}}>
        Categories
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
