import React from 'react';
import { LocalizationProvider } from './src/localization/LocalizationProvider';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider } from './src/app/FeedbackProvider';
import { AppNavigator } from './src/app/AppNavigator';
import { RestaurantProvider } from './src/features/restaurant/RestaurantProvider';
import { SessionProvider } from './src/features/auth/SessionProvider';
import { Provider } from 'react-redux';
import { withStallion } from 'react-native-stallion';
import { store } from './src/store';

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" />
        <LocalizationProvider>
          <FeedbackProvider>
            <RestaurantProvider>
              <SessionProvider>
                <AppNavigator />
              </SessionProvider>
            </RestaurantProvider>
          </FeedbackProvider>
        </LocalizationProvider>
      </SafeAreaProvider>
    </Provider>
  );
}

// Metro development stays local. Release builds use the SDK root integration.
export default __DEV__ ? App : withStallion(App);
