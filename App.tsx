import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { QueryProvider } from './src/providers/QueryProvider';
import { startSyncService, stopSyncService } from './src/services/syncService';

// Define the dark theme
const DarkTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#C6A664', // Gold
    background: '#1C1C1C', // Deep Charcoal
    card: '#1C1C1C', // Deep Charcoal
    text: '#F3E9DC', // Warm Cream
    border: '#5A3E2B', // Oak Brown
    notification: '#D14E24', // Ember
  },
};

export default function App() {
  useEffect(() => {
    // Start the sync service when app launches
    startSyncService();

    // Clean up on unmount
    return () => {
      stopSyncService();
    };
  }, []);

  return (
    <QueryProvider>
      <SafeAreaProvider>
        <NavigationContainer theme={DarkTheme}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryProvider>
  );
}
