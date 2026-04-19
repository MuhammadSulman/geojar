import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_mode';

interface ThemeState {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  hydrate: () => Promise<void>;
}

function isThemeMode(v: unknown): v is ThemeMode {
  return v === 'light' || v === 'dark' || v === 'system';
}

export const useThemeStore = create<ThemeState>(set => ({
  mode: 'system',
  hydrated: false,
  setMode: async mode => {
    set({mode});
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  hydrate: async () => {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    set({mode: isThemeMode(v) ? v : 'system', hydrated: true});
  },
}));

export function useIsDark(): boolean {
  const mode = useThemeStore(s => s.mode);
  const systemDark = useColorScheme() === 'dark';
  return mode === 'system' ? systemDark : mode === 'dark';
}
