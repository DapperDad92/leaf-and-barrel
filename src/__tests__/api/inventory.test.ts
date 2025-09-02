import { createInventoryItem, addAltBarcodeIfMissing } from '../../api/inventory';
import { supabase } from '../../api/supabase';
import type { InventoryItem } from '../../types/database';

// Mock the supabase client
jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Inventory API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInventoryItem', () => {
    it('should create inventory item with barcode', async () => {
      const mockInventoryItem: InventoryItem = {
        id: '789',
        kind: 'cigar',
        ref_id: '123',
        quantity: 5,
        location: null,
        barcode: '1234567890',
        alt_barcodes: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockInventoryItem,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const itemData = {
        kind: 'cigar' as const,
        ref_id: '123',
        quantity: 5,
        barcode: '1234567890',
        alt_barcodes: [],
      };

      const result = await createInventoryItem(itemData);

      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(mockInsert).toHaveBeenCalledWith({
        ...itemData,
        alt_barcodes: [],
      });
      expect(result).toEqual(mockInventoryItem);
    });

    it('should create inventory item without barcode', async () => {
      const mockInventoryItem: InventoryItem = {
        id: '790',
        kind: 'bottle',
        ref_id: '456',
        quantity: 1,
        location: null,
        barcode: null,
        alt_barcodes: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockInventoryItem,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const itemData = {
        kind: 'bottle' as const,
        ref_id: '456',
        quantity: 1,
      };

      const result = await createInventoryItem(itemData);

      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(mockInsert).toHaveBeenCalledWith({
        ...itemData,
        alt_barcodes: [],
      });
      expect(result).toEqual(mockInventoryItem);
    });

    it('should handle database errors gracefully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'Foreign key constraint violation',
              code: '23503',
            },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const itemData = {
        kind: 'cigar' as const,
        ref_id: 'invalid-ref-id',
        quantity: 1,
      };

      await expect(createInventoryItem(itemData)).rejects.toThrow(
        'Failed to create inventory item: Foreign key constraint violation'
      );
    });
  });

  describe('addAltBarcodeIfMissing', () => {
    it('should add new barcode to alt_barcodes array', async () => {
      const currentItem: InventoryItem = {
        id: '789',
        kind: 'cigar',
        ref_id: '123',
        quantity: 5,
        location: null,
        barcode: '1234567890',
        alt_barcodes: ['9876543210'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const updatedItem: InventoryItem = {
        ...currentItem,
        alt_barcodes: ['9876543210', '1111111111'],
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: currentItem,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedItem,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await addAltBarcodeIfMissing('789', '1111111111');

      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(mockUpdate).toHaveBeenCalledWith({
        alt_barcodes: ['9876543210', '1111111111'],
      });
      expect(result).toEqual(updatedItem);
    });

    it('should not add duplicate barcode to alt_barcodes array', async () => {
      const currentItem: InventoryItem = {
        id: '789',
        kind: 'cigar',
        ref_id: '123',
        quantity: 5,
        location: null,
        barcode: '1234567890',
        alt_barcodes: ['9876543210', '1111111111'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: currentItem,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await addAltBarcodeIfMissing('789', '9876543210');

      // Should not call update since barcode already exists
      expect(supabase.from).toHaveBeenCalledTimes(1);
      expect(result).toEqual(currentItem);
    });
    it('should handle empty alt_barcodes array', async () => {
      const currentItem: InventoryItem = {
        id: '789',
        kind: 'cigar',
        ref_id: '123',
        quantity: 5,
        location: null,
        barcode: '1234567890',
        alt_barcodes: null as any, // Testing null case
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };
      };

      const updatedItem: InventoryItem = {
        ...currentItem,
        alt_barcodes: ['1111111111'],
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: currentItem,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: updatedItem,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await addAltBarcodeIfMissing('789', '1111111111');

      expect(mockUpdate).toHaveBeenCalledWith({
        alt_barcodes: ['1111111111'],
      });
      expect(result).toEqual(updatedItem);
    });

    it('should throw error when inventory item not found', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'No rows found',
              code: 'PGRST116',
            },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(
        addAltBarcodeIfMissing('non-existent-id', '1111111111')
      ).rejects.toThrow('Failed to fetch inventory item: No rows found');
    });

    it('should handle update errors gracefully', async () => {
      const currentItem: InventoryItem = {
        id: '789',
        kind: 'cigar',
        ref_id: '123',
        quantity: 5,
        location: null,
        barcode: '1234567890',
        alt_barcodes: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: currentItem,
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Database is in read-only mode',
                code: 'READ_ONLY',
              },
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelect })
        .mockReturnValueOnce({ update: mockUpdate });

      await expect(
        addAltBarcodeIfMissing('789', '1111111111')
      ).rejects.toThrow('Failed to update alt barcodes: Database is in read-only mode');
    });
  });
});