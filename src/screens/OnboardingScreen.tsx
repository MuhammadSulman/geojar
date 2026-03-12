import React, {useCallback, useRef, useState} from 'react';
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

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setActiveIndex(index);
    },
    [width],
  );

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({x: width * (activeIndex + 1), animated: true});
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
          buttonColor="#16A34A">
          {isLast ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
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
    color: '#F0F2F8',
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#7B82A0',
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
    backgroundColor: '#2A2F42',
  },
  dotActive: {
    backgroundColor: '#16A34A',
    width: 24,
  },
  button: {
    width: '100%',
  },
});
