import React, {useEffect} from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PaperProvider} from 'react-native-paper';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {DarkTheme, LightTheme} from '@/constants/theme';
import {getDatabase} from '@/database/db';
import RootNavigator from '@/navigation/RootNavigator';
import {ToastProvider} from '@/components/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';

const queryClient = new QueryClient();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? DarkTheme : LightTheme;

  useEffect(() => {
    getDatabase();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <ToastProvider>
                <NavigationContainer>
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
