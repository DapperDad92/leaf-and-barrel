// Type definitions for inventory management

export type Kind = 'cigar' | 'bottle';

export type Cigar = {
  id: string;
  brand: string;
  line?: string;
  vitola?: string;
  size_ring_gauge?: number | null;
  size_length_in?: number | null;
  wrapper?: string;
  strength?: 'mild' | 'medium' | 'full';
  photo_url?: string;
  notes?: string;
};

export type Bottle = {
  id: string;
  brand: string;
  expression?: string;
  type?: 'bourbon' | 'rye' | 'scotch' | 'irish' | 'rum' | 'tequila' | 'mezcal' | 'other';
  proof?: number | null;
  age_years?: number | null;
  photo_url?: string;
  notes?: string;
};

export type InventoryItem = {
  id: string;
  kind: Kind;
  ref_id: string;
  quantity: number;
  location?: string;
  barcode?: string;
  alt_barcodes: string[];
};