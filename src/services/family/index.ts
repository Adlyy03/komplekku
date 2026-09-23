import { supabase } from '@/lib/supabase';
import type { FamilyMember, FamilyRelationship } from '@/types/database';
import { logAuditAction } from '@/services/audit';

export const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  head: 'Kepala Keluarga',
  spouse: 'Istri / Suami',
  child: 'Anak',
  parent: 'Orang Tua',
  sibling: 'Saudara',
  other: 'Famili / Lainnya',
};

/**
 * Fetch all registered family members for a specific house
 */
export async function getHouseFamilyMembers(
  houseId: string
): Promise<{ data: FamilyMember[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, profile:profiles(*)')
      .eq('house_id', houseId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data as FamilyMember[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message || 'Gagal memuat anggota keluarga') };
  }
}

export interface CreateFamilyMemberPayload {
  house_id: string;
  head_user_id: string;
  user_id?: string | null;
  full_name: string;
  nik?: string | null;
  relationship: FamilyRelationship;
  gender?: 'male' | 'female' | null;
  birth_place?: string | null;
  birth_date?: string | null;
  religion?: string | null;
  occupation?: string | null;
  phone?: string | null;
}

/**
 * Create a new family member under a house
 */
export async function createFamilyMember(
  payload: CreateFamilyMemberPayload
): Promise<{ data: FamilyMember | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('family_members')
      .insert({
        house_id: payload.house_id,
        head_user_id: payload.head_user_id,
        user_id: payload.user_id || null,
        full_name: payload.full_name.trim(),
        nik: payload.nik?.trim() || null,
        relationship: payload.relationship,
        gender: payload.gender || null,
        birth_place: payload.birth_place?.trim() || null,
        birth_date: payload.birth_date || null,
        religion: payload.religion?.trim() || null,
        occupation: payload.occupation?.trim() || null,
        phone: payload.phone?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    await logAuditAction({
      action: 'create_family_member',
      entityType: 'family_member',
      entityId: data.id,
      metadata: { full_name: payload.full_name, relationship: payload.relationship },
    });

    return { data: data as FamilyMember, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal menambah anggota keluarga') };
  }
}

/**
 * Update an existing family member's details
 */
export async function updateFamilyMember(
  id: string,
  payload: Partial<CreateFamilyMemberPayload>
): Promise<{ data: FamilyMember | null; error: Error | null }> {
  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.full_name !== undefined) updateData.full_name = payload.full_name.trim();
    if (payload.nik !== undefined) updateData.nik = payload.nik?.trim() || null;
    if (payload.relationship !== undefined) updateData.relationship = payload.relationship;
    if (payload.gender !== undefined) updateData.gender = payload.gender || null;
    if (payload.birth_place !== undefined) updateData.birth_place = payload.birth_place?.trim() || null;
    if (payload.birth_date !== undefined) updateData.birth_date = payload.birth_date || null;
    if (payload.religion !== undefined) updateData.religion = payload.religion?.trim() || null;
    if (payload.occupation !== undefined) updateData.occupation = payload.occupation?.trim() || null;
    if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || null;

    const { data, error } = await supabase
      .from('family_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    await logAuditAction({
      action: 'update_family_member',
      entityType: 'family_member',
      entityId: id,
      metadata: updateData,
    });

    return { data: data as FamilyMember, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal memperbarui anggota keluarga') };
  }
}

/**
 * Delete a family member from the house registry
 */
export async function deleteFamilyMember(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('family_members').delete().eq('id', id);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    await logAuditAction({
      action: 'delete_family_member',
      entityType: 'family_member',
      entityId: id,
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: new Error(err.message || 'Gagal menghapus anggota keluarga') };
  }
}

/**
 * Unambiguous 7-character family code generator
 */
export function generateFamilyCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Find house by 7-digit family code
 */
export async function findHouseByFamilyCode(code: string): Promise<{ data: any | null; error: Error | null }> {
  try {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 7) {
      return { data: null, error: new Error('ID Keluarga harus terdiri dari 7 karakter.') };
    }

    const { data, error } = await supabase
      .from('houses')
      .select('*, rt:rt_units(*), rw:rw_units(*)')
      .eq('family_code', cleaned)
      .maybeSingle();

    if (error) return { data: null, error: new Error(error.message) };
    if (!data) return { data: null, error: new Error('ID Keluarga tidak ditemukan.') };

    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal mencari ID Keluarga') };
  }
}

/**
 * Join a family / household using 7-digit unique family code
 */
export async function joinFamilyByCode(
  userId: string,
  familyCode: string
): Promise<{ data: any | null; error: Error | null }> {
  try {
    const cleaned = familyCode.trim().toUpperCase();
    if (cleaned.length !== 7) {
      return { data: null, error: new Error('ID Keluarga harus 7 karakter.') };
    }

    // Try via Postgres RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('join_family_by_code', {
      p_user_id: userId,
      p_family_code: cleaned,
    });

    if (!rpcError && rpcData) {
      await logAuditAction({
        actorId: userId,
        action: 'join_family_by_code',
        entityType: 'house',
        entityId: (rpcData as any).house_id || cleaned,
        metadata: { family_code: cleaned },
      });
      return { data: rpcData, error: null };
    }

    // Fallback if RPC function not yet run in remote db
    const { data: house, error: findError } = await findHouseByFamilyCode(cleaned);
    if (findError || !house) {
      return { data: null, error: findError || new Error('ID Keluarga tidak ditemukan.') };
    }

    // Update profile
    await supabase.from('profiles').update({ family_code: cleaned }).eq('id', userId);

    // Upsert household member
    await supabase.from('household_members').upsert(
      {
        house_id: house.id,
        user_id: userId,
        relationship: 'family',
        is_primary: false,
        status: 'active',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'house_id,user_id' }
    );

    // Set house to occupied if vacant
    if (house.status === 'vacant') {
      await supabase.from('houses').update({ status: 'occupied' }).eq('id', house.id);
    }

    await logAuditAction({
      actorId: userId,
      action: 'join_family_by_code_fallback',
      entityType: 'house',
      entityId: house.id,
      metadata: { family_code: cleaned },
    });

    return {
      data: {
        success: true,
        house_id: house.id,
        family_code: cleaned,
        house_number: house.house_number,
        block: house.block,
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: new Error(err.message || 'Gagal bergabung ke keluarga') };
  }
}
