import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MagnifyingGlass } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import { useComplex } from '@/lib/complex-provider';
import { getUserConversations, ConversationListItem } from '@/services/chat';
import { formatTimeAgo } from '@/services/products';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';

export default function ChatListScreen() {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSupabase();
  const { complexSettings } = useComplex();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await getUserConversations(user.id);
    if (data) {
      setConversations(data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadConversations();
    });
  }, [loadConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) =>
      c.counterpart.full_name?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  const renderItem = ({ item }: { item: ConversationListItem }) => {
    const isUnread = item.unreadCount > 0;
    const lastMsgText = item.lastMessage?.message || 'Memulai percakapan baru';
    const initial = (item.counterpart.full_name || 'W')[0]?.toUpperCase() || 'W';

    return (
      <TouchableOpacity
        style={[styles.chatRow, isUnread && styles.chatRowUnread]}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${item.id}` as any)}
      >
        {/* Unread indicator bar */}
        {isUnread && <View style={styles.unreadBar} />}

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.counterpart.avatar_path ? (
            <Image
              source={{ uri: item.counterpart.avatar_path }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {item.counterpart.full_name || 'Warga Komplek'}
            </Text>
            <Text style={styles.timeText}>
              {formatTimeAgo(item.lastMessage?.created_at || item.updatedAt)}
            </Text>
          </View>

          <View style={styles.messageRow}>
            <Text
              style={[
                styles.messagePreview,
                isUnread && styles.messagePreviewUnread,
              ]}
              numberOfLines={1}
            >
              {lastMsgText}
            </Text>
            {isUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DesktopShell
      activeKey="/chat"
      pageTitle="Pesan & Percakapan"
      breadcrumb={['Pesan']}
    >
      <View style={[styles.container, !isDesktop && { paddingTop: insets.top }]}>
        {/* Top Header */}
        {!isDesktop && (
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Pesan</Text>
              {complexSettings?.name && (
                <Text style={styles.communitySub}>{complexSettings.name}</Text>
              )}
            </View>
          </View>
        )}

        {/* Search bar */}
        <View style={[styles.searchWrapper, isDesktop && styles.desktopSearchWrapper]}>
          <View style={styles.searchContainer}>
            <MagnifyingGlass size={18} color={Colors.stone[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari percakapan..."
              placeholderTextColor={Colors.stone[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* List / States */}
        {loading ? (
          <LoadingState fullScreen={false} />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            title="Belum ada percakapan"
            description="Mulai chat dari halaman Marketplace atau rincian pesanan."
          />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, isDesktop && styles.desktopListContent]}
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
    </DesktopShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.stone[0],
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
  },
  headerTitle: {
    ...Typography.displayM,
    color: Colors.stone[900],
  },
  communitySub: {
    ...Typography.bodyS,
    color: Colors.primary[700],
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  desktopSearchWrapper: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingTop: Spacing[4],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    height: 40,
    borderWidth: 1,
    borderColor: Colors.stone[200],
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyM,
    color: Colors.stone[900],
    padding: 0,
  },
  listContent: {
    paddingBottom: Spacing[8],
  },
  desktopListContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: Spacing[10],
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[100],
    position: 'relative',
  },
  chatRowUnread: {
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
  avatarContainer: {
    marginRight: Spacing[3],
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...Typography.h3,
    color: Colors.primary[700],
  },
  chatContent: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    ...Typography.bodyL,
    fontWeight: '600',
    color: Colors.stone[900],
    flex: 1,
    marginRight: Spacing[2],
  },
  timeText: {
    ...Typography.bodyS,
    color: Colors.stone[400],
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    ...Typography.bodyM,
    color: Colors.stone[500],
    flex: 1,
    marginRight: Spacing[2],
  },
  messagePreviewUnread: {
    color: Colors.stone[900],
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.primary[600],
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.stone[0],
  },
});
