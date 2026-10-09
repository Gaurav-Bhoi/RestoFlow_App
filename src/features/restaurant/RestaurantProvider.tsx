import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useFeedback } from '../../app/FeedbackProvider';
import { colors } from '../../theme/tokens';
import {
  loadRestaurant,
  saveRestaurant,
} from '../../services/storage/restaurantStorage';
import { createDemoRestaurant } from './demoData';
import { restaurantReducer, type RestaurantAction } from './restaurantReducer';
import type { Restaurant } from './types';

interface RestaurantContextValue {
  restaurant: Restaurant;
  dispatch: React.Dispatch<RestaurantAction>;
}
const RestaurantContext = createContext<RestaurantContextValue | null>(null);
export function RestaurantProvider({ children }: React.PropsWithChildren) {
  const [restaurant, dispatch] = useReducer(
    restaurantReducer,
    undefined,
    createDemoRestaurant,
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const showFeedback = useFeedback();
  useEffect(() => {
    let isMounted = true;
    loadRestaurant()
      .then(saved => {
        if (isMounted && saved) {
          dispatch({ type: 'replace', restaurant: saved });
        }
      })
      .catch(() =>
        showFeedback(
          'Saved data could not be loaded. Showing the demo restaurant.',
        ),
      )
      .finally(() => {
        if (isMounted) {
          setIsLoaded(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [showFeedback]);
  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    // Serialize writes so a slower previous save cannot overwrite a newer order.
    saveQueue.current = saveQueue.current
      .then(() => saveRestaurant(restaurant))
      .catch(() =>
        showFeedback(
          'Changes are available for this session but could not be saved.',
        ),
      );
  }, [restaurant, isLoaded, showFeedback]);
  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color={colors.forest}
          accessibilityLabel="Loading restaurant"
        />
      </View>
    );
  }
  return (
    <RestaurantContext.Provider value={{ restaurant, dispatch }}>
      {children}
    </RestaurantContext.Provider>
  );
}
const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', backgroundColor: colors.paper },
});
export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant requires RestaurantProvider');
  }
  return context;
}
