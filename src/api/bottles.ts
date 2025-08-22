import { supabase } from './supabase';
import type { Bottle } from '../types/database';
import { type ErrorResponse } from '../utils/error';

export type BottlesResponse = Bottle[] | ErrorResponse;

export async function getBottles(): Promise<BottlesResponse> {
  try {
    const { data, error } = await supabase
      .from('bottles')
      .select('*')
      .order('brand', { ascending: true });

    if (error) {
      console.error('Error fetching bottles:', error);
      return {
        error: {
          message: error.message,
          code: 'FETCH_ERROR',
        },
      };
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching bottles:', error);
    return {
      error: {
        message: 'An unexpected error occurred while fetching bottles',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

// Type guard to check if response is bottles array
export function isBottlesArray(response: BottlesResponse): response is Bottle[] {
  return Array.isArray(response);
}