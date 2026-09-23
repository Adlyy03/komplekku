import { supabase } from '@/lib/supabase';
import type {
  House,
  Product,
  Profile,
  SellerProfile,
  UserRole,
} from '@/types/database';
import { canManageRole } from '@/services/roles';
import { getRecentAuditLogs, logAuditAction, type AuditLogWithActor } from '@/services/audit';

export interface RoleScopeFilter {
  role?: 'developer' | 'rw' | 'rt' | 'warga';
  rwId?: string | null;
  rtId?: string | null;
}

export interface AdminOverviewStats {
  totalResidents: number;
  totalHouses: number;
  totalDuesPending: number;
  totalComplaintsActive: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRt?: number;
  totalRw?: number;
  rtBreakdown?: {
    id: string;
    code: string;
    name: string;
    houseCount: number;
    residentCount?: number;
    duesPendingCount?: number;
  }[];
  recentActivity?: AuditLogWithActor[];
  recentComplaints?: any[];
  recentPayments?: any[];
  recentOrders?: any[];
  recentAnnouncements?: any[];
  recentResidents?: any[];
}

export interface ResidentMemberAdmin extends Profile {
  house?: House | null;
  role?: string;
  status?: string;
  relationship?: string;
  is_primary?: boolean;
  rt?: { id: string; code: string; name: string } | null;
  rw?: { id: string; code: string; name: string } | null;
  profile?: Profile;
}

export type CommunityMemberWithProfile = ResidentMemberAdmin;

export interface SellerWithUser extends SellerProfile {
  user: Profile;
}

export interface ProductWithSellerAdmin extends Product {
  seller: SellerProfile;
}

/**
 * Check if the given user is an admin / manager (developer, rw, or rt) (PRD v2 §4)
 */
export async function checkIsAdmin(
  userId: string,
  _communityId?: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['developer', 'rw', 'rt'])
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

/**
 * Fetch overview statistics and live operational feeds (PRD v2 §18, §19, §20 & Phase 2)
 * Scoped by role: Developer (all), RW (scope RW), RT (scope RT).
 */
export async function getAdminOverview(
  scope?: RoleScopeFilter
): Promise<{
  data: AdminOverviewStats;
  error: Error | null;
}> {
  try {
    const isRt = scope?.role === 'rt' && !!scope.rtId;
    const isRw = scope?.role === 'rw' && !!scope.rwId;
    const isDev = scope?.role === 'developer' || (!isRt && !isRw);

    // 1. Core count queries
    let housesQuery = supabase.from('houses').select('*', { count: 'exact', head: true });
    if (isRt && scope?.rtId) housesQuery = housesQuery.eq('rt_id', scope.rtId);
    else if (isRw && scope?.rwId) housesQuery = housesQuery.eq('rw_id', scope.rwId);

    let duesQuery = supabase
      .from('due_assignments')
      .select('*, house:houses!inner(rw_id, rt_id)', { count: 'exact', head: true })
      .in('status', ['unpaid', 'pending_verification']);
    if (isRt && scope?.rtId) duesQuery = duesQuery.eq('house.rt_id', scope.rtId);
    else if (isRw && scope?.rwId) duesQuery = duesQuery.eq('house.rw_id', scope.rwId);

    let complaintsQuery = supabase
      .from('complaints')
      .select('*, house:houses(rw_id, rt_id)', { count: 'exact', head: true })
      .in('status', ['submitted', 'in_review', 'in_progress']);
    if (isRt && scope?.rtId) complaintsQuery = complaintsQuery.eq('house.rt_id', scope.rtId);
    else if (isRw && scope?.rwId) complaintsQuery = complaintsQuery.eq('house.rw_id', scope.rwId);

    const rtPromise = isRw && scope?.rwId
      ? supabase.from('rt_units').select('id, code, name, houses(id, household_members(id), due_assignments(id, status))').eq('rw_id', scope.rwId)
      : supabase.from('rt_units').select('id', { count: 'exact', head: true });
    const rwPromise = supabase.from('rw_units').select('id', { count: 'exact', head: true });

    // 2. Operational feeds queries
    const complaintsFeedPromise = supabase
      .from('complaints')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        reporter:profiles!complaints_reporter_id_fkey (id, full_name),
        category:complaint_categories (name),
        house:houses (block, house_number, rt_id, rw_id)
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    const paymentsFeedPromise = supabase
      .from('due_payments')
      .select(`
        id,
        amount,
        method,
        status,
        submitted_at,
        paid_by:profiles!due_payments_paid_by_user_id_fkey (id, full_name),
        assignment:due_assignments (
          id,
          amount_snapshot,
          due:dues (name),
          house:houses (block, house_number, rt_id, rw_id)
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(6);

    const [
      residentsRes,
      housesRes,
      duesRes,
      complaintsRes,
      sellersRes,
      productsRes,
      ordersRes,
      rtRes,
      rwRes,
      complaintsFeedRes,
      paymentsFeedRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      housesQuery,
      duesQuery,
      complaintsQuery,
      supabase.from('seller_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      rtPromise,
      rwPromise,
      complaintsFeedPromise,
      paymentsFeedPromise,
    ]);

    // Extra feeds for Developer
    let recentActivity: AuditLogWithActor[] = [];
    let recentOrders: any[] = [];
    let recentAnnouncements: any[] = [];
    if (isDev) {
      const [auditRes, ordersFeedRes, annRes] = await Promise.all([
        getRecentAuditLogs(6),
        supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total,
            status,
            created_at,
            buyer:profiles!orders_buyer_id_fkey (full_name),
            seller:seller_profiles!orders_seller_id_fkey (store_name)
          `)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('announcements')
          .select('id, title, target_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);
      if (auditRes.data) recentActivity = auditRes.data;
      if (ordersFeedRes.data) recentOrders = ordersFeedRes.data;
      if (annRes.data) recentAnnouncements = annRes.data;
    }

    // Filter complaints & payments feed by role scope
    let filteredComplaints = (complaintsFeedRes.data || []) as any[];
    let filteredPayments = (paymentsFeedRes.data || []) as any[];

    if (isRt && scope?.rtId) {
      filteredComplaints = filteredComplaints.filter((c) => c.house?.rt_id === scope.rtId);
      filteredPayments = filteredPayments.filter((p) => p.assignment?.house?.rt_id === scope.rtId);
    } else if (isRw && scope?.rwId) {
      filteredComplaints = filteredComplaints.filter((c) => c.house?.rw_id === scope.rwId);
      filteredPayments = filteredPayments.filter((p) => p.assignment?.house?.rw_id === scope.rwId);
    }

    // Recent residents for RT
    let recentResidents: any[] = [];
    if (isRt) {
      const { data: resData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          resident_status,
          verification_status,
          created_at,
          household_members (
            status,
            house:houses (block, house_number, rt_id)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      recentResidents = (resData || [])
        .filter((r: any) =>
          (r.household_members || []).some((m: any) => m.house?.rt_id === scope.rtId)
        )
        .slice(0, 5);
    }

    // Process RT breakdown for RW
    let rtBreakdown:
      | {
          id: string;
          code: string;
          name: string;
          houseCount: number;
          residentCount: number;
          duesPendingCount: number;
        }[]
      | undefined;

    if (isRw && Array.isArray(rtRes.data)) {
      rtBreakdown = (rtRes.data as any[]).map((r) => {
        const houses = r.houses || [];
        let residentCount = 0;
        let duesPendingCount = 0;
        houses.forEach((h: any) => {
          residentCount += (h.household_members || []).length;
          const pending = (h.due_assignments || []).filter(
            (d: any) => d.status === 'unpaid' || d.status === 'pending_verification'
          );
          duesPendingCount += pending.length;
        });
        return {
          id: r.id,
          code: r.code,
          name: r.name,
          houseCount: houses.length,
          residentCount,
          duesPendingCount,
        };
      });
    }

    return {
      data: {
        totalResidents: residentsRes.count || 0,
        totalHouses: housesRes.count || 0,
        totalDuesPending: duesRes.count || 0,
        totalComplaintsActive: complaintsRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRt: rtRes.count || (Array.isArray(rtRes.data) ? rtRes.data.length : 0),
        totalRw: rwRes.count || 0,
        rtBreakdown,
        recentActivity,
        recentComplaints: filteredComplaints,
        recentPayments: filteredPayments,
        recentOrders,
        recentAnnouncements,
        recentResidents,
      },
      error: null,
    };
  } catch (err: any) {
    return {
      data: {
        totalResidents: 0,
        totalHouses: 0,
        totalDuesPending: 0,
        totalComplaintsActive: 0,
        totalSellers: 0,
        totalProducts: 0,
        totalOrders: 0,
      },
      error: err,
    };
  }
}

/**
 * List all residents with house and family relationship information (PRD v2 §10.3 & Phase 2)
 * Filtered by scope if RT or RW role.
 */
export async function getCommunityMembers(
  scope?: RoleScopeFilter
): Promise<{
  data: ResidentMemberAdmin[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      household_members (
        id,
        relationship,
        is_primary,
        status,
        house:houses (
          *,
          rt:rt_units (*),
          rw:rw_units (*)
        )
      ),
      user_roles (role, status)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  let mapped: ResidentMemberAdmin[] = (data || []).map((p: any) => {
    const activeMember =
      (p.household_members || []).find((m: any) => m.status === 'active') ||
      p.household_members?.[0];
    const activeRole =
      (p.user_roles || []).find((r: any) => r.status === 'active')?.role || 'warga';

    return {
      ...p,
      house: activeMember?.house || null,
      relationship: activeMember?.relationship || 'member',
      is_primary: activeMember?.is_primary || false,
      rt: activeMember?.house?.rt || null,
      rw: activeMember?.house?.rw || null,
      role: activeRole,
      status: p.resident_status || 'active',
    };
  });

  // Apply scope filtering
  if (scope?.role === 'rt' && scope.rtId) {
    mapped = mapped.filter((m) => m.house?.rt_id === scope.rtId);
  } else if (scope?.role === 'rw' && scope.rwId) {
    mapped = mapped.filter((m) => m.house?.rw_id === scope.rwId);
  }

  return { data: mapped, error: null };
}

/**
 * Update resident status & verification with role permission checks and audit logging (PRD v2 §10.3 & Phase 2)
 */
export async function updateMemberStatus(
  userId: string,
  params: {
    actorId?: string;
    actorRole?: UserRole;
    role?: UserRole | string;
    status?: string;
    resident_status?: 'active' | 'pending' | 'blocked' | 'inactive';
    verification_status?: 'verified' | 'pending' | 'rejected';
  }
): Promise<{ error: Error | null }> {
  const updates: any = {
    updated_at: new Date().toISOString(),
  };
  if (params.resident_status) updates.resident_status = params.resident_status;
  if (params.verification_status) updates.verification_status = params.verification_status;
  if (params.status) updates.resident_status = params.status;

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return { error: new Error(error.message) };
  }

  // If role is updated, enforce permission guard
  if (params.role) {
    const targetRole = params.role as UserRole;
    const actorRole = params.actorRole || 'developer';

    if (!canManageRole(actorRole, targetRole)) {
      return {
        error: new Error(
          `Peran '${actorRole}' tidak memiliki izin untuk menetapkan peran '${targetRole}'.`
        ),
      };
    }

    const { error: roleError } = await supabase.from('user_roles').upsert(
      {
        user_id: userId,
        role: targetRole,
        status: 'active',
      },
      { onConflict: 'user_id,role,rw_id,rt_id' }
    );

    if (roleError) {
      return { error: new Error(roleError.message) };
    }
  }

  // Record audit log
  if (params.actorId) {
    await logAuditAction({
      actorId: params.actorId,
      action: 'resident_status_updated',
      entityType: 'profile',
      entityId: userId,
      metadata: {
        resident_status: updates.resident_status,
        verification_status: updates.verification_status,
        role: params.role,
        actor_role: params.actorRole,
      },
    });
  }

  return { error: null };
}

/**
 * List all sellers in the complex (PRD v2 §14)
 */
export async function getCommunitySellers(
  _communityId?: string
): Promise<{
  data: SellerWithUser[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('seller_profiles')
    .select(`
      *,
      user:profiles (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  return { data: (data as any) || [], error: null };
}

/**
 * Moderate seller status (PRD v2 §14)
 */
export async function updateSellerStatus(
  sellerId: string,
  status: 'active' | 'inactive' | 'blocked'
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('seller_profiles')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sellerId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * List products for admin moderation (PRD v2 §14)
 */
export async function getCommunityProducts(
  _communityId?: string
): Promise<{
  data: ProductWithSellerAdmin[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:seller_profiles (id, store_name, avatar_path, user_id)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const mapped = (data || []).map((p: any) => ({
    ...p,
    price: Number(p.price),
  }));

  return { data: mapped, error: null };
}

/**
 * Moderate product status (PRD v2 §14)
 */
export async function moderateProduct(
  productId: string,
  status: 'active' | 'inactive'
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('products')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  return { error: error ? new Error(error.message) : null };
}

/**
 * List all marketplace orders for admin monitoring (PRD v2 §14)
 */
export async function getCommunityOrders(
  _communityId?: string
): Promise<{
  data: any[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      buyer:profiles!orders_buyer_id_fkey (id, full_name, avatar_path, phone),
      seller:seller_profiles!orders_seller_id_fkey (id, store_name, avatar_path, user_id),
      items:order_items (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: [], error: new Error(error.message) };
  }

  const mapped = (data || []).map((o: any) => ({
    ...o,
    subtotal: Number(o.subtotal),
    delivery_fee: Number(o.delivery_fee),
    total: Number(o.total),
  }));

  return { data: mapped, error: null };
}

/**
 * Update complex settings (Developer role only) (PRD v2 §1)
 */
export async function updateCommunityInfo(updates: {
  name: string;
  address?: string;
  phone?: string;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('complex_settings')
    .update({
      name: updates.name.trim(),
      address: updates.address?.trim() || null,
      phone: updates.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  return { error: error ? new Error(error.message) : null };
}
