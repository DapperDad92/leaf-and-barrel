import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabase';
import { 
  ScanSession, 
  ScanEvent, 
  Insertable,
  Tables,
  BarcodeSearchResult 
} from '../types/database';

interface ScanSessionState {
  session: ScanSession | null;
  events: ScanEvent[];
  isActive: boolean;
}

interface StartSessionResult {
  session: ScanSession;
}

interface AddScanEventParams {
  barcode: string;
  quantity: number;
  kind: 'cigar' | 'bottle';
}

interface AddScanEventResult {
  event: ScanEvent;
  matchedItem?: BarcodeSearchResult;
}

export function useScanSession() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ScanSessionState>({
    session: null,
    events: [],
    isActive: false,
  });

  // Keep track of processed barcodes to prevent duplicates
  const processedBarcodes = useRef<Set<string>>(new Set());

  // Start a new scan session
  const startSession = useMutation<StartSessionResult, Error>({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('scan_sessions')
        .insert({
          started_at: new Date().toISOString(),
          items_added: 0,
          items_failed: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return { session: data };
    },
    onSuccess: ({ session }) => {
      setState({
        session,
        events: [],
        isActive: true,
      });
      processedBarcodes.current.clear();
    },
  });

  // Search for existing items by barcode
  const searchByBarcode = useCallback(async (barcode: string): Promise<BarcodeSearchResult[]> => {
    const { data, error } = await supabase
      .rpc('search_by_barcode', { p_barcode: barcode });

    if (error) {
      console.error('Error searching by barcode:', error);
      return [];
    }

    return data || [];
  }, []);

  // Add a scan event to the current session
  const addScanEvent = useMutation<AddScanEventResult, Error, AddScanEventParams>({
    mutationFn: async ({ barcode, quantity, kind }) => {
      if (!state.session) {
        throw new Error('No active scan session');
      }

      // Check if barcode was already processed in this session
      if (processedBarcodes.current.has(barcode)) {
        throw new Error('This item has already been scanned in this session');
      }

      // Search for existing items with this barcode
      const matches = await searchByBarcode(barcode);
      const matchedItem = matches.find(item => item.kind === kind);

      // Create the scan event
      const scanEvent: Insertable<'scan_events'> = {
        session_id: state.session.id,
        kind,
        barcode,
        matched_ref_id: matchedItem?.ref_id || null,
        quantity,
        status: matchedItem ? 'matched' : 'manual',
        created_at: new Date().toISOString(),
      };

      const { data: eventData, error: eventError } = await supabase
        .from('scan_events')
        .insert(scanEvent)
        .select()
        .single();

      if (eventError) throw eventError;

      // Update session counters
      const isSuccess = matchedItem !== undefined;
      const { error: updateError } = await supabase
        .from('scan_sessions')
        .update({
          items_added: state.session.items_added + (isSuccess ? 1 : 0),
          items_failed: state.session.items_failed + (isSuccess ? 0 : 1),
        })
        .eq('id', state.session.id);

      if (updateError) throw updateError;

      // If matched, update or create inventory item
      if (matchedItem) {
        // Check if inventory item already exists
        const { data: existingInventory } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('kind', kind)
          .eq('ref_id', matchedItem.ref_id)
          .eq('barcode', barcode)
          .single();

        if (existingInventory) {
          // Update existing inventory item
          await supabase
            .from('inventory_items')
            .update({
              quantity: existingInventory.quantity + quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingInventory.id);
        } else {
          // Create new inventory item
          await supabase
            .from('inventory_items')
            .insert({
              kind,
              ref_id: matchedItem.ref_id,
              quantity,
              barcode,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      }

      return { event: eventData, matchedItem };
    },
    onSuccess: ({ event }) => {
      // Mark barcode as processed
      if (event.barcode) {
        processedBarcodes.current.add(event.barcode);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        events: [...prev.events, event],
        session: prev.session ? {
          ...prev.session,
          items_added: prev.session.items_added + (event.status === 'matched' ? 1 : 0),
          items_failed: prev.session.items_failed + (event.status !== 'matched' ? 1 : 0),
        } : null,
      }));

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['cigars'] });
      queryClient.invalidateQueries({ queryKey: ['bottles'] });
    },
  });

  // End the current scan session
  const endSession = useMutation<void, Error>({
    mutationFn: async () => {
      if (!state.session) {
        throw new Error('No active scan session');
      }

      const { error } = await supabase
        .from('scan_sessions')
        .update({
          ended_at: new Date().toISOString(),
        })
        .eq('id', state.session.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setState({
        session: null,
        events: [],
        isActive: false,
      });
      processedBarcodes.current.clear();
    },
  });

  // Check if a barcode has already been scanned in this session
  const isBarcodeScanned = useCallback((barcode: string): boolean => {
    return processedBarcodes.current.has(barcode);
  }, []);

  return {
    // State
    session: state.session,
    events: state.events,
    isActive: state.isActive,
    
    // Actions
    startSession: startSession.mutate,
    addScanEvent: addScanEvent.mutate,
    endSession: endSession.mutate,
    searchByBarcode,
    isBarcodeScanned,
    
    // Loading states
    isStarting: startSession.isPending,
    isAddingEvent: addScanEvent.isPending,
    isEnding: endSession.isPending,
    
    // Error states
    startError: startSession.error,
    addEventError: addScanEvent.error,
    endError: endSession.error,
  };
}