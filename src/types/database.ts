export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bottles: {
        Row: {
          id: string
          brand: string
          expression: string | null
          type: 'bourbon' | 'rye' | 'scotch' | 'irish' | 'rum' | 'tequila' | 'mezcal' | 'other' | null
          proof: number | null
          abv: number | null
          age_years: number | null
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          expression?: string | null
          type?: 'bourbon' | 'rye' | 'scotch' | 'irish' | 'rum' | 'tequila' | 'mezcal' | 'other' | null
          proof?: number | null
          abv?: number | null
          age_years?: number | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          expression?: string | null
          type?: 'bourbon' | 'rye' | 'scotch' | 'irish' | 'rum' | 'tequila' | 'mezcal' | 'other' | null
          proof?: number | null
          abv?: number | null
          age_years?: number | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cigars: {
        Row: {
          id: string
          brand: string
          line: string | null
          vitola: string | null
          size_ring_gauge: number | null
          size_length_in: number | null
          wrapper: string | null
          strength: 'mild' | 'medium' | 'full' | null
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand: string
          line?: string | null
          vitola?: string | null
          size_ring_gauge?: number | null
          size_length_in?: number | null
          wrapper?: string | null
          strength?: 'mild' | 'medium' | 'full' | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand?: string
          line?: string | null
          vitola?: string | null
          size_ring_gauge?: number | null
          size_length_in?: number | null
          wrapper?: string | null
          strength?: 'mild' | 'medium' | 'full' | null
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          kind: 'cigar' | 'bottle'
          ref_id: string
          quantity: number
          location: string | null
          barcode: string | null
          alt_barcodes: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          kind: 'cigar' | 'bottle'
          ref_id: string
          quantity?: number
          location?: string | null
          barcode?: string | null
          alt_barcodes?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kind?: 'cigar' | 'bottle'
          ref_id?: string
          quantity?: number
          location?: string | null
          barcode?: string | null
          alt_barcodes?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      removal_events: {
        Row: {
          id: string
          inventory_item_id: string | null
          quantity_removed: number
          reason: 'smoked' | 'empty' | 'adjustment'
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id?: string | null
          quantity_removed: number
          reason: 'smoked' | 'empty' | 'adjustment'
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string | null
          quantity_removed?: number
          reason?: 'smoked' | 'empty' | 'adjustment'
          created_at?: string
        }
      }
      scan_events: {
        Row: {
          id: string
          session_id: string | null
          kind: 'cigar' | 'bottle' | null
          barcode: string | null
          matched_ref_id: string | null
          quantity: number
          status: 'matched' | 'manual' | 'failed' | null
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id?: string | null
          kind?: 'cigar' | 'bottle' | null
          barcode?: string | null
          matched_ref_id?: string | null
          quantity?: number
          status?: 'matched' | 'manual' | 'failed' | null
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string | null
          kind?: 'cigar' | 'bottle' | null
          barcode?: string | null
          matched_ref_id?: string | null
          quantity?: number
          status?: 'matched' | 'manual' | 'failed' | null
          photo_url?: string | null
          created_at?: string
        }
      }
      scan_sessions: {
        Row: {
          id: string
          started_at: string
          ended_at: string | null
          items_added: number
          items_failed: number
        }
        Insert: {
          id?: string
          started_at?: string
          ended_at?: string | null
          items_added?: number
          items_failed?: number
        }
        Update: {
          id?: string
          started_at?: string
          ended_at?: string | null
          items_added?: number
          items_failed?: number
        }
      }
    }
    Views: {
      inventory_items_detailed: {
        Row: {
          id: string | null
          kind: 'cigar' | 'bottle' | null
          ref_id: string | null
          quantity: number | null
          location: string | null
          barcode: string | null
          alt_barcodes: string[] | null
          created_at: string | null
          updated_at: string | null
          brand: string | null
          line_or_expression: string | null
          variant_info: string | null
          photo_url: string | null
        }
      }
    }
    Functions: {
      get_current_inventory: {
        Args: {
          p_kind: string
          p_ref_id: string
        }
        Returns: number
      }
      search_by_barcode: {
        Args: {
          p_barcode: string
        }
        Returns: {
          id: string
          kind: string
          ref_id: string
          brand: string
          line_or_expression: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Cigar = Tables<'cigars'>
export type Bottle = Tables<'bottles'>
export type InventoryItem = Tables<'inventory_items'>
export type ScanSession = Tables<'scan_sessions'>
export type ScanEvent = Tables<'scan_events'>
export type RemovalEvent = Tables<'removal_events'>

// View types
export type InventoryItemDetailed = Database['public']['Views']['inventory_items_detailed']['Row']

// Function return types
export type BarcodeSearchResult = Database['public']['Functions']['search_by_barcode']['Returns'][0]