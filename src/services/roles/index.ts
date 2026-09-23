import { supabase } from '@/lib/supabase';
import type { UserRole, UserRoleRecord } from '@/types/database';

/**
 * Get all active roles assigned to user (PRD v2 §4)
 */
export async function getUserRoles(
  userId: string
): Promise<{ data: UserRoleRecord[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data || []) as UserRoleRecord[], error: null };
  } catch (err: any) {
    return { data: [], error: new Error(err.message) };
  }
}

/**
 * Check if a role exists in an array of UserRoleRecord
 */
export function hasRole(roles: UserRoleRecord[], role: UserRole): boolean {
  return roles.some((r) => r.role === role && r.status === 'active');
}

/**
 * Get highest role in priority hierarchy: developer > rw > rt > warga
 */
export function getHighestRole(roles: UserRoleRecord[]): UserRole {
  if (hasRole(roles, 'developer')) return 'developer';
  if (hasRole(roles, 'rw')) return 'rw';
  if (hasRole(roles, 'rt')) return 'rt';
  return 'warga';
}

/**
 * Check if actor role has permission to assign or manage target role (PRD v2 §4 & MVP_FINALIZATION_PHASES Phase 2)
 */
export function canManageRole(actorRole: UserRole, targetRole: UserRole): boolean {
  if (actorRole === 'developer') return true;
  if (actorRole === 'rw') {
    // RW can assign RT or Warga, but cannot promote to Developer or RW
    return targetRole === 'rt' || targetRole === 'warga';
  }
  if (actorRole === 'rt') {
    // RT can only assign/manage Warga, cannot promote to Developer, RW, or RT
    return targetRole === 'warga';
  }
  return false;
}

/**
 * Assign a role to a user (Developer only)
 */
export async function assignRole(
  userId: string,
  role: UserRole,
  rwId?: string | null,
  rtId?: string | null
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from('user_roles').insert({
    user_id: userId,
    role,
    rw_id: rwId || null,
    rt_id: rtId || null,
    status: 'active',
  });

  return { error: error ? new Error(error.message) : null };
}

/**
 * Assign or update a user's role with strict permission validation and audit logging (Phase 2)
 */
export async function assignRoleWithAudit(params: {
  actorId: string;
  actorRole: UserRole;
  targetUserId: string;
  newRole: UserRole;
  rwId?: string | null;
  rtId?: string | null;
}): Promise<{ error: Error | null }> {
  const { actorId, actorRole, targetUserId, newRole, rwId, rtId } = params;

  // 1. Permission check
  if (!canManageRole(actorRole, newRole)) {
    return {
      error: new Error(
        `Peran '${actorRole}' tidak memiliki izin untuk menetapkan peran '${newRole}'.`
      ),
    };
  }

  // 2. Prevent self-promotion to developer or rw
  if (actorId === targetUserId && (newRole === 'developer' || newRole === 'rw') && actorRole !== 'developer') {
    return {
      error: new Error('Tidak diizinkan menaikkan peran diri sendiri menjadi pengurus tingkat atas.'),
    };
  }

  try {
    // Upsert role
    const { error: upsertError } = await supabase.from('user_roles').upsert(
      {
        user_id: targetUserId,
        role: newRole,
        rw_id: rwId || null,
        rt_id: rtId || null,
        status: 'active',
      },
      { onConflict: 'user_id,role,rw_id,rt_id' }
    );

    if (upsertError) {
      return { error: new Error(upsertError.message) };
    }

    // Record in audit_logs
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'role_assigned',
      entity_type: 'user_role',
      entity_id: targetUserId,
      metadata: {
        target_user_id: targetUserId,
        assigned_role: newRole,
        actor_role: actorRole,
        rw_id: rwId || null,
        rt_id: rtId || null,
      },
    });

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Deactivate a role with audit logging
 */
export async function revokeRoleWithAudit(params: {
  actorId: string;
  actorRole: UserRole;
  targetUserId: string;
  roleToRevoke: UserRole;
}): Promise<{ error: Error | null }> {
  const { actorId, actorRole, targetUserId, roleToRevoke } = params;

  if (!canManageRole(actorRole, roleToRevoke)) {
    return {
      error: new Error(`Tidak memiliki izin untuk mencabut peran '${roleToRevoke}'.`),
    };
  }

  try {
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({ status: 'inactive' })
      .eq('user_id', targetUserId)
      .eq('role', roleToRevoke);

    if (updateError) {
      return { error: new Error(updateError.message) };
    }

    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'role_revoked',
      entity_type: 'user_role',
      entity_id: targetUserId,
      metadata: {
        target_user_id: targetUserId,
        revoked_role: roleToRevoke,
        actor_role: actorRole,
      },
    });

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}
