import { supabase } from './supabase';
import type { InventoryItem, Insertable } from '../types/database';

/**
 * Creates a new inventory item with barcode support
 * @param item - The inventory item data
 * @returns Promise with the created inventory item
 */
export async function createInventoryItem(
  item: Omit<Insertable<'inventory_items'>, 'id' | 'created_at' | 'updated_at'>
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      ...item,
      alt_barcodes: item.alt_barcodes || []
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create inventory item: ${error.message}`);
  }

  return data;
}

/**
 * Adds an alternative barcode to an inventory item if it doesn't already exist
 * @param inventoryItemId - The inventory item ID
 * @param barcode - The barcode to add
 * @returns Promise with the updated inventory item
 */
export async function addAltBarcodeIfMissing(
  inventoryItemId: string,
  barcode: string
): Promise<InventoryItem> {
  // First, get the current inventory item
  const { data: currentItem, error: fetchError } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', inventoryItemId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch inventory item: ${fetchError.message}`);
  }

  // Check if the barcode already exists in alt_barcodes
  const altBarcodes = currentItem.alt_barcodes || [];
  
  // If barcode already exists, return the item as-is
  if (altBarcodes.includes(barcode)) {
    return currentItem;
  }

  // Add the new barcode to the array
  const updatedAltBarcodes = [...altBarcodes, barcode];

  // Update the inventory item with the new alt_barcodes array
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ alt_barcodes: updatedAltBarcodes })
    .eq('id', inventoryItemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update alt barcodes: ${error.message}`);
  }

  return data;
}

/**
 * Increments the quantity of an inventory item
 * @param itemId - The inventory item ID
 * @param by - The amount to increment by (default: 1)
 * @returns Promise with the updated inventory item
 */
export async function incrementQuantity(itemId: string, by = 1) {
  // Fetch current quantity
  const { data: current, error: fetchError } = await supabase
    .from('inventory_items')
    .select('quantity')
    .eq('id', itemId)
    .single();
  
  if (fetchError) throw fetchError;
  
  // Update with new quantity
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ quantity: (current.quantity || 0) + by })
    .eq('id', itemId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}