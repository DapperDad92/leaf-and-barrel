import { createCigar, updateCigarPhoto } from '../../api/cigars';
import { supabase } from '../../api/supabase';
import type { Cigar } from '../../types/database';

// Mock the supabase client
jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Cigars API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCigar', () => {
    it('should create a cigar with valid data', async () => {
      const mockCigar: Cigar = {
        id: '123',
        brand: 'Cohiba',
        line: 'Behike',
        vitola: 'BHK 52',
        size_ring_gauge: 52,
        size_length_in: 4.5,
        wrapper: 'Cuban',
        strength: 'medium',
        photo_url: null,
        notes: 'Excellent cigar',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockCigar,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const cigarData = {
        brand: 'Cohiba',
        line: 'Behike',
        vitola: 'BHK 52',
        size_ring_gauge: 52,
        size_length_in: 4.5,
        wrapper: 'Cuban',
        strength: 'medium' as const,
        photo_url: null,
        notes: 'Excellent cigar',
      };

      const result = await createCigar(cigarData);

      expect(supabase.from).toHaveBeenCalledWith('cigars');
      expect(mockInsert).toHaveBeenCalledWith(cigarData);
      expect(result).toEqual(mockCigar);
    });

    it('should throw an error when brand is missing', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'null value in column "brand" violates not-null constraint',
              code: '23502',
            },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const cigarData = {
        brand: '', // Empty brand should fail
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
      };

      await expect(createCigar(cigarData)).rejects.toThrow(
        'Failed to create cigar: null value in column "brand" violates not-null constraint'
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'Database connection error',
              code: 'CONNECTION_ERROR',
            },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const cigarData = {
        brand: 'Test Brand',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
      };

      await expect(createCigar(cigarData)).rejects.toThrow(
        'Failed to create cigar: Database connection error'
      );
    });
  });

  describe('updateCigarPhoto', () => {
    it('should update cigar photo with valid photo URL', async () => {
      const mockCigar: Cigar = {
        id: '123',
        brand: 'Cohiba',
        line: 'Behike',
        vitola: 'BHK 52',
        size_ring_gauge: 52,
        size_length_in: 4.5,
        wrapper: 'Cuban',
        strength: 'medium',
        photo_url: 'https://example.com/photo.jpg',
        notes: 'Excellent cigar',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCigar,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateCigarPhoto('123', 'https://example.com/photo.jpg');

      expect(supabase.from).toHaveBeenCalledWith('cigars');
      expect(mockUpdate).toHaveBeenCalledWith({ photo_url: 'https://example.com/photo.jpg' });
      expect(result).toEqual(mockCigar);
    });

    it('should throw an error when cigar ID is invalid', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'No rows found',
                code: 'PGRST116',
              },
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateCigarPhoto('invalid-id', 'https://example.com/photo.jpg')
      ).rejects.toThrow('Failed to update cigar photo: No rows found');
    });

    it('should handle database errors gracefully', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Database connection error',
                code: 'CONNECTION_ERROR',
              },
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateCigarPhoto('123', 'https://example.com/photo.jpg')
      ).rejects.toThrow('Failed to update cigar photo: Database connection error');
    });
  });
});