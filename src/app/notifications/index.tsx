import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CaretLeft,
  ChatCircle,
  Package,
  Info,
  Megaphone,
  Receipt,
  WarningCircle,
} from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from '@/services/notifications';
import { formatTimeAgo } from '@/services/products';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Notification } from '@/types/database';

type NotificationFilter = 'all' | 'order' | 'chat' | 'announcement' | 'due' | 'complaint' | 'system';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSupabase();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await getUserNotifications(user.id);
    if (data) {
      setNotifications(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadNotifications();
    });
  }, [loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => {
      unsubscribe();
    };
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
  };

  const handleNotificationPress = async (item: Notification) => {
    if (!item.read_at) {
      await markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    }

    if (item.reference_type === 'order' && item.reference_id) {
      router.push(`/order/${item.reference_id}` as any);
    } else if (item.reference_type === 'conversation' && item.reference_id) {
      router.push(`/chat/${item.reference_id}` as any);
    } else if (item.reference_type === 'product' && item.reference_id) {
      router.push(`/product/${item.reference_id}` as any);
    } else if (item.reference_type === 'announcement' && item.reference_id) {
      router.push(`/announcements/${item.reference_id}` as any);
    } else if (item.reference_type === 'complaint' && item.reference_id) {
      router.push(`/pengaduan/${item.reference_id}` as any);
    } else if (item.reference_type === 'due' || item.reference_type === 'payment') {
      router.push('/iuran' as any);
    } else if (item.reference_type === 'emergency') {
      router.push('/(main)' as any);
    } else if (item.reference_type === 'visitor') {
      router.push('/(main)' as any);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const hasUnread = notifications.some((n) => !n.read_at);

  const renderIcon = (type: Notification['type']) => {
    switch (type) {
      case 'chat':
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.primary[50] }]}>
            <ChatCircle size={20} color={Colors.primary[700]} weight="bold" />
          </View>
        );
      case 'order':
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.accent[100] }]}>
            <Package size={20} color={Colors.accent[700]} weight="bold" />
          </View>
        );
      case 'announcement':
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.secondary[50] }]}>
            <Megaphone size={20} color={Colors.secondary[700]} weight="bold" />
          </View>
        );
      case 'due':
      case 'payment':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
            <Receipt size={20} color="#B45309" weight="bold" />
          </View>
        );
      case 'complaint':
        return (
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <WarningCircle size={20} color="#DC2626" weight="bold" />
          </View>
        );
      case 'system':
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: Colors.semantic.info[50] }]}>
            <Info size={20} color={Colors.semantic.info[700]} weight="bold" />
          </View>
        );
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[styles.notificationRow, isUnread && styles.notificationRowUnread]}
        activeOpacity={0.7}
        onPress={() => handleNotificationPress(item)}
      >
        {isUnread && <View style={styles.unreadBar} />}

        {renderIcon(item.type)}

        <View style={styles.rowContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, isUnread && styles.titleTextUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timeText}>{formatTimeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.bodyText} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityLabel="Kembali"
          >
            <CaretLeft size={24} color={Colors.stone[800]} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Notifikasi</Text>
        </View>

        {hasUnread && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tandai semua dibaca</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}>
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: 'order', label: 'Pesanan' },
              { key: 'chat', label: 'Chat' },
              { key: 'system', label: 'Sistem' },
            ] as { key: NotificationFilter; label: string }[]
          ).map((chip) => {
            const active = filter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setFilter(chip.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <LoadingState fullScreen={false} />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="Belum ada notifikasi"
          description="Aktivitas pesanan, obrolan, dan informasi komplek akan tampil di sini."
        />
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary[600]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[0],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[200],
    backgroundColor: Colors.stone[0],
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: Spacing[1],
    marginRight: Spacing[2],
  },
  topBarTitle: {
    ...Typography.h2,
    color: Colors.stone[900],
  },
  markAllBtn: {
    paddingVertical: Spacing[1],
  },
  markAllText: {
    ...Typography.bodyS,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    backgroundColor: Colors.stone[0],
  },
  filterList: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.stone[100],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  chipActive: {
    backgroundColor: Colors.primary[600],
    borderColor: Colors.primary[600],
  },
  chipText: {
    ...Typography.bodyS,
    color: Colors.stone[600],
    fontWeight: '500',
  },
  chipTextActive: {
    color: Colors.stone[0],
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Spacing[8],
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    position: 'relative',
    backgroundColor: Colors.stone[0],
  },
  notificationRowUnread: {
    backgroundColor: Colors.primary[50],
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary[600],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
    marginTop: 2,
  },
  rowContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  titleText: {
    ...Typography.bodyM,
    color: Colors.stone[700],
    flex: 1,
    marginRight: Spacing[2],
  },
  titleTextUnread: {
    color: Colors.stone[900],
    fontWeight: '700',
  },
  timeText: {
    fontSize: 11,
    color: Colors.stone[400],
  },
  bodyText: {
    ...Typography.bodyS,
    color: Colors.stone[500],
    lineHeight: 18,
  },
});
