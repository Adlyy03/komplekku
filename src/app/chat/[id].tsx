import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaretLeft, PaperPlaneRight, Bag } from 'phosphor-react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useSupabase } from '@/lib/supabase-provider';
import {
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  subscribeToMessages,
} from '@/services/chat';
import { getProductById, formatRupiah, ProductWithDetails } from '@/services/products';
import { supabase } from '@/lib/supabase';
import { DesktopShell, useIsDesktop } from '@/components/ui/DesktopShell';
import type { Message } from '@/types/database';

export default function ChatRoomScreen() {
  const isDesktop = useIsDesktop();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id, productId } = useLocalSearchParams<{ id: string; productId?: string }>();
  const { user } = useSupabase();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [counterpart, setCounterpart] = useState<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    block?: string;
  } | null>(null);
  const [listingContext, setListingContext] = useState<ProductWithDetails | null>(null);

  const flatListRef = useRef<FlatList>(null);

  // Load counterpart profile from conversation_participants
  const loadParticipants = useCallback(async () => {
    if (!id || !user) return;
    const { data } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        profile:profiles(
          id,
          full_name,
          avatar_path,
          household_members(
            house:houses(block, house_number)
          )
        )
      `)
      .eq('conversation_id', id);

    if (data) {
      const other = data.find((p: any) => p.user_id !== user.id);
      if (other && (other as any).profile) {
        const prof = (other as any).profile;
        const house = prof.household_members?.[0]?.house;
        setCounterpart({
          id: prof.id,
          full_name: prof.full_name,
          avatar_url: prof.avatar_path || null,
          block: house?.block ? `Blok ${house.block}${house.house_number ? ` / ${house.house_number}` : ''}` : undefined,
        });
      }
    }
  }, [id, user]);

  // Load product if passed via param
  const loadProductContext = useCallback(async () => {
    if (!productId) return;
    const { data } = await getProductById(productId);
    if (data) {
      setListingContext(data);
    }
  }, [productId]);

  // Load messages & mark read
  const loadMessages = useCallback(async () => {
    if (!id || !user) return;
    const { data } = await getConversationMessages(id);
    if (data) {
      setMessages(data);
      await markMessagesAsRead(id, user.id);
    }
  }, [id, user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadParticipants();
      loadProductContext();
      loadMessages();
    });
  }, [loadParticipants, loadProductContext, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = subscribeToMessages(id, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        markMessagesAsRead(id, user.id);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id, user]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !id || !user || sending) return;

    setSending(true);
    setInputText('');

    const { data: sentMsg } = await sendMessage(id, user.id, text);
    if (sentMsg) {
      setMessages((prev) => [...prev, sentMsg]);

      // Create notification for counterpart if available
      if (counterpart) {
        await supabase.from('notifications').insert({
          user_id: counterpart.id,
          type: 'chat',
          title: user.user_metadata?.full_name || 'Pesan baru',
          body: text,
          reference_type: 'conversation',
          reference_id: id,
        });
      }
    }
    setSending(false);
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  const renderMessageBubble = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const timeStr = new Date(item.created_at).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextSent : styles.bubbleTextReceived]}>
            {item.message}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}>
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  const initial = (counterpart?.full_name || 'W')[0]?.toUpperCase() || 'W';
  const showQuickReplies = messages.length <= 2;

  return (
    <DesktopShell
      activeKey="/chat"
      pageTitle={counterpart?.full_name ? `Chat: ${counterpart.full_name}` : 'Obrolan'}
      breadcrumb={['Pesan', counterpart?.full_name || 'Obrolan']}
    >
      <KeyboardAvoidingView
        style={[styles.container, !isDesktop && { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Top Bar */}
        {!isDesktop && (
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/chat' as any))}
              style={styles.backBtn}
              accessibilityLabel="Kembali"
            >
              <CaretLeft size={24} color={Colors.stone[800]} />
            </TouchableOpacity>

            <View style={styles.counterpartAvatarContainer}>
              {counterpart?.avatar_url ? (
                <Image
                  source={{ uri: counterpart.avatar_url }}
                  style={styles.topAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.topAvatarFallback}>
                  <Text style={styles.topAvatarInitial}>{initial}</Text>
                </View>
              )}
            </View>

            <View style={styles.topBarInfo}>
              <Text style={styles.topBarName} numberOfLines={1}>
                {counterpart?.full_name || 'Warga Komplek'}
              </Text>
              {counterpart?.block && (
                <Text style={styles.topBarBlock} numberOfLines={1}>
                  {counterpart.block}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Persistent Listing Context Card */}
        {listingContext && (
          <View style={[styles.contextCard, isDesktop && styles.desktopContextCard]}>
            <View style={styles.contextCardContent}>
              {listingContext.images?.[0]?.storage_path || listingContext.images?.[0]?.image_url ? (
                <Image
                  source={{ uri: (listingContext.images[0].storage_path || listingContext.images[0].image_url)! }}
                  style={styles.contextCardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.contextCardImageFallback}>
                  <Bag size={20} color={Colors.stone[400]} />
                </View>
              )}
              <View style={styles.contextCardInfo}>
                <Text style={styles.contextCardTitle} numberOfLines={1}>
                  {listingContext.name}
                </Text>
                <Text style={styles.contextCardPrice}>
                  {formatRupiah(listingContext.price)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.contextCardAction}
              onPress={() => router.push(`/product/${listingContext.id}` as any)}
            >
              <Text style={styles.contextCardActionText}>Lihat listing</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageBubble}
          contentContainerStyle={[
            styles.messageListContent,
            isDesktop && styles.desktopMessageList,
            { paddingBottom: Spacing[4] },
          ]}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          onLayout={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Quick replies */}
        {showQuickReplies && (
          <View style={[styles.quickRepliesContainer, isDesktop && styles.desktopQuickReplies]}>
            {['Masih ada?', 'Bisa COD?', 'Nego bisa?'].map((qr) => (
              <TouchableOpacity
                key={qr}
                style={styles.quickReplyChip}
                onPress={() => handleQuickReply(qr)}
              >
                <Text style={styles.quickReplyText}>{qr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Composer */}
        <View style={[styles.composer, isDesktop && styles.desktopComposer, { paddingBottom: Math.max(isDesktop ? Spacing[2] : insets.bottom, Spacing[2]) }]}>
          <TextInput
            style={styles.composerInput}
            placeholder="Tulis pesan..."
            placeholderTextColor={Colors.stone[400]}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || sending) && styles.sendBtnDisabled,
            ]}
            disabled={!inputText.trim() || sending}
            onPress={() => handleSend()}
          >
            <PaperPlaneRight
              size={18}
              weight="fill"
              color={inputText.trim() && !sending ? Colors.stone[0] : Colors.stone[400]}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </DesktopShell>
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
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[200],
    backgroundColor: Colors.stone[0],
  },
  backBtn: {
    padding: Spacing[1],
    marginRight: Spacing[1],
  },
  counterpartAvatarContainer: {
    marginRight: Spacing[2],
  },
  topAvatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
  },
  topAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topAvatarInitial: {
    ...Typography.bodyM,
    fontWeight: '700',
    color: Colors.primary[700],
  },
  topBarInfo: {
    flex: 1,
  },
  topBarName: {
    ...Typography.bodyL,
    fontWeight: '700',
    color: Colors.stone[900],
  },
  topBarBlock: {
    ...Typography.bodyS,
    color: Colors.stone[500],
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.stone[50],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.stone[200],
  },
  contextCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing[2],
  },
  contextCardImage: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    marginRight: Spacing[2],
  },
  contextCardImageFallback: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.stone[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
  },
  contextCardInfo: {
    flex: 1,
  },
  contextCardTitle: {
    ...Typography.bodyS,
    fontWeight: '600',
    color: Colors.stone[800],
  },
  contextCardPrice: {
    ...Typography.bodyS,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  contextCardAction: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.stone[200],
  },
  contextCardActionText: {
    ...Typography.bodyS,
    fontWeight: '500',
    color: Colors.stone[700],
  },
  messageListContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
  },
  bubbleWrapper: {
    marginBottom: Spacing[2],
    maxWidth: '75%',
  },
  bubbleWrapperRight: {
    alignSelf: 'flex-end',
  },
  bubbleWrapperLeft: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  bubbleSent: {
    backgroundColor: Colors.primary[600],
    borderBottomRightRadius: 2,
  },
  bubbleReceived: {
    backgroundColor: Colors.stone[100],
    borderBottomLeftRadius: 2,
  },
  bubbleText: {
    ...Typography.bodyM,
    lineHeight: 20,
  },
  bubbleTextSent: {
    color: Colors.stone[0],
  },
  bubbleTextReceived: {
    color: Colors.stone[900],
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeSent: {
    color: Colors.stone[200],
  },
  bubbleTimeReceived: {
    color: Colors.stone[400],
  },
  quickRepliesContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    gap: Spacing[1],
    backgroundColor: Colors.stone[0],
  },
  quickReplyChip: {
    backgroundColor: Colors.stone[100],
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  quickReplyText: {
    ...Typography.bodyS,
    color: Colors.stone[700],
    fontWeight: '500',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
    backgroundColor: Colors.stone[0],
    borderTopWidth: 1,
    borderTopColor: Colors.stone[200],
    gap: Spacing[2],
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.stone[50],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1],
    ...Typography.bodyM,
    color: Colors.stone[900],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.stone[200],
  },
  desktopMessageList: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  desktopComposer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    borderRadius: Radius.lg,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.stone[200],
  },
  desktopContextCard: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    borderRadius: Radius.md,
    marginTop: Spacing[2],
  },
  desktopQuickReplies: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
});
