import { supabase } from '@/lib/supabase';
import type {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintUpdate,
  House,
  Profile,
} from '@/types/database';
import { logAuditAction } from '@/services/audit';

export interface ComplaintWithDetails extends Complaint {
  category?: ComplaintCategory;
  reporter?: Profile;
  house?: House;
  assignee?: Profile;
  updates?: (ComplaintUpdate & { author?: Profile })[];
}

/**
 * Get all active complaint categories (PRD v2 §16)
 */
export async function getComplaintCategories(): Promise<{
  data: ComplaintCategory[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('complaint_categories')
    .select('*')
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data || []) as ComplaintCategory[], error: null };
}

/**
 * Get list of complaints with optional filter (PRD v2 §16)
 */
export async function getComplaints(filters?: {
  reporterId?: string;
  status?: ComplaintStatus;
  rwId?: string;
  rtId?: string;
  limit?: number;
}): Promise<{ data: ComplaintWithDetails[]; error: Error | null }> {
  let query = supabase
    .from('complaints')
    .select('*, category:complaint_categories(*), reporter:profiles(*), house:houses!inner(*)')
    .order('created_at', { ascending: false });

  if (filters?.reporterId) {
    query = query.eq('reporter_id', filters.reporterId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.rtId) {
    query = query.eq('house.rt_id', filters.rtId);
  }
  if (filters?.rwId) {
    query = query.eq('house.rw_id', filters.rwId);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data || []) as any, error: null };
}

/**
 * Get complaint details with updates timeline (PRD v2 §16)
 */
export async function getComplaintDetail(
  id: string
): Promise<{ data: ComplaintWithDetails | null; error: Error | null }> {
  try {
    const { data: complaint, error: complaintError } = await supabase
      .from('complaints')
      .select('*, category:complaint_categories(*), reporter:profiles(*), house:houses(*, rt:rt_units(*), rw:rw_units(*)), assignee:profiles!assigned_to(*)')
      .eq('id', id)
      .single();

    if (complaintError) return { data: null, error: new Error(complaintError.message) };

    const { data: updates } = await supabase
      .from('complaint_updates')
      .select('*, author:profiles(*)')
      .eq('complaint_id', id)
      .order('created_at', { ascending: true });

    return {
      data: {
        ...(complaint as any),
        updates: updates || [],
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Create a new complaint (PRD v2 §16)
 */
export async function createComplaint(params: {
  reporterId: string;
  categoryId: string;
  houseId?: string | null;
  title: string;
  description: string;
  locationNote?: string | null;
  priority?: ComplaintPriority;
}): Promise<{ data: Complaint | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        reporter_id: params.reporterId,
        category_id: params.categoryId,
        house_id: params.houseId || null,
        title: params.title.trim(),
        description: params.description.trim(),
        location_note: params.locationNote || null,
        priority: params.priority || 'normal',
        status: 'submitted',
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Complaint, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Update complaint status & resolution (Pengurus: RT/RW/Developer)
 */
export async function updateComplaintStatus(params: {
  id: string;
  status: ComplaintStatus;
  authorId: string;
  resolutionNote?: string | null;
  assignedTo?: string | null;
  updateBody?: string;
}): Promise<{ error: Error | null }> {
  try {
    const updates: any = {
      status: params.status,
      updated_at: new Date().toISOString(),
    };

    if (params.status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      if (params.resolutionNote) updates.resolution_note = params.resolutionNote;
    }
    if (params.assignedTo !== undefined) {
      updates.assigned_to = params.assignedTo;
    }

    const { error: complaintError } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', params.id);

    if (complaintError) return { error: new Error(complaintError.message) };

    // Record an update message in timeline
    const body = params.updateBody || `Status pengaduan diubah menjadi: ${params.status}`;
    await supabase.from('complaint_updates').insert({
      complaint_id: params.id,
      author_id: params.authorId,
      status: params.status,
      body,
    });

    // Record audit log for complaint progress
    await logAuditAction({
      actorId: params.authorId,
      action: `complaint_status_${params.status}`,
      entityType: 'complaint',
      entityId: params.id,
      metadata: {
        new_status: params.status,
        resolution_note: params.resolutionNote,
        assigned_to: params.assignedTo,
      },
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message) };
  }
}

/**
 * Add a comment or progress update to a complaint
 */
export async function addComplaintUpdate(params: {
  complaintId: string;
  authorId: string;
  body: string;
  status?: string | null;
}): Promise<{ data: ComplaintUpdate | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('complaint_updates')
    .insert({
      complaint_id: params.complaintId,
      author_id: params.authorId,
      body: params.body.trim(),
      status: params.status || null,
    })
    .select()
    .single();

  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as ComplaintUpdate, error: null };
}
