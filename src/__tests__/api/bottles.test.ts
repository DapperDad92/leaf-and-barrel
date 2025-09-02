import { createBottle, updateBottlePhoto } from '../../api/bottles';
import { supabase } from '../../api/supabase';
import type { Bottle } from '../../types/database';

// Mock the supabase client
jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Bottles API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBottle', () => {
    it('should create a bottle with valid data', async () => {
      const mockBottle: Bottle = {
        id: '456',
        brand: 'Macallan',
        expression: '18 Year Old',
        type: 'scotch',
        age_years: 18,
        proof: 86,
        abv: 43,
        photo_url: null,
        notes: 'Smooth and complex',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockBottle,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const bottleData = {
        brand: 'Macallan',
        expression: '18 Year Old',
        type: 'scotch' as const,
        age_years: 18,
        proof: 86,
        abv: 43,
        photo_url: null,
        notes: 'Smooth and complex',
      };

      const result = await createBottle(bottleData);

      expect(supabase.from).toHaveBeenCalledWith('bottles');
      expect(mockInsert).toHaveBeenCalledWith(bottleData);
      expect(result).toEqual(mockBottle);
    });

    it('should throw an error when required field is missing', async () => {
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

      const bottleData = {
        brand: '', // Empty brand should fail
        expression: 'Test Bottle',
        type: null,
        age_years: null,
        proof: null,
        abv: null,
        photo_url: null,
        notes: null,
      };

      await expect(createBottle(bottleData)).rejects.toThrow(
        'Failed to create bottle: null value in column "brand" violates not-null constraint'
      );
    });

    it('should handle database connection errors', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: {
              message: 'Database connection timeout',
              code: 'TIMEOUT_ERROR',
            },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const bottleData = {
        brand: 'Test Brand',
        expression: 'Test Name',
        type: null,
        age_years: null,
        proof: null,
        abv: null,
        photo_url: null,
        notes: null,
      };

      await expect(createBottle(bottleData)).rejects.toThrow(
        'Failed to create bottle: Database connection timeout'
      );
    });
  });

  describe('updateBottlePhoto', () => {
    it('should update bottle photo with valid photo URL', async () => {
      const mockBottle: Bottle = {
        id: '456',
        brand: 'Macallan',
        expression: '18 Year Old',
        type: 'scotch',
        age_years: 18,
        proof: 86,
        abv: 43,
        photo_url: 'https://example.com/bottle-photo.jpg',
        notes: 'Smooth and complex',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockBottle,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateBottlePhoto('456', 'https://example.com/bottle-photo.jpg');

      expect(supabase.from).toHaveBeenCalledWith('bottles');
      expect(mockUpdate).toHaveBeenCalledWith({ photo_url: 'https://example.com/bottle-photo.jpg' });
      expect(result).toEqual(mockBottle);
    });

    it('should throw an error when bottle ID is not found', async () => {
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
        updateBottlePhoto('non-existent-id', 'https://example.com/photo.jpg')
      ).rejects.toThrow('Failed to update bottle photo: No rows found');
    });

    it('should handle invalid photo URL format', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: {
                message: 'Invalid URL format',
                code: 'VALIDATION_ERROR',
              },
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateBottlePhoto('456', 'not-a-valid-url')
      ).rejects.toThrow('Failed to update bottle photo: Invalid URL format');
    });

    it('should handle database errors during update', async () => {
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

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      await expect(
        updateBottlePhoto('456', 'https://example.com/photo.jpg')
      ).rejects.toThrow('Failed to update bottle photo: Database is in read-only mode');
    });
  });
});