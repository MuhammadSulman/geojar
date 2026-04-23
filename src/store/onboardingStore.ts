import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'onboarding_complete';

interface OnboardingState {
  hasOnboarded: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  hasOnboarded: false,
  hydrated: false,
  hydrate: async () => {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    set({hasOnboarded: v === 'true', hydrated: true});
  },
  completeOnboarding: async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    set({hasOnboarded: true});
  },
}));
