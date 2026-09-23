import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export interface AuthResponse {
  error: Error | null;
  user?: any;
  session?: any;
}

/**
 * Sign in existing user with email and password (PRD v2 §9)
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return { error: error ? new Error(error.message) : null, user: data.user, session: data.session };
}

/**
 * Register new user with email, password, and full name (PRD v2 §9)
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
    },
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  // Fallback: If trigger hasn't fired, ensure profile and default warga role exist
  if (data.user) {
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: fullName.trim(),
        resident_status: 'pending',
        verification_status: 'pending',
      },
      { onConflict: 'id' }
    );

    // Default safe role: warga (never developer or management)
    await supabase.from('user_roles').upsert(
      {
        user_id: data.user.id,
        role: 'warga',
        status: 'active',
      },
      { onConflict: 'user_id,role,rw_id,rt_id' }
    );
  }

  return { error: null, user: data.user, session: data.session };
}

/**
 * Sign out and clear local session (PRD v2 §9)
 */
export async function signOut(): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error ? new Error(error.message) : null };
}

/**
 * Fetch profile for a given user ID (PRD v2 §9 & §10)
 */
export async function getProfile(userId: string): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as Profile, error: null };
}

/**
 * Update profile fields for current user (PRD v2 §9)
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<{ data: Profile | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    return { data: null, error: new Error(error.message) };
  }
  return { data: data as Profile, error: null };
}

/**
 * Upload avatar image to Supabase Storage 'avatars' bucket (PRD v2 §29)
 */
export async function uploadAvatar(
  userId: string,
  uri: string
): Promise<{ path: string | null; url: string | null; error: Error | null }> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return { path: null, url: null, error: new Error(uploadError.message) };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { path: filePath, url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { path: null, url: null, error: new Error(err.message || 'Gagal mengunggah avatar') };
  }
}
