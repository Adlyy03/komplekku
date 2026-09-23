import { Redirect } from 'expo-router';
import { useSupabase } from '@/lib/supabase-provider';
import { LoadingState } from '@/components/ui/LoadingState';

/**
 * Root index — redirects to appropriate route group based on auth state.
 */
export default function Index() {
  const { session, initialized } = useSupabase();

  if (!initialized) {
    return <LoadingState />;
  }

  if (session) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
