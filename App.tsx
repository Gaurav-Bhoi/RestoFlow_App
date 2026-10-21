import React from 'react';
import { LocalizationProvider } from './src/localization/LocalizationProvider';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from './src/app/FeedbackProvider';
import { AppNavigator } from './src/app/AppNavigator';
import { RestaurantProvider } from './src/features/restaurant/RestaurantProvider';
import { SessionProvider } from './src/features/auth/SessionProvider';
import { Provider } from 'react-redux';
import { store } from './src/store';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <LocalizationProvider>
          <FeedbackProvider>
            <SessionProvider>
              <RestaurantProvider>
                <AppNavigator />
              </RestaurantProvider>
            </SessionProvider>
          </FeedbackProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

// Importing the SDK initializes its native module, so load it only for OTA builds.
export default __DEV__
  ? App
  : require('react-native-stallion').withStallion(App);
