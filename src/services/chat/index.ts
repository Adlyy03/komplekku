import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile } from '@/types/database';

export interface ConversationListItem {
  id: string;
  communityId?: string;
  counterpart: Pick<Profile, 'id' | 'full_name' | 'avatar_path'>;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

/**
 * Get or create a 1-on-1 conversation between buyer & seller (PRD v2 §15)
 */
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  _communityId?: string
): Promise<{ data: Conversation | null; error: Error | null }> {
  // 1. Check if a conversation between these two already exists
  const { data: user1Convs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId1);

  if (user1Convs && user1Convs.length > 0) {
    const convIds = user1Convs.map((c) => c.conversation_id);
    const { data: matched } = await supabase
      .from('conversation_participants')
      .select('conversation:conversations (*)')
      .eq('user_id', userId2)
      .in('conversation_id', convIds);

    if (matched && matched.length > 0) {
      const validConv = matched[0];
      if (validConv && (validConv as any).conversation) {
        return { data: (validConv as any).conversation as unknown as Conversation, error: null };
      }
    }
  }

  // 2. Create new conversation
  const { data: newConv, error: createErr } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (createErr || !newConv) {
    return { data: null, error: new Error(createErr?.message || 'Gagal memulai percakapan') };
  }

  // 3. Add both participants
  await supabase.from('conversation_participants').insert([
    { conversation_id: newConv.id, user_id: userId1 },
    { conversation_id: newConv.id, user_id: userId2 },
  ]);

  return { data: newConv as Conversation, error: null };
}

/**
 * Get all conversations for current user with last message and counterpart profile (PRD v2 §15)
 */
export async function getUserConversations(
  userId: string
): Promise<{ data: ConversationListItem[]; error: Error | null }> {
  // 1. Get all conversation IDs user participates in
  const { data: userConvs, error: partErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (partErr || !userConvs || userConvs.length === 0) {
    return { data: [], error: null };
  }

  const convIds = userConvs.map((c) => c.conversation_id);

  // 2. Fetch conversations, all participants, and last messages
  const { data: convData, error: convErr } = await supabase
    .from('conversations')
    .select(`
      id,
      updated_at,
      participants:conversation_participants (
        user_id,
        profile:profiles (id, full_name, avatar_path)
      ),
      messages (id, sender_id, message, read_at, created_at)
    `)
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (convErr) {
    return { data: [], error: new Error(convErr.message) };
  }

  const formatted: ConversationListItem[] = (convData || []).map((c: any) => {
    // Find counterpart (the participant that isn't current user)
    const counterpartPart = (c.participants || []).find((p: any) => p.user_id !== userId);
    const counterpart = counterpartPart?.profile || {
      id: counterpartPart?.user_id || 'unknown',
      full_name: 'Warga Komplek',
      avatar_path: null,
    };

    // Sort messages by created_at desc to find latest
    const msgs = (c.messages || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const lastMessage = msgs[0] || null;

    // Count unread messages not sent by current user
    const unreadCount = msgs.filter(
      (m: any) => m.sender_id !== userId && !m.read_at
    ).length;

    return {
      id: c.id,
      counterpart,
      lastMessage,
      unreadCount,
      updatedAt: c.updated_at,
    };
  });

  return { data: formatted, error: null };
}

/**
 * Get total unread messages count for all user conversations (PRD v2 §15)
 */
export async function getUnreadMessagesCount(userId: string): Promise<number> {
  const { data } = await getUserConversations(userId);
  return data.reduce((acc, c) => acc + c.unreadCount, 0);
}

/**
 * Get message history for a conversation (PRD v2 §15)
 */
export async function getConversationMessages(
  conversationId: string
): Promise<{ data: Message[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: (data as Message[]) || [], error: null };
}

/**
 * Send a message and update conversation timestamp (PRD v2 §15)
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  messageText: string
): Promise<{ data: Message | null; error: Error | null }> {
  if (!messageText.trim()) {
    return { data: null, error: new Error('Pesan tidak boleh kosong') };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      message: messageText.trim(),
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Touch conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return { data: data as Message, error: null };
}

/**
 * Mark messages in a conversation as read (PRD v2 §15)
 */
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', currentUserId)
    .is('read_at', null);
}

/**
 * Subscribe to realtime incoming messages for a conversation (PRD v2 §15)
 */
export function subscribeToMessages(
  conversationId: string,
  onMessage: (msg: Message) => void
): () => void {
  const channel = supabase
    .channel(`room:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
