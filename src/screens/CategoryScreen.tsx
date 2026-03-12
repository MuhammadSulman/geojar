import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from 'react-native-paper';

export default function CategoryScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.text}>
        Categories
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0F14'},
  text: {color: '#F0F2F8'},
});
