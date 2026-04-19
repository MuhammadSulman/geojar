import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import {Button, Text} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '@/navigation/types';
import {useLocation} from '@/hooks/useLocation';
import {useAppTheme, type AppTheme} from '@/constants/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const SLIDES = [
  {
    emoji: '📍',
    title: 'Save Any Place',
    subtitle:
      'No more WhatsApp messages to yourself. Tap + to pin any location.',
  },
  {
    emoji: '🗂',
    title: 'Organize by Category',
    subtitle: 'Food, Work, Health, Shopping — find any place instantly.',
  },
  {
    emoji: '🗺',
    title: 'One-Tap Navigation',
    subtitle: 'Open any saved place in Google Maps with one tap.',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const {width} = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const {requestPermission} = useLocation();
  const theme = useAppTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: width * (activeIndex + 1),
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    await requestPermission();
    navigation.reset({index: 0, routes: [{name: 'Main'}]});
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}>
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, {width}]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text variant="headlineLarge" style={styles.title}>
              {slide.title}
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {slide.subtitle}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>

        <Button
          mode="contained"
          onPress={isLast ? handleGetStarted : handleNext}
          style={styles.button}
          buttonColor={theme.appColors.primary}>
          {isLast ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}

const makeStyles = (t: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.appColors.background,
    },
    slide: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emoji: {
      fontSize: 100,
      marginBottom: 32,
    },
    title: {
      color: t.appColors.onSurface,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    subtitle: {
      color: t.appColors.onSurfaceMuted,
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      alignItems: 'center',
      gap: 24,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: t.appColors.outline,
    },
    dotActive: {
      backgroundColor: t.appColors.primary,
      width: 24,
    },
    button: {
      width: '100%',
    },
  });
