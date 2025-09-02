import { supabase } from './supabase';
import type { Bottle } from '../types/database';
import { type ErrorResponse } from '../utils/error';

// Extended type to include quantity from inventory_items
export type BottleWithQuantity = Bottle & {
  quantity?: number;
};

export type BottlesResponse = BottleWithQuantity[] | ErrorResponse;

export async function getBottles(): Promise<BottlesResponse> {
  try {
    // First, get all bottles
    const { data: bottlesData, error: bottlesError } = await supabase
      .from('bottles')
      .select('*')
      .order('brand', { ascending: true });

    if (bottlesError) {
      console.error('Error fetching bottles:', bottlesError);
      return {
        error: {
          message: bottlesError.message,
          code: 'FETCH_ERROR',
        },
      };
    }

    if (!bottlesData || bottlesData.length === 0) {
      return [];
    }

    // Then, get inventory items for these bottles
    const bottleIds = bottlesData.map(bottle => bottle.id);
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory_items')
      .select('ref_id, quantity')
      .eq('kind', 'bottle')
      .in('ref_id', bottleIds);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      // Continue without quantities if inventory fetch fails
    }

    // Create a map of bottle quantities
    const quantityMap = new Map<string, number>();
    if (inventoryData) {
      inventoryData.forEach(item => {
        quantityMap.set(item.ref_id, item.quantity);
      });
    }

    // Combine bottles with their quantities
    const bottlesWithQuantity: BottleWithQuantity[] = bottlesData.map(bottle => ({
      ...bottle,
      quantity: quantityMap.get(bottle.id) || 0
    }));

    return bottlesWithQuantity;
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
export function isBottlesArray(response: BottlesResponse): response is BottleWithQuantity[] {
  return Array.isArray(response);
}

/**
 * Creates a new bottle in the database
 * @param bottle - The bottle data (without id, created_at, updated_at)
 * @returns Promise with the created bottle
 */
export async function createBottle(
  bottle: Omit<Bottle, 'id' | 'created_at' | 'updated_at'>
): Promise<Bottle> {
  const { data, error } = await supabase
    .from('bottles')
    .insert(bottle)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create bottle: ${error.message}`);
  }

  return data;
}

/**
 * Updates a bottle's photo URL
 * @param id - The bottle ID
 * @param photoUrl - The new photo URL
 * @returns Promise with the updated bottle
 */
export async function updateBottlePhoto(id: string, photoUrl: string): Promise<Bottle> {
  const { data, error } = await supabase
    .from('bottles')
    .update({ photo_url: photoUrl })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update bottle photo: ${error.message}`);
  }

  return data;
}