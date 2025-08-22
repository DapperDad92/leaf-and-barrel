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