import { supabase } from '@/lib/supabase';
import type {
  FamilyMember,
  House,
  HouseholdMember,
  Profile,
  RtUnit,
  RwUnit,
} from '@/types/database';

export interface MyHouseholdInfo {
  member: HouseholdMember | null;
  house: House | null;
  rt: RtUnit | null;
  rw: RwUnit | null;
  familyMembers: (HouseholdMember & { profile?: Profile })[];
  registeredFamilyMembers: FamilyMember[];
}

/**
 * Get current user's household, house, RT, and RW details (PRD v2 §10)
 */
export async function getMyHousehold(
  userId: string
): Promise<{ data: MyHouseholdInfo | null; error: Error | null }> {
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('*, house:houses(*, rt:rt_units(*), rw:rw_units(*))')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError) {
      return { data: null, error: new Error(memberError.message) };
    }

    if (!memberData) {
      return {
        data: {
          member: null,
          house: null,
          rt: null,
          rw: null,
          familyMembers: [],
          registeredFamilyMembers: [],
        },
        error: null,
      };
    }

    const house = (memberData as any).house as House & { rt?: RtUnit; rw?: RwUnit };
    const rt = house?.rt || null;
    const rw = house?.rw || null;

    // Fetch account-linked members in this house
    const { data: familyData } = await supabase
      .from('household_members')
      .select('*, profile:profiles(*)')
      .eq('house_id', house.id)
      .eq('status', 'active');

    // Fetch registered family unit members (Kartu Keluarga CRUD)
    const { data: regFamilyData } = await supabase
      .from('family_members')
      .select('*, profile:profiles(*)')
      .eq('house_id', house.id)
      .order('created_at', { ascending: true });

    return {
      data: {
        member: memberData as HouseholdMember,
        house,
        rt,
        rw,
        familyMembers: (familyData || []) as any,
        registeredFamilyMembers: (regFamilyData || []) as FamilyMember[],
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}

/**
 * Get all RW units in this complex (PRD v2 §11)
 */
export async function getRwUnits(): Promise<{ data: RwUnit[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('rw_units')
    .select('*')
    .eq('status', 'active')
    .order('code', { ascending: true });

  if (error) return { data: [], error: new Error(error.message) };
  return { data: data || [], error: null };
}

/**
 * Get RT units, optionally filtered by RW (PRD v2 §11)
 */
export async function getRtUnits(
  rwId?: string
): Promise<{ data: RtUnit[]; error: Error | null }> {
  let query = supabase
    .from('rt_units')
    .select('*, rw:rw_units(*)')
    .eq('status', 'active')
    .order('code', { ascending: true });

  if (rwId) {
    query = query.eq('rw_id', rwId);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data || []) as any, error: null };
}

/**
 * Get houses, optionally filtered by RT or RW (PRD v2 §10.1)
 */
export async function getHouses(filters?: {
  rtId?: string;
  rwId?: string;
}): Promise<{ data: House[]; error: Error | null }> {
  let query = supabase
    .from('houses')
    .select('*, rt:rt_units(*), rw:rw_units(*)')
    .order('house_number', { ascending: true });

  if (filters?.rtId) query = query.eq('rt_id', filters.rtId);
  if (filters?.rwId) query = query.eq('rw_id', filters.rwId);

  const { data, error } = await query;
  if (error) return { data: [], error: new Error(error.message) };
  return { data: (data || []) as any, error: null };
}

/**
 * Get residents list for management (PRD v2 §10.3)
 */
export async function getResidents(filters?: {
  status?: string;
  verificationStatus?: string;
  search?: string;
}): Promise<{ data: (Profile & { house?: House })[]; error: Error | null }> {
  let query = supabase
    .from('profiles')
    .select('*, household_members(*, house:houses(*, rt:rt_units(*), rw:rw_units(*)))')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('resident_status', filters.status);
  }
  if (filters?.verificationStatus) {
    query = query.eq('verification_status', filters.verificationStatus);
  }
  if (filters?.search) {
    query = query.ilike('full_name', `%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) return { data: [], error: new Error(error.message) };

  const mapped = (data || []).map((p: any) => {
    const activeMember = p.household_members?.find((m: any) => m.status === 'active');
    return {
      ...p,
      house: activeMember?.house || null,
    };
  });

  return { data: mapped, error: null };
}

/**
 * Verify or update resident status (Developer/RW/RT only)
 */
export async function verifyResident(
  userId: string,
  verificationStatus: 'verified' | 'rejected',
  residentStatus: 'active' | 'blocked' = 'active'
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      verification_status: verificationStatus,
      resident_status: residentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * Assign a resident to a house (Developer/RW/RT only) (PRD v2 §10.2)
 */
export async function assignResidentToHouse(params: {
  userId: string;
  houseId: string;
  relationship?: string;
  isPrimary?: boolean;
}): Promise<{ error: Error | null }> {
  if (params.isPrimary) {
    await supabase
      .from('household_members')
      .update({ is_primary: false })
      .eq('house_id', params.houseId);
  }

  const { error } = await supabase.from('household_members').upsert(
    {
      user_id: params.userId,
      house_id: params.houseId,
      relationship: params.relationship || 'member',
      is_primary: Boolean(params.isPrimary),
      status: 'active',
      joined_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'house_id,user_id' }
  );

  return { error: error ? new Error(error.message) : null };
}

