import { supabase } from '../lib/supabase';

interface BarcodeItem {
  id: string;
  kind: 'cigar' | 'bottle';
  ref_id: string;
  quantity: number;
  barcode?: string;
  alt_barcodes: string[];
  brand?: string;
  line?: string;
  expression?: string;
  type?: string;
}

// Returns: [] | [item] | [item1, item2, ...]
export async function findItemByBarcode(code: string): Promise<BarcodeItem[]> {
  // primary match
  const primary = supabase
    .from('inventory_items')
    .select('id, kind, ref_id, quantity, barcode, alt_barcodes')
    .eq('barcode', code);

  // alt_barcodes array contains
  const alt = supabase
    .from('inventory_items')
    .select('id, kind, ref_id, quantity, barcode, alt_barcodes')
    .contains('alt_barcodes', [code]);

  const [p, a] = await Promise.all([primary, alt]);
  if (p.error) throw p.error;
  if (a.error) throw a.error;

  // merge & de-dupe by id
  const map = new Map<string, any>();
  (p.data ?? []).forEach(r => map.set(r.id, r));
  (a.data ?? []).forEach(r => map.set(r.id, r));
  
  const items = Array.from(map.values());
  
  // Now fetch the details for each item
  const itemsWithDetails: BarcodeItem[] = await Promise.all(
    items.map(async (item) => {
      const baseItem: BarcodeItem = {
        id: item.id,
        kind: item.kind,
        ref_id: item.ref_id,
        quantity: item.quantity,
        barcode: item.barcode,
        alt_barcodes: item.alt_barcodes || [],
      };

      try {
        if (item.kind === 'cigar') {
          const { data: cigar } = await supabase
            .from('cigars')
            .select('brand, line')
            .eq('id', item.ref_id)
            .single();
          
          if (cigar) {
            baseItem.brand = cigar.brand;
            baseItem.line = cigar.line;
          }
        } else if (item.kind === 'bottle') {
          const { data: bottle } = await supabase
            .from('bottles')
            .select('brand, expression, type')
            .eq('id', item.ref_id)
            .single();
          
          if (bottle) {
            baseItem.brand = bottle.brand;
            baseItem.expression = bottle.expression;
            baseItem.type = bottle.type;
          }
        }
      } catch (error) {
        console.error('Error fetching item details:', error);
      }

      return baseItem;
    })
  );
  
  return itemsWithDetails;
}