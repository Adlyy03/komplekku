import { Redirect, Stack } from 'expo-router';
import { useSupabase } from '@/lib/supabase-provider';
import { LoadingState } from '@/components/ui/LoadingState';

/**
 * Auth stack layout — shown when user is NOT authenticated.
 * If user IS authenticated, redirect to main app.
 */
export default function AuthLayout() {
  const { session, loading, initialized } = useSupabase();

  if (!initialized || loading) {
    return <LoadingState />;
  }

  // Already authenticated — go to main app
  if (session) {
    return <Redirect href="/(main)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
