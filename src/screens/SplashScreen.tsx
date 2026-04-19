import React from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {useAppTheme} from '@/constants/theme';

export default function SplashScreen() {
  const theme = useAppTheme();
  return (
    <View
      style={[styles.container, {backgroundColor: theme.appColors.background}]}>
      <ActivityIndicator size="large" color={theme.appColors.primary} />
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
