import { supabase } from '@/lib/supabase';
import type {
  Due,
  DueAssignment,
  DuePayment,
  DuePaymentMethod,
  House,
  Profile,
  RtUnit,
  RwUnit,
} from '@/types/database';
import { logAuditAction } from '@/services/audit';

export interface DueAssignmentWithDetails extends DueAssignment {
  due?: Due;
  house?: House;
  payments?: DuePayment[];
}

export interface PendingPaymentItem extends DuePayment {
  paid_by?: Profile;
  assignment?: DueAssignment & {
    due?: Due;
    house?: House & { rt?: RtUnit; rw?: RwUnit };
  };
  proof_url?: string | null;
}

/**
 * Get all active dues types (PRD v2 §13.1)
 */
export async function getDues(): Promise<{ data: Due[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('dues')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data || []) as Due[], error: null };
}

/**
 * Get billings assigned to user's house (PRD v2 §13.2)
 */
export async function getMyHouseDues(
  houseId: string
): Promise<{ data: DueAssignmentWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('due_assignments')
      .select('*, due:dues(*), payments:due_payments(*)')
      .eq('house_id', houseId)
      .order('period_start', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as any, error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Get all due assignments with optional filter (for RT/RW/Developer monitoring)
 */
export async function getDueAssignments(filters?: {
  status?: string;
  houseId?: string;
  rwId?: string;
  rtId?: string;
  limit?: number;
}): Promise<{ data: DueAssignmentWithDetails[]; error: Error | null }> {
  let query = supabase
    .from('due_assignments')
    .select('*, due:dues(*), house:houses!inner(*, rt:rt_units(*), rw:rw_units(*)), payments:due_payments(*)')
    .order('period_start', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.houseId) {
    query = query.eq('house_id', filters.houseId);
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
 * Upload payment proof to private bucket 'payment-proofs' (PRD v2 §29)
 */
export async function uploadPaymentProof(
  paymentId: string,
  uri: string
): Promise<{ path: string | null; error: Error | null }> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const filePath = `${paymentId}/proof_${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) return { path: null, error: new Error(error.message) };
    return { path: filePath, error: null };
  } catch (err: any) {
    return { path: null, error: new Error(err.message || 'Gagal mengunggah bukti bayar') };
  }
}

/**
 * Get signed URL for viewing payment proof in private bucket (PRD v2 §29)
 */
export async function getPaymentProofUrl(
  path: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 3600);

    if (error) return { url: null, error: new Error(error.message) };
    return { url: data.signedUrl, error: null };
  } catch (err: any) {
    return { url: null, error: new Error(err.message) };
  }
}

/**
 * Submit payment for a bill (PRD v2 §13.3 & §27)
 */
export async function submitDuePayment(params: {
  assignmentId: string;
  paidByUserId: string;
  amount: number;
  method?: DuePaymentMethod;
  proofPath?: string | null;
}): Promise<{ data: DuePayment | null; error: Error | null }> {
  try {
    // 1. Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('due_payments')
      .insert({
        assignment_id: params.assignmentId,
        paid_by_user_id: params.paidByUserId,
        amount: params.amount,
        method: params.method || 'manual',
        proof_path: params.proofPath || null,
        status: 'pending_verification',
      })
      .select()
      .single();

    if (paymentError) {
      return { data: null, error: new Error(paymentError.message) };
    }

    // 2. Update assignment status to pending_verification
    await supabase
      .from('due_assignments')
      .update({
        status: 'pending_verification',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.assignmentId);

    return { data: payment as DuePayment, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Verify payment (Verifier: RT / RW / Developer) (PRD v2 §27)
 */
export async function verifyDuePayment(params: {
  paymentId: string;
  assignmentId: string;
  status: 'approved' | 'rejected';
  verifiedBy: string;
  rejectionReason?: string;
}): Promise<{ error: Error | null }> {
  try {
    const isApproved = params.status === 'approved';

    // 1. Update due_payments
    const { error: payError } = await supabase
      .from('due_payments')
      .update({
        status: params.status,
        verified_by: params.verifiedBy,
        verified_at: new Date().toISOString(),
        rejection_reason: params.rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.paymentId);

    if (payError) return { error: new Error(payError.message) };

    // 2. Update due_assignments
    const { error: assignError } = await supabase
      .from('due_assignments')
      .update({
        status: isApproved ? 'paid' : 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.assignmentId);

    if (assignError) return { error: new Error(assignError.message) };

    // Record verification into audit logs
    await logAuditAction({
      actorId: params.verifiedBy,
      action: isApproved ? 'due_payment_approved' : 'due_payment_rejected',
      entityType: 'due_payment',
      entityId: params.paymentId,
      metadata: {
        assignment_id: params.assignmentId,
        rejection_reason: params.rejectionReason,
      },
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message) };
  }
}

/**
 * Format currency to Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Create a new due master definition (PRD v2 §13.1)
 */
export async function createDue(params: {
  name: string;
  description?: string;
  amount: number;
  dueType?: string;
  frequency?: 'monthly' | 'one_time';
}): Promise<{ data: Due | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('dues')
      .insert({
        name: params.name,
        description: params.description || null,
        amount: params.amount,
        due_type: params.dueType || 'general',
        frequency: params.frequency || 'monthly',
        status: 'active',
      })
      .select()
      .single();

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Due, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Generate monthly batch billing assignments for occupied houses (Atomic & Idempotent via RPC)
 */
export async function generateDueBatch(params: {
  dueId: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  dueDate: string;     // YYYY-MM-DD
  amount: number;
  rwId?: string;
  rtId?: string;
}): Promise<{ data: { generated_count: number; skipped_count: number } | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('generate_due_batch', {
      p_due_id: params.dueId,
      p_period_start: params.periodStart,
      p_period_end: params.periodEnd,
      p_due_date: params.dueDate,
      p_amount: params.amount,
      p_rw_id: params.rwId || null,
      p_rt_id: params.rtId || null,
    });

    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as { generated_count: number; skipped_count: number }, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

