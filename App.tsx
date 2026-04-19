import React, {useEffect, useRef, useCallback} from 'react';
import {StatusBar, useColorScheme, Linking, Alert} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PaperProvider} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import {DarkTheme, LightTheme} from '@/constants/theme';
import {getDatabase} from '@/database/db';
import RootNavigator from '@/navigation/RootNavigator';
import {ToastProvider} from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import {resolveAndParseLocationUrl} from '@/utils/parseLocationUrl';
import {useThemeStore} from '@/store/themeStore';

const queryClient = new QueryClient();

function App() {
  const systemDark = useColorScheme() === 'dark';
  const mode = useThemeStore(s => s.mode);
  const hydrate = useThemeStore(s => s.hydrate);
  const isDarkMode = mode === 'system' ? systemDark : mode === 'dark';
  const theme = isDarkMode ? DarkTheme : LightTheme;

  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const handleDeepLink = useCallback(async (url: string | null) => {
    if (!url) {
      return;
    }
    const location = await resolveAndParseLocationUrl(url);
    if (location) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        navigationRef.current?.navigate('Main', {
          screen: 'MapTab',
          params: {
            screen: 'Map',
            params: {
              focusLatitude: location.latitude,
              focusLongitude: location.longitude,
            },
          },
        });
      }, 500);
    } else {
      Alert.alert(
        'Location Not Found',
        'Could not extract coordinates from the shared link. Try copying the coordinates manually.',
      );
    }
  }, []);

  useEffect(() => {
    hydrate();
    getDatabase();

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({url}) =>
      handleDeepLink(url),
    );
    return () => subscription.remove();
  }, [handleDeepLink, hydrate]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <PaperProvider theme={theme}>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <ToastProvider>
                <NavigationContainer ref={navigationRef}>
                  <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                    backgroundColor={theme.appColors.background}
                  />
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default App;
