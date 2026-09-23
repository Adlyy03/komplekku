import { supabase } from '@/lib/supabase';
import type { HouseClaim, HouseClaimOccupancy, House, Profile } from '@/types/database';
import { logAuditAction } from '@/services/audit';
import { createNotification } from '@/services/notifications';

export interface HouseClaimWithDetails extends HouseClaim {
  house?: House;
  user?: Profile;
}

/**
 * Submit a new self-onboarding house claim (PRD v2 §10 & Roadmap Phase 6)
 */
export async function submitHouseClaim(params: {
  userId: string;
  houseId: string;
  occupancyStatus: HouseClaimOccupancy;
  notes?: string;
  documentUrl?: string;
}): Promise<{ data: HouseClaim | null; error: Error | null }> {
  try {
    // Check if user already has an active pending claim for this house
    const { data: existing, error: checkError } = await supabase
      .from('house_claims')
      .select('id')
      .eq('user_id', params.userId)
      .eq('house_id', params.houseId)
      .eq('status', 'pending')
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return {
        data: null,
        error: new Error('Anda sudah memiliki pengajuan klaim yang sedang diproses untuk rumah ini.'),
      };
    }

    const { data, error } = await supabase
      .from('house_claims')
      .insert({
        user_id: params.userId,
        house_id: params.houseId,
        occupancy_status: params.occupancyStatus,
        notes: params.notes || null,
        document_url: params.documentUrl || null,
        status: 'pending',
      })
      .select('*, house:houses(*)')
      .single();

    if (error) return { data: null, error: new Error(error.message) };

    await logAuditAction({
      actorId: params.userId,
      action: 'house_claim_submitted',
      entityType: 'house_claim',
      entityId: data.id,
      metadata: {
        house_id: params.houseId,
        occupancy_status: params.occupancyStatus,
      },
    });

    return { data: data as HouseClaimWithDetails, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal mengajukan klaim rumah') };
  }
}

/**
 * Get all claims submitted by the current user
 */
export async function getMyClaims(
  userId: string
): Promise<{ data: HouseClaimWithDetails[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('house_claims')
      .select('*, house:houses(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as HouseClaimWithDetails[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Get pending claims for review (RT / RW / Developer)
 */
export async function getPendingClaims(): Promise<{
  data: HouseClaimWithDetails[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('house_claims')
      .select('*, house:houses(*), user:profiles!user_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) return { data: [], error: new Error(error.message) };
    return { data: (data || []) as HouseClaimWithDetails[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Review claim: approve or reject (RT / RW / Developer)
 */
export async function reviewHouseClaim(params: {
  claimId: string;
  userId: string;
  houseId: string;
  occupancyStatus: HouseClaimOccupancy;
  status: 'approved' | 'rejected';
  reviewedBy: string;
  rejectionReason?: string;
}): Promise<{ error: Error | null }> {
  try {
    const isApproved = params.status === 'approved';

    // 1. Update house_claim
    const { error: claimErr } = await supabase
      .from('house_claims')
      .update({
        status: params.status,
        reviewed_by: params.reviewedBy,
        reviewed_at: new Date().toISOString(),
        rejection_reason: params.rejectionReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.claimId);

    if (claimErr) throw claimErr;

    // 2. If approved, establish household membership and update house status
    if (isApproved) {
      // Upsert household member
      await supabase.from('household_members').upsert(
        {
          house_id: params.houseId,
          user_id: params.userId,
          relationship: params.occupancyStatus === 'owner' ? 'owner' : params.occupancyStatus === 'renter' ? 'tenant' : 'family',
          is_primary: params.occupancyStatus === 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'house_id,user_id' }
      );

      // Set house status to occupied
      await supabase
        .from('houses')
        .update({ status: 'occupied', updated_at: new Date().toISOString() })
        .eq('id', params.houseId);

      // Set user profile to verified and active
      await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          resident_status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.userId);
    }

    // 3. Log audit action
    await logAuditAction({
      actorId: params.reviewedBy,
      action: isApproved ? 'house_claim_approved' : 'house_claim_rejected',
      entityType: 'house_claim',
      entityId: params.claimId,
      metadata: {
        user_id: params.userId,
        house_id: params.houseId,
        rejection_reason: params.rejectionReason,
      },
    });

    // 4. Send notification to resident
    await createNotification({
      userId: params.userId,
      type: 'system',
      title: isApproved ? 'Klaim Rumah Disetujui' : 'Klaim Rumah Ditolak',
      body: isApproved
        ? 'Pengurus telah menyetujui klaim rumah Anda. Kini akun Anda telah terhubung resmi.'
        : `Pengurus menolak klaim rumah: ${params.rejectionReason || 'Data tidak sesuai.'}`,
      referenceType: 'house_claim',
      referenceId: params.claimId,
    });

    return { error: null };
  } catch (err: any) {
    return { error: new Error(err.message || 'Gagal memproses klaim rumah') };
  }
}
