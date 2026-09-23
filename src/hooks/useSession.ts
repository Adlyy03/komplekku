/**
 * Convenience re-export of useSupabase for auth-related hooks.
 * Provides session, user, loading, signIn, signUp, signOut.
 */
export { useSupabase as useSession } from '@/lib/supabase-provider';
