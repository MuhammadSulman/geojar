import React, {useEffect} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RootStackParamList} from './types';
import SplashScreen from '@/screens/SplashScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import AddPlaceScreen from '@/screens/AddPlaceScreen';
import PlaceDetailScreen from '@/screens/PlaceDetailScreen';
import MainNavigator from './MainNavigator';
import {useOnboardingStore} from '@/store/onboardingStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const hydrated = useOnboardingStore(s => s.hydrated);
  const hasOnboarded = useOnboardingStore(s => s.hasOnboarded);
  const hydrate = useOnboardingStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {!hasOnboarded && (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      )}
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen
        name="AddPlace"
        component={AddPlaceScreen}
        options={{presentation: 'modal'}}
      />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={{presentation: 'card'}}
      />
    </Stack.Navigator>
  );
}
