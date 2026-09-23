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
