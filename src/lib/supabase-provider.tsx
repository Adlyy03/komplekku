import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
import { getProfile, updateProfile as apiUpdateProfile, signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut } from '@/services/auth';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
}

interface SupabaseContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ user?: any; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<Profile, 'id' | 'created_at'>>) => Promise<{ error: Error | null }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    initialized: false,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await getProfile(userId);
      if (data) {
        setState((prev) => ({ ...prev, profile: data }));
      }
    } catch {
      // Ignore initial profile fetch errors (e.g. if table not yet migrated)
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user?.id) {
      await fetchProfile(state.user.id);
    }
  }, [state.user, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setState((prev) => ({
        ...prev,
        session,
        user,
        loading: false,
        initialized: true,
      }));
      if (user) {
        fetchProfile(user.id);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setState((prev) => ({
          ...prev,
          session,
          user,
          profile: user ? prev.profile : null,
          loading: false,
        }));
        if (user) {
          fetchProfile(user.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const res = await apiSignIn(email, password);
    if (res.user) {
      await fetchProfile(res.user.id);
    }
    return { error: res.error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const res = await apiSignUp(email, password, fullName);
    if (res.user) {
      await fetchProfile(res.user.id);
    }
    return { user: res.user, error: res.error };
  };

  const signOut = async () => {
    await apiSignOut();
    setState((prev) => ({
      ...prev,
      session: null,
      user: null,
      profile: null,
    }));
  };

  const updateProfile = async (
    updates: Partial<Omit<Profile, 'id' | 'created_at'>>
  ) => {
    if (!state.user?.id) {
      return { error: new Error('User tidak terautentikasi') };
    }
    const { data, error } = await apiUpdateProfile(state.user.id, updates);
    if (data) {
      setState((prev) => ({ ...prev, profile: data }));
    }
    return { error };
  };

  return (
    <SupabaseContext.Provider
      value={{
        ...state,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

export const useAuth = useSupabase;

