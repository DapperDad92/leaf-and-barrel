import { supabase } from './supabase';
import type { Cigar } from '../types/database';
import { handleSupabaseError, isErrorResponse, logError } from '../utils/error';
import type { ErrorResponse } from '../utils/error';

/**
 * Fetches all cigars from the database
 * @returns Promise with either an array of cigars or an error response
 */
export async function getCigars(): Promise<Cigar[] | ErrorResponse> {
  try {
    const { data, error } = await supabase
      .from('cigars')
      .select('*')
      .order('brand', { ascending: true })
      .order('line', { ascending: true });

    if (error) {
      logError('getCigars', error);
      return handleSupabaseError(error);
    }

    return data || [];
  } catch (error) {
    logError('getCigars', error);
    return handleSupabaseError(error);
  }
}

/**
 * Fetches a single cigar by ID
 * @param id - The cigar ID
 * @returns Promise with either a cigar or an error response
 */
export async function getCigarById(id: string): Promise<Cigar | ErrorResponse> {
  try {
    const { data, error } = await supabase
      .from('cigars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logError('getCigarById', error);
      return handleSupabaseError(error);
    }

    return data;
  } catch (error) {
    logError('getCigarById', error);
    return handleSupabaseError(error);
  }
}

/**
 * Searches cigars by brand, line, or vitola
 * @param searchTerm - The search term
 * @returns Promise with either an array of cigars or an error response
 */
export async function searchCigars(searchTerm: string): Promise<Cigar[] | ErrorResponse> {
  try {
    const { data, error } = await supabase
      .from('cigars')
      .select('*')
      .or(`brand.ilike.%${searchTerm}%,line.ilike.%${searchTerm}%,vitola.ilike.%${searchTerm}%`)
      .order('brand', { ascending: true })
      .order('line', { ascending: true });

    if (error) {
      logError('searchCigars', error);
      return handleSupabaseError(error);
    }

    return data || [];
  } catch (error) {
    logError('searchCigars', error);
    return handleSupabaseError(error);
  }
}

/**
 * Filters cigars by strength
 * @param strength - The strength level ('mild', 'medium', or 'full')
 * @returns Promise with either an array of cigars or an error response
 */
export async function getCigarsByStrength(
  strength: 'mild' | 'medium' | 'full'
): Promise<Cigar[] | ErrorResponse> {
  try {
    const { data, error } = await supabase
      .from('cigars')
      .select('*')
      .eq('strength', strength)
      .order('brand', { ascending: true })
      .order('line', { ascending: true });

    if (error) {
      logError('getCigarsByStrength', error);
      return handleSupabaseError(error);
    }

    return data || [];
  } catch (error) {
    logError('getCigarsByStrength', error);
    return handleSupabaseError(error);
  }
}

/**
 * Type guard to check if the result is an array of cigars
 */
export function isCigarsArray(result: Cigar[] | ErrorResponse): result is Cigar[] {
  return Array.isArray(result);
}

/**
 * Type guard to check if the result is a single cigar
 */
export function isCigar(result: Cigar | ErrorResponse): result is Cigar {
  return !isErrorResponse(result) && 'id' in result && 'brand' in result;
}

/**
 * Creates a new cigar in the database
 * @param cigar - The cigar data (without id, created_at, updated_at)
 * @returns Promise with the created cigar
 */
export async function createCigar(
  cigar: Omit<Cigar, 'id' | 'created_at' | 'updated_at'>
): Promise<Cigar> {
  console.log('[DEBUG] createCigar called with data:', JSON.stringify(cigar, null, 2));
  
  // Check current auth state
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[DEBUG] Current auth session:', {
    hasSession: !!session,
    userId: session?.user?.id,
    role: session?.user?.role,
    aud: session?.user?.aud,
  });
  
  // Log the table we're inserting into
  console.log('[DEBUG] Inserting into table: cigars');
  
  const { data, error } = await supabase
    .from('cigars')
    .insert(cigar)
    .select()
    .single();

  if (error) {
    console.error('[DEBUG] Supabase insert error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw new Error(`Failed to create cigar: ${error.message}`);
  }

  console.log('[DEBUG] Cigar created successfully:', data);
  return data;
}

/**
 * Updates a cigar's photo URL
 * @param id - The cigar ID
 * @param photoUrl - The new photo URL
 * @returns Promise with the updated cigar
 */
export async function updateCigarPhoto(id: string, photoUrl: string): Promise<Cigar> {
  const { data, error } = await supabase
    .from('cigars')
    .update({ photo_url: photoUrl })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update cigar photo: ${error.message}`);
  }

  return data;
}