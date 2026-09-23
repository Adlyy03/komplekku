import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types/database';

export interface CreateNotificationParams {
  userId: string;
  type:
    | 'order'
    | 'chat'
    | 'system'
    | 'announcement'
    | 'complaint'
    | 'due'
    | 'payment'
    | 'emergency'
    | 'visitor';
  title: string;
  body: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Fetch all notifications for a user ordered by created_at desc (PRD §43)
 */
export async function getUserNotifications(
  userId: string
): Promise<{ data: Notification[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }
  return { data: (data as Notification[]) || [], error: null };
}

/**
 * Get count of unread notifications for a user (PRD §43)
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    return { count: 0, error: new Error(error.message) };
  }
  return { count: count || 0, error: null };
}

/**
 * Mark a single notification as read (PRD §44)
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    return { success: false, error: new Error(error.message) };
  }
  return { success: true, error: null };
}

/**
 * Mark all notifications for a user as read (PRD §44 & desain.md §20)
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) {
    return { success: false, error: new Error(error.message) };
  }
  return { success: true, error: null };
}

/**
 * Create a new notification (triggered by order, chat, or admin events)
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ data: Notification | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      reference_type: params.referenceType || null,
      reference_id: params.referenceId || null,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as Notification, error: null };
}

/**
 * Subscribe to realtime incoming notifications for a user (PRD §43)
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notif: Notification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
