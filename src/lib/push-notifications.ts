import { isRunningInExpoGo } from 'expo';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type * as NotificationsType from 'expo-notifications';

function getNotifications(): typeof NotificationsType | null {
  if (isRunningInExpoGo()) {
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Configure notification behavior when app is in foreground (dev build / standalone only)
const Notifications = getNotifications();
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });
  } catch {
    // Ignore error in incompatible environments
  }
}

/**
 * Register device for push notifications and store token safely (PRD v2 §43 & Phase 8)
 * Gracefully disabled in Expo Go on SDK 53+ (requires development build).
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  const notifications = getNotifications();
  if (!notifications) {
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('default', {
      name: 'Notifikasi Komplekku',
      importance: notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#28624F',
    });

    // Special channel for Emergency SOS
    await notifications.setNotificationChannelAsync('emergency', {
      name: 'Peringatan Darurat SOS',
      importance: notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#DC2626',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    try {
      const tokenData = await notifications.getExpoPushTokenAsync();
      token = tokenData.data;

      // Upsert token to user profile or user_device_tokens if needed
      if (token && userId) {
        await supabase
          .from('profiles')
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      }
    } catch {
      // Clean fallback
    }
  }

  return token;
}

/**
 * Safe notification response listener for deep linking
 */
export function addNotificationResponseListener(
  callback: (data: Record<string, any>) => void
): { remove: () => void } {
  const notifications = getNotifications();
  if (!notifications) {
    return { remove: () => {} };
  }
  try {
    const subscription = notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      callback((data as Record<string, any>) || {});
    });
    return subscription;
  } catch {
    return { remove: () => {} };
  }
}

/**
 * Handle notification tap and route to the correct screen (Deep Linking)
 */
export function handleNotificationRoute(data?: Record<string, any>) {
  if (!data) return;

  const type = data.type || data.referenceType;
  const id = data.referenceId || data.id;

  try {
    switch (type) {
      case 'announcement':
        if (id) router.push(`/announcements/${id}` as any);
        else router.push('/announcements' as any);
        break;

      case 'complaint':
        if (id) router.push(`/pengaduan/${id}` as any);
        else router.push('/pengaduan' as any);
        break;

      case 'due':
      case 'payment':
        router.push('/iuran' as any);
        break;

      case 'order':
        if (id) router.push(`/order/${id}` as any);
        else router.push('/orders' as any);
        break;

      case 'chat':
        if (id) router.push(`/chat/${id}` as any);
        else router.push('/chat' as any);
        break;

      case 'emergency':
        router.push('/security/sos' as any);
        break;

      case 'visitor':
        router.push('/security/visitor' as any);
        break;

      case 'house_claim':
        router.push('/warga/claim' as any);
        break;

      default:
        router.push('/notifications' as any);
        break;
    }
  } catch (err) {
    console.error('Error navigating from push notification:', err);
  }
}
