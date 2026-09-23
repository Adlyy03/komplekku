import { supabase } from '@/lib/supabase';
import type {
  EmergencyEvent,
  EmergencyType,
  EmergencyStatus,
  VisitorPass,
  VisitorPassStatus,
  House,
  Profile,
} from '@/types/database';
import { logAuditAction } from '@/services/audit';

export interface EmergencyWithDetails extends EmergencyEvent {
  house?: House;
  user?: Profile;
}

export interface VisitorPassWithDetails extends VisitorPass {
  house?: House;
  host?: Profile;
}

// ==========================================
// 1. EMERGENCY / SOS SERVICES
// ==========================================

/**
 * Trigger an SOS emergency event (PRD v2 §16 & Roadmap Phase 7A)
 */
export async function triggerEmergency(params: {
  userId: string;
  houseId?: string | null;
  rtId?: string | null;
  rwId?: string | null;
  emergencyType: EmergencyType;
  notes?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ data: EmergencyEvent | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('emergency_events')
      .insert({
        user_id: params.userId,
        house_id: params.houseId || null,
        rt_id: params.rtId || null,
        rw_id: params.rwId || null,
        emergency_type: params.emergencyType,
        status: 'active',
        notes: params.notes || null,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
      })
      .select('*, house:houses(*), user:profiles!user_id(*)')
      .single();

    if (error) return { data: null, error: new Error(error.message) };

    await logAuditAction({
      actorId: params.userId,
      action: 'emergency_triggered',
      entityType: 'emergency_event',
      entityId: data.id,
      metadata: {
        type: params.emergencyType,
        house_id: params.houseId,
      },
    });

    return { data: data as EmergencyWithDetails, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal mengirim sinyal darurat') };
  }
}

/**
 * Get all active emergencies in the complex
 */
export async function getActiveEmergencies(): Promise<{
  data: EmergencyWithDetails[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('emergency_events')
      .select('*, house:houses(*), user:profiles!user_id(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as EmergencyWithDetails[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Update emergency status (acknowledge, resolve, cancel)
 */
export async function updateEmergencyStatus(params: {
  emergencyId: string;
  status: EmergencyStatus;
  actorId: string;
}): Promise<{ error: Error | null }> {
  try {
    const updates: any = {
      status: params.status,
      updated_at: new Date().toISOString(),
    };

    if (params.status === 'acknowledged') {
      updates.acknowledged_by = params.actorId;
      updates.acknowledged_at = new Date().toISOString();
    } else if (params.status === 'resolved') {
      updates.resolved_by = params.actorId;
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('emergency_events')
      .update(updates)
      .eq('id', params.emergencyId);

    if (error) return { error: new Error(error.message) };

    await logAuditAction({
      actorId: params.actorId,
      action: `emergency_${params.status}`,
      entityType: 'emergency_event',
      entityId: params.emergencyId,
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message) };
  }
}

// ==========================================
// 2. VISITOR PASS SERVICES
// ==========================================

function generateAccessCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KMP-${num}`;
}

/**
 * Create a new digital visitor pass (PRD v2 §17 & Roadmap Phase 7B)
 */
export async function createVisitorPass(params: {
  hostUserId: string;
  houseId: string;
  guestName: string;
  guestPhone?: string;
  vehiclePlate?: string;
  visitDate: string;
  expectedDeparture?: string;
  purpose: string;
  notes?: string;
}): Promise<{ data: VisitorPass | null; error: Error | null }> {
  try {
    const accessCode = generateAccessCode();

    const { data, error } = await supabase
      .from('visitor_passes')
      .insert({
        host_user_id: params.hostUserId,
        house_id: params.houseId,
        guest_name: params.guestName,
        guest_phone: params.guestPhone || null,
        vehicle_plate: params.vehiclePlate || null,
        visit_date: params.visitDate,
        expected_departure: params.expectedDeparture || null,
        purpose: params.purpose,
        notes: params.notes || null,
        access_code: accessCode,
        status: 'expected',
      })
      .select('*, house:houses(*)')
      .single();

    if (error) return { data: null, error: new Error(error.message) };

    await logAuditAction({
      actorId: params.hostUserId,
      action: 'visitor_pass_created',
      entityType: 'visitor_pass',
      entityId: data.id,
      metadata: {
        guest_name: params.guestName,
        access_code: accessCode,
      },
    });

    return { data: data as VisitorPassWithDetails, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal membuat izin tamu') };
  }
}

/**
 * Get visitor passes created by current resident
 */
export async function getMyVisitorPasses(
  userId: string
): Promise<{ data: VisitorPassWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('visitor_passes')
      .select('*, house:houses(*)')
      .eq('host_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as VisitorPassWithDetails[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Get visitor passes for security checkpoint inspection
 */
export async function getVisitorPasses(filters?: {
  status?: VisitorPassStatus;
  searchCode?: string;
}): Promise<{ data: VisitorPassWithDetails[]; error: Error | null }> {
  try {
    let query = supabase
      .from('visitor_passes')
      .select('*, house:houses(*), host:profiles!host_user_id(*)')
      .order('visit_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.searchCode) {
      query = query.ilike('access_code', `%${filters.searchCode}%`);
    }

    const { data, error } = await query;
    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as VisitorPassWithDetails[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Security Check-in visitor
 */
export async function checkInVisitor(
  passId: string,
  guardId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('visitor_passes')
      .update({
        status: 'checked_in',
        checked_in_at: new Date().toISOString(),
        checked_by: guardId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', passId);

    if (error) return { error: new Error(error.message) };

    await logAuditAction({
      actorId: guardId,
      action: 'visitor_checked_in',
      entityType: 'visitor_pass',
      entityId: passId,
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message) };
  }
}

/**
 * Security Check-out visitor
 */
export async function checkOutVisitor(
  passId: string,
  guardId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('visitor_passes')
      .update({
        status: 'checked_out',
        checked_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', passId);

    if (error) return { error: new Error(error.message) };

    await logAuditAction({
      actorId: guardId,
      action: 'visitor_checked_out',
      entityType: 'visitor_pass',
      entityId: passId,
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message) };
  }
}
