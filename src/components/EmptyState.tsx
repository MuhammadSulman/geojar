import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  onCTA?: () => void;
  ctaLabel?: string;
}

export default function EmptyState({
  emoji,
  title,
  subtitle,
  onCTA,
  ctaLabel,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {onCTA && ctaLabel && (
        <Button
          mode="contained"
          onPress={onCTA}
          style={styles.cta}
          buttonColor="#16A34A">
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#F0F2F8',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#7B82A0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    marginTop: 24,
  },
});
