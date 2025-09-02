import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { AddCigarScreen } from '../../screens/AddCigarScreen';
import { createCigar, updateCigarPhoto } from '../../api/cigars';
import { createInventoryItem } from '../../api/inventory';
import { uploadPhoto } from '../../api/storage';
import { isNetworkAvailable, queuePhotoUpload } from '../../utils/offline';
import { useQueryClient } from '@tanstack/react-query';

// Mock dependencies
jest.mock('../../api/cigars');
jest.mock('../../api/inventory');
jest.mock('../../api/storage');
jest.mock('../../utils/offline');
jest.mock('@tanstack/react-query');
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
} as any;

// Mock query client
const mockInvalidateQueries = jest.fn();
const mockQueryClient = {
  invalidateQueries: mockInvalidateQueries,
};

describe('AddCigarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);
    (isNetworkAvailable as jest.Mock).mockResolvedValue(true);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render without barcode params', () => {
      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      expect(getByPlaceholderText('Enter brand name')).toBeTruthy();
      expect(getByPlaceholderText('Enter line name')).toBeTruthy();
      expect(getByPlaceholderText('Enter vitola')).toBeTruthy();
      expect(getByText('Save')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });

    it('should render with barcode params', () => {
      const { getByPlaceholderText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{
            params: {
              fromScanner: true,
              barcode: '1234567890',
            },
          } as any}
        />
      );

      expect(getByPlaceholderText('Enter brand name')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should disable save button when brand is empty', () => {
      const { getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      const saveButton = getByText('Save').parent;
      expect(saveButton?.props.accessibilityState?.disabled).toBe(true);
    });

    it('should enable save button when brand is filled', () => {
      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      const brandInput = getByPlaceholderText('Enter brand name');
      fireEvent.changeText(brandInput, 'Cohiba');

      const saveButton = getByText('Save').parent;
      expect(saveButton?.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('Save Flow', () => {
    it('should save cigar successfully and navigate', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: 'Behike',
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      // Fill form
      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      fireEvent.changeText(getByPlaceholderText('Enter line name'), 'Behike');

      // Save
      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(createCigar).toHaveBeenCalledWith({
          brand: 'Cohiba',
          line: 'Behike',
          vitola: null,
          size_ring_gauge: null,
          size_length_in: null,
          wrapper: null,
          strength: null,
          photo_url: null,
          notes: null,
        });
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'success',
        text1: 'Cigar Added',
        text2: 'Cohiba has been added to your collection',
        position: 'bottom',
      });

      expect(mockNavigate).toHaveBeenCalledWith('CigarsList');
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cigars'] });
    });

    it('should navigate back when from scanner', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{
            params: {
              fromScanner: true,
              barcode: '1234567890',
            },
          } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should create inventory item with barcode', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);
      (createInventoryItem as jest.Mock).mockResolvedValue({
        id: '456',
        kind: 'cigar',
        ref_id: '123',
        quantity: 1,
        barcode: '1234567890',
      });

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{
            params: {
              fromScanner: true,
              barcode: '1234567890',
            },
          } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(createInventoryItem).toHaveBeenCalledWith({
          kind: 'cigar',
          ref_id: '123',
          quantity: 1,
          barcode: '1234567890',
        });
      });
    });

    it('should handle save errors gracefully', async () => {
      (createCigar as jest.Mock).mockRejectedValue(new Error('Database error'));
      (isNetworkAvailable as jest.Mock).mockResolvedValue(false);

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Unable to Save',
          'Unable to save cigar. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('Photo Upload', () => {
    it('should upload photo when online', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);
      (uploadPhoto as jest.Mock).mockResolvedValue('https://example.com/photo.jpg');
      (updateCigarPhoto as jest.Mock).mockResolvedValue({
        ...mockCigar,
        photo_url: 'https://example.com/photo.jpg',
      });

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      
      // Simulate photo selection by calling onSave with photoUri
      const form = getByText('Save').parent?.parent?.parent;
      const onSave = form?.props.onSave;
      await onSave('file://photo.jpg');

      await waitFor(() => {
        expect(uploadPhoto).toHaveBeenCalledWith('file://photo.jpg', 'cigars', '123');
        expect(updateCigarPhoto).toHaveBeenCalledWith('123', 'https://example.com/photo.jpg');
      });
    });

    it('should queue photo upload when offline', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);
      (isNetworkAvailable as jest.Mock).mockResolvedValue(false);
      (queuePhotoUpload as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      
      // Simulate photo selection
      const form = getByText('Save').parent?.parent?.parent;
      const onSave = form?.props.onSave;
      await onSave('file://photo.jpg');

      await waitFor(() => {
        expect(queuePhotoUpload).toHaveBeenCalledWith('123', 'cigar', 'file://photo.jpg');
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Offline Mode',
        text2: 'Photo will be uploaded when connection is restored',
        position: 'bottom',
        visibilityTime: 3000,
      });
    });

    it('should queue photo on upload failure', async () => {
      const mockCigar = {
        id: '123',
        brand: 'Cohiba',
        line: null,
        vitola: null,
        size_ring_gauge: null,
        size_length_in: null,
        wrapper: null,
        strength: null,
        photo_url: null,
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (createCigar as jest.Mock).mockResolvedValue(mockCigar);
      (uploadPhoto as jest.Mock).mockRejectedValue(new Error('Upload failed'));
      (queuePhotoUpload as jest.Mock).mockResolvedValue(undefined);

      const { getByPlaceholderText, getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter brand name'), 'Cohiba');
      
      const form = getByText('Save').parent?.parent?.parent;
      const onSave = form?.props.onSave;
      await onSave('file://photo.jpg');

      await waitFor(() => {
        expect(queuePhotoUpload).toHaveBeenCalledWith('123', 'cigar', 'file://photo.jpg');
      });

      expect(Toast.show).toHaveBeenCalledWith({
        type: 'info',
        text1: 'Photo Saved Locally',
        text2: 'Photo will be uploaded when connection is restored',
        position: 'bottom',
        visibilityTime: 3000,
      });
    });
  });

  describe('Navigation', () => {
    it('should handle cancel button', () => {
      const { getByText } = render(
        <AddCigarScreen
          navigation={mockNavigation}
          route={{ params: {} } as any}
        />
      );

      fireEvent.press(getByText('Cancel'));
      expect(mockGoBack).toHaveBeenCalled();
    });
  });
});