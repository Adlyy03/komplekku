import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types/database';

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any>;
}

export interface AuditLogWithActor extends AuditLog {
  actor?: {
    id: string;
    full_name: string;
    avatar_path: string | null;
  } | null;
}

/**
 * Record an action in audit_logs (PRD v2 §4, §18 & MVP_FINALIZATION_PHASES Phase 2)
 */
export async function logAuditAction(params: LogAuditParams): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: params.actorId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata || {},
    });

    if (error) {
      console.warn('Failed to record audit log:', error.message);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err: any) {
    console.warn('Audit log exception:', err);
    return { error: err };
  }
}

/**
 * Fetch latest audit logs for Developer dashboard monitoring
 */
export async function getRecentAuditLogs(
  limit: number = 10
): Promise<{ data: AuditLogWithActor[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles (id, full_name, avatar_path)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data || []) as AuditLogWithActor[], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}
