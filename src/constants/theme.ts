import {MD3LightTheme, MD3DarkTheme} from 'react-native-paper';

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#16A34A',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    onSurface: '#1C1B1F',
    outline: '#79747E',
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#16A34A',
    background: '#0D0F14',
    surface: '#1E2230',
    onSurface: '#F0F2F8',
    outline: '#2A2F42',
  },
};
