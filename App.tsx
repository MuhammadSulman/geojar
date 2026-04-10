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
import {parseLocationUrl} from '@/utils/parseLocationUrl';

const queryClient = new QueryClient();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? DarkTheme : LightTheme;
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  const handleDeepLink = useCallback((url: string | null) => {
    if (!url) {
      return;
    }
    const location = parseLocationUrl(url);
    if (location) {
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        navigationRef.current?.navigate('Main', {
          screen: 'HomeTab',
          params: {
            screen: 'AddPlace',
            params: {
              latitude: location.latitude,
              longitude: location.longitude,
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
    getDatabase();

    // Handle app opened via deep link
    Linking.getInitialURL().then(handleDeepLink);

    // Handle deep link while app is already open
    const subscription = Linking.addEventListener('url', ({url}) =>
      handleDeepLink(url),
    );
    return () => subscription.remove();
  }, [handleDeepLink]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <ToastProvider>
                <NavigationContainer ref={navigationRef}>
                  <StatusBar
                    barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  />
                  <RootNavigator />
                </NavigationContainer>
              </ToastProvider>
            </SafeAreaProvider>
          </QueryClientProvider>
        </PaperProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default App;
