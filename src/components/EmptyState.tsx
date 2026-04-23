import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {useAppTheme, type AppTheme} from '@/constants/theme';

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  onCTA?: () => void;
  ctaLabel?: string;
  ctaIcon?: string;
}

export default function EmptyState({
  emoji,
  title,
  subtitle,
  onCTA,
  ctaLabel,
  ctaIcon = 'plus',
}: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
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
          icon={ctaIcon}
          onPress={onCTA}
          style={styles.cta}
          buttonColor={theme.appColors.primary}>
          {ctaLabel}
        </Button>
      )}
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
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
      color: t.appColors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      color: t.appColors.onSurfaceMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    cta: {
      marginTop: 24,
    },
  });
