import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  isNetworkAvailable,
  queuePhotoUpload,
  clearPendingUpload,
  retryPendingUploads,
  subscribeToNetworkChanges,
  getNetworkState,
} from '../../utils/offline';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

describe('Offline Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isNetworkAvailable', () => {
    it('should return true when network is connected and reachable', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });

      const result = await isNetworkAvailable();
      expect(result).toBe(true);
      expect(NetInfo.fetch).toHaveBeenCalled();
    });

    it('should return false when network is not connected', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const result = await isNetworkAvailable();
      expect(result).toBe(false);
    });

    it('should return false when internet is not reachable', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
      });

      const result = await isNetworkAvailable();
      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await isNetworkAvailable();
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Error checking network status:',
        expect.any(Error)
      );
    });
  });

  describe('queuePhotoUpload', () => {
    it('should queue a photo upload successfully', async () => {
      const existingUploads = [
        {
          id: 'cigar_123_1000',
          itemId: '123',
          itemType: 'cigar',
          photoUri: 'file://photo1.jpg',
          timestamp: 1000,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(existingUploads)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queuePhotoUpload('456', 'bottle', 'file://photo2.jpg');

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('pending_photo_uploads');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        expect.stringContaining('"itemId":"456"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        expect.stringContaining('"itemType":"bottle"')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        expect.stringContaining('"photoUri":"file://photo2.jpg"')
      );
    });

    it('should handle empty pending uploads', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await queuePhotoUpload('789', 'cigar', 'file://photo3.jpg');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        expect.stringContaining('"itemId":"789"')
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await queuePhotoUpload('789', 'cigar', 'file://photo3.jpg');

      expect(console.error).toHaveBeenCalledWith(
        'Error queuing photo upload:',
        expect.any(Error)
      );
    });
  });

  describe('clearPendingUpload', () => {
    it('should clear a specific pending upload', async () => {
      const pendingUploads = [
        {
          id: 'upload1',
          itemId: '123',
          itemType: 'cigar',
          photoUri: 'file://photo1.jpg',
          timestamp: 1000,
        },
        {
          id: 'upload2',
          itemId: '456',
          itemType: 'bottle',
          photoUri: 'file://photo2.jpg',
          timestamp: 2000,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingUploads)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await clearPendingUpload('upload1');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        JSON.stringify([pendingUploads[1]])
      );
    });

    it('should handle non-existent upload ID', async () => {
      const pendingUploads = [
        {
          id: 'upload1',
          itemId: '123',
          itemType: 'cigar',
          photoUri: 'file://photo1.jpg',
          timestamp: 1000,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingUploads)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await clearPendingUpload('non-existent');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'pending_photo_uploads',
        JSON.stringify(pendingUploads)
      );
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await clearPendingUpload('upload1');

      expect(console.error).toHaveBeenCalledWith(
        'Error clearing pending upload:',
        expect.any(Error)
      );
    });
  });

  describe('retryPendingUploads', () => {
    const mockUploadFunction = jest.fn();

    beforeEach(() => {
      mockUploadFunction.mockClear();
    });

    it('should retry all pending uploads when online', async () => {
      const pendingUploads = [
        {
          id: 'upload1',
          itemId: '123',
          itemType: 'cigar' as const,
          photoUri: 'file://photo1.jpg',
          timestamp: 1000,
        },
        {
          id: 'upload2',
          itemId: '456',
          itemType: 'bottle' as const,
          photoUri: 'file://photo2.jpg',
          timestamp: 2000,
        },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingUploads)
      );
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      mockUploadFunction.mockResolvedValue(undefined);

      const result = await retryPendingUploads(mockUploadFunction);

      expect(result).toEqual({ successful: 2, failed: 0 });
      expect(mockUploadFunction).toHaveBeenCalledTimes(2);
      expect(mockUploadFunction).toHaveBeenCalledWith('123', 'cigar', 'file://photo1.jpg');
      expect(mockUploadFunction).toHaveBeenCalledWith('456', 'bottle', 'file://photo2.jpg');
    });

    it('should skip retry when offline', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const result = await retryPendingUploads(mockUploadFunction);

      expect(result).toEqual({ successful: 0, failed: 0 });
      expect(mockUploadFunction).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Network not available, skipping retry'
      );
    });

    it('should handle upload failures', async () => {
      const pendingUploads = [
        {
          id: 'upload1',
          itemId: '123',
          itemType: 'cigar' as const,
          photoUri: 'file://photo1.jpg',
          timestamp: 1000,
        },
        {
          id: 'upload2',
          itemId: '456',
          itemType: 'bottle' as const,
          photoUri: 'file://photo2.jpg',
          timestamp: 2000,
        },
      ];

      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(pendingUploads)
      );
      mockUploadFunction
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Upload failed'));

      const result = await retryPendingUploads(mockUploadFunction);

      expect(result).toEqual({ successful: 1, failed: 1 });
      expect(console.error).toHaveBeenCalledWith(
        'Failed to retry upload upload2:',
        expect.any(Error)
      );
    });

    it('should handle errors gracefully', async () => {
      (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await retryPendingUploads(mockUploadFunction);

      expect(result).toEqual({ successful: 0, failed: 0 });
      expect(console.error).toHaveBeenCalledWith(
        'Error retrying pending uploads:',
        expect.any(Error)
      );
    });
  });

  describe('subscribeToNetworkChanges', () => {
    it('should call onOnline when network becomes available', () => {
      const onOnline = jest.fn();
      const onOffline = jest.fn();
      const unsubscribe = jest.fn();

      (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribe);

      const result = subscribeToNetworkChanges(onOnline, onOffline);

      // Get the callback that was passed to addEventListener
      const callback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Simulate network becoming available
      callback({
        isConnected: true,
        isInternetReachable: true,
      });

      expect(onOnline).toHaveBeenCalled();
      expect(onOffline).not.toHaveBeenCalled();

      // Test unsubscribe
      expect(result).toBe(unsubscribe);
    });

    it('should call onOffline when network becomes unavailable', () => {
      const onOnline = jest.fn();
      const onOffline = jest.fn();
      const unsubscribe = jest.fn();

      (NetInfo.addEventListener as jest.Mock).mockReturnValue(unsubscribe);

      subscribeToNetworkChanges(onOnline, onOffline);

      const callback = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0];

      // Simulate network becoming unavailable
      callback({
        isConnected: false,
        isInternetReachable: false,
      });

      expect(onOffline).toHaveBeenCalled();
      expect(onOnline).not.toHaveBeenCalled();
    });
  });

  describe('getNetworkState', () => {
    it('should return current network state', async () => {
      const mockState = {
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { isConnectionExpensive: false },
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockState);

      const result = await getNetworkState();

      expect(result).toEqual({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
        details: { isConnectionExpensive: false },
      });
    });

    it('should handle null values in network state', async () => {
      const mockState = {
        isConnected: null,
        isInternetReachable: null,
        type: 'unknown',
        details: null,
      };

      (NetInfo.fetch as jest.Mock).mockResolvedValue(mockState);

      const result = await getNetworkState();

      expect(result).toEqual({
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
        details: null,
      });
    });

    it('should handle errors and return default state', async () => {
      (NetInfo.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getNetworkState();

      expect(result).toEqual({
        isConnected: false,
        isInternetReachable: false,
        type: 'unknown',
        details: null,
      });
      expect(console.error).toHaveBeenCalledWith(
        'Error getting network state:',
        expect.any(Error)
      );
    });
  });
});