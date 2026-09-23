import { supabase } from '@/lib/supabase';
import type { ComplexSettings } from '@/types/database';

const DEFAULT_SETTINGS: ComplexSettings = {
  id: 1,
  name: 'Komplekku Perumahan',
  logo_path: null,
  address: 'Jl. Utama Komplek No. 1',
  phone: '0812-3456-7890',
  email: 'pengelola@komplekku.id',
  timezone: 'Asia/Jakarta',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Fetch singleton complex settings (id = 1)
 * PRD v2 §1 & §23: 1 deployment = 1 complex
 */
export async function getComplexSettings(): Promise<{
  data: ComplexSettings;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('complex_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      return { data: DEFAULT_SETTINGS, error: new Error(error.message) };
    }

    if (!data) {
      return { data: DEFAULT_SETTINGS, error: null };
    }

    return { data: data as ComplexSettings, error: null };
  } catch (err: any) {
    return { data: DEFAULT_SETTINGS, error: new Error(err.message) };
  }
}

/**
 * Update complex settings (Developer role only)
 */
export async function updateComplexSettings(
  updates: Partial<Omit<ComplexSettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ data: ComplexSettings | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('complex_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ComplexSettings, error: null };
  } catch (err: any) {
    return { data: null, error: new Error(err.message) };
  }
}
