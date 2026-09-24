import { useEffect } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SupabaseProvider, useSupabase } from '@/lib/supabase-provider';
import { ComplexProvider } from '@/lib/complex-provider';
import { CartProvider } from '@/lib/cart-provider';
import { registerForPushNotificationsAsync,
  handleNotificationRoute,
  addNotificationResponseListener,
} from '@/lib/push-notifications';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { PopupModal } from '@/components/ui/PopupModal';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppNotificationManager({ children }: { children: React.ReactNode }) {
  const { user } = useSupabase();

  useEffect(() => {
    if (user?.id) {
      void registerForPushNotificationsAsync(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const responseListener = addNotificationResponseListener((data) => {
      handleNotificationRoute(data);
    });

    return () => {
      responseListener.remove();
    };
  }, []);

  return (
    <>
      <OfflineBanner />
      <PopupModal />
      {children}
    </>
  );
}

/**
 * Root layout — wraps entire app with:
 * 1. Font loading (Fraunces + Inter per desain.md §4)
 * 2. SupabaseProvider for auth state
 * 3. ComplexProvider for complex settings, household & role management
 * 4. CartProvider for cart state
 * 5. AppNotificationManager for push notifications & deep-links
 * 6. Slot renders the matched route group ((auth) or (main))
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SupabaseProvider>
      <ComplexProvider>
        <CartProvider>
          <AppNotificationManager>
            <Slot />
          </AppNotificationManager>
        </CartProvider>
      </ComplexProvider>
    </SupabaseProvider>
  );
}

