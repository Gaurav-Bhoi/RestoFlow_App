import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from './src/app/FeedbackProvider';
import { AppNavigator } from './src/app/AppNavigator';
import { RestaurantProvider } from './src/features/restaurant/RestaurantProvider';
import { SessionProvider } from './src/features/auth/SessionProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <FeedbackProvider>
        <RestaurantProvider>
          <SessionProvider>
            <AppNavigator />
          </SessionProvider>
        </RestaurantProvider>
      </FeedbackProvider>
    </SafeAreaProvider>
  );
}
