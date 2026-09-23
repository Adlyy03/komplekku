import React, { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import {
  House,
  Storefront,
  Receipt,
  ChatCircle,
  UserCircle,
  Users,
  WarningCircle,
} from 'phosphor-react-native';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { LoadingState } from '@/components/ui/LoadingState';
import { Colors, TAB_BAR_HEIGHT } from '@/constants/theme';
import { getUnreadMessagesCount } from '@/services/chat';
import { isModuleEnabled } from '@/config/modules';

/**
 * Role-Based Main app tab layout — UPGRADE_ROADMAP_V3 Phase 3 & desain.md §11
 * Dynamic tabs tailored strictly to user role (warga, rt, rw, developer)
 */
export default function MainLayout() {
  const { session, user, loading, initialized } = useSupabase();
  const { isDeveloper, isRw, isRt } = useComplex();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    let isMounted = true;
    getUnreadMessagesCount(currentUserId)
      .then((count) => {
        if (isMounted) {
          setUnreadChatCount(count);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      getUnreadMessagesCount(currentUserId)
        .then((count) => {
          if (isMounted) {
            setUnreadChatCount(count);
          }
        })
        .catch(() => {});
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  if (!initialized || loading) {
    return <LoadingState />;
  }

  // Not authenticated — redirect to auth
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const isManagement = isDeveloper || isRw || isRt;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary[600],
        tabBarInactiveTintColor: Colors.stone[400],
        tabBarStyle: {
          backgroundColor: Colors.stone[0],
          borderTopWidth: 1,
          borderTopColor: Colors.stone[100],
          height: TAB_BAR_HEIGHT + 8,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      {/* 1. Beranda / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: isDeveloper
            ? 'Ringkasan'
            : isRw
            ? 'Dashboard RW'
            : isRt
            ? 'Dashboard RT'
            : 'Beranda',
          tabBarLabel: isDeveloper
            ? 'Ringkasan'
            : isRw
            ? 'Dashboard RW'
            : isRt
            ? 'Dashboard RT'
            : 'Beranda',
          tabBarIcon: ({ color, focused }) => (
            <House
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 2. Warga & Rumah (RT & RW Tab) */}
      <Tabs.Screen
        name="warga"
        options={{
          href: (isRw || isRt) && isModuleEnabled('residents') ? '/(main)/warga' : null,
          title: isRw ? 'Warga RW' : 'Warga RT',
          tabBarLabel: isRw ? 'Warga RW' : 'Warga RT',
          tabBarIcon: ({ color, focused }) => (
            <Users
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 3. Manajemen Komplek (Developer Tab) */}
      <Tabs.Screen
        name="admin"
        options={{
          href: isDeveloper ? '/(main)/admin' : null,
          title: 'Manajemen',
          tabBarLabel: 'Manajemen',
          tabBarIcon: ({ color, focused }) => (
            <Users
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 4. Iuran & Keuangan (All roles, different labels) */}
      <Tabs.Screen
        name="iuran"
        options={{
          href: isModuleEnabled('dues') ? '/(main)/iuran' : null,
          title: isDeveloper ? 'Keuangan' : isManagement ? 'Iuran & Kas' : 'Iuran',
          tabBarLabel: isDeveloper ? 'Keuangan' : isManagement ? 'Iuran & Kas' : 'Iuran',
          tabBarIcon: ({ color, focused }) => (
            <Receipt
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 5. Marketplace (Warga Primary Tab) */}
      <Tabs.Screen
        name="marketplace"
        options={{
          href: !isManagement && isModuleEnabled('marketplace') ? '/(main)/marketplace' : null,
          title: 'Marketplace',
          tabBarLabel: 'Marketplace',
          tabBarIcon: ({ color, focused }) => (
            <Storefront
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 6. Pengaduan (All roles) */}
      <Tabs.Screen
        name="pengaduan"
        options={{
          href: isModuleEnabled('complaints') ? '/(main)/pengaduan' : null,
          title: 'Pengaduan',
          tabBarLabel: 'Pengaduan',
          tabBarIcon: ({ color, focused }) => (
            <WarningCircle
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* 7. Profil (All roles) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <UserCircle
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />

      {/* Secondary Screens (Accessible via links, hidden from Tab Bar) */}
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <ChatCircle
              size={24}
              color={color as string}
              weight={focused ? 'fill' : 'regular'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
