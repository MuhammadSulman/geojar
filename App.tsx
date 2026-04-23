import React, {useEffect, useRef, useCallback, useState} from 'react';
import {StatusBar, useColorScheme, Linking, Alert} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PaperProvider} from 'react-native-paper';
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
import {useOnboardingStore} from '@/store/onboardingStore';

function App() {
  const systemDark = useColorScheme() === 'dark';
  const mode = useThemeStore(s => s.mode);
  const hydrate = useThemeStore(s => s.hydrate);
  const isDarkMode = mode === 'system' ? systemDark : mode === 'dark';
  const theme = isDarkMode ? DarkTheme : LightTheme;

  // Gate deep-link dispatch on: (1) nav container ready, (2) onboarding
  // gate resolved, (3) user is past onboarding. Any deep link that arrives
  // before all three are true is queued and replayed once they are.
  const onboardingHydrated = useOnboardingStore(s => s.hydrated);
  const hasOnboarded = useOnboardingStore(s => s.hasOnboarded);

  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const [isNavReady, setIsNavReady] = useState(false);

  const navigateToLocation = useCallback(
    (latitude: number, longitude: number) => {
      navigationRef.current?.navigate('Main', {
        screen: 'MapTab',
        params: {
          screen: 'Map',
          params: {focusLatitude: latitude, focusLongitude: longitude},
        },
      });
    },
    [],
  );

  const canDispatchDeepLink = isNavReady && onboardingHydrated && hasOnboarded;

  const dispatchDeepLink = useCallback(
    async (url: string) => {
      const location = await resolveAndParseLocationUrl(url);
      if (location) {
        navigateToLocation(location.latitude, location.longitude);
      } else {
        Alert.alert(
          'Location Not Found',
          'Could not extract coordinates from the shared link. Try copying the coordinates manually.',
        );
      }
    },
    [navigateToLocation],
  );

  const queueOrDispatch = useCallback(
    (url: string | null) => {
      if (!url) {
        return;
      }
      if (!canDispatchDeepLink) {
        pendingUrlRef.current = url;
        return;
      }
      dispatchDeepLink(url);
    },
    [canDispatchDeepLink, dispatchDeepLink],
  );

  // When all gates are satisfied, flush any queued deep link.
  useEffect(() => {
    if (!canDispatchDeepLink) {
      return;
    }
    const pending = pendingUrlRef.current;
    if (pending) {
      pendingUrlRef.current = null;
      dispatchDeepLink(pending);
    }
  }, [canDispatchDeepLink, dispatchDeepLink]);

  useEffect(() => {
    hydrate();
    getDatabase();

    Linking.getInitialURL().then(url => {
      if (url) {
        // Always queue on cold start; the gate-flush effect above will
        // replay it once nav + onboarding are ready.
        pendingUrlRef.current = url;
      }
    });

    const subscription = Linking.addEventListener('url', ({url}) =>
      queueOrDispatch(url),
    );
    return () => subscription.remove();
  }, [queueOrDispatch, hydrate]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <PaperProvider theme={theme}>
        <ErrorBoundary>
          <SafeAreaProvider>
            <ToastProvider>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => setIsNavReady(true)}>
                <StatusBar
                  barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                  backgroundColor={theme.appColors.background}
                />
                <RootNavigator />
              </NavigationContainer>
            </ToastProvider>
          </SafeAreaProvider>
        </ErrorBoundary>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default App;
