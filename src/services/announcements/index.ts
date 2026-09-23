import { supabase } from '@/lib/supabase';
import type {
  Announcement,
  AnnouncementTarget,
  Profile,
  RtUnit,
  RwUnit,
} from '@/types/database';

export interface AnnouncementWithAuthor extends Announcement {
  author?: Profile;
  target_rw?: RwUnit;
  target_rt?: RtUnit;
}

/**
 * Get published announcements for user scope (PRD v2 §12)
 */
export async function getAnnouncements(filters?: {
  rwId?: string | null;
  rtId?: string | null;
  limit?: number;
}): Promise<{ data: AnnouncementWithAuthor[]; error: Error | null }> {
  try {
    let query = supabase
      .from('announcements')
      .select('*, author:profiles(*)')
      .eq('status', 'published')
      .lte('publish_at', new Date().toISOString())
      .order('publish_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };

    // In-memory target scope filter if RLS hasn't filtered
    if (filters?.rwId || filters?.rtId) {
      const filtered = (data || []).filter((a: any) => {
        if (a.target_type === 'complex') return true;
        if (a.target_type === 'rw' && filters.rwId && a.target_rw_id === filters.rwId) return true;
        if (a.target_type === 'rt' && filters.rtId && a.target_rt_id === filters.rtId) return true;
        return false;
      });
      return { data: filtered as any, error: null };
    }

    return { data: (data || []) as any, error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Get announcement by ID
 */
export async function getAnnouncementDetail(
  id: string
): Promise<{ data: AnnouncementWithAuthor | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles(*)')
    .eq('id', id)
    .single();

  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as any, error: null };
}

/**
 * Create announcement (Developer/RW/RT only) (PRD v2 §12)
 */
export async function createAnnouncement(params: {
  authorId: string;
  title: string;
  body: string;
  imagePath?: string | null;
  targetType: AnnouncementTarget;
  targetRwId?: string | null;
  targetRtId?: string | null;
  publishAt?: string;
  expiresAt?: string | null;
}): Promise<{ data: Announcement | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      author_id: params.authorId,
      title: params.title.trim(),
      body: params.body.trim(),
      image_path: params.imagePath || null,
      target_type: params.targetType,
      target_rw_id: params.targetRwId || null,
      target_rt_id: params.targetRtId || null,
      status: 'published',
      publish_at: params.publishAt || new Date().toISOString(),
      expires_at: params.expiresAt || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: new Error(error.message) };

  // Dispatch notifications to residents
  try {
    const { data: usersToNotify } = await supabase.from('profiles').select('id');
    if (usersToNotify && usersToNotify.length > 0) {
      const notifs = usersToNotify.map((u) => ({
        user_id: u.id,
        type: 'announcement',
        title: `Pengumuman: ${params.title.trim()}`,
        body: params.body.trim().slice(0, 120),
        data: { announcement_id: data.id },
      }));
      await supabase.from('notifications').insert(notifs);
    }
  } catch {
    // Non-blocking notification dispatch
  }

  return { data: data as Announcement, error: null };
}
