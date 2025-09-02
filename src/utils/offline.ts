import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { processOfflineQueue } from '../services/syncService';

const PENDING_UPLOADS_KEY = 'pending_photo_uploads';

interface PendingUpload {
  id: string;
  itemId: string;
  itemType: 'cigar' | 'bottle';
  photoUri: string;
  timestamp: number;
}

/**
 * Check if network is available
 */
export async function isNetworkAvailable(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
}

/**
 * Queue a photo upload for later retry
 */
export async function queuePhotoUpload(
  itemId: string,
  itemType: 'cigar' | 'bottle',
  photoUri: string
): Promise<void> {
  try {
    const pendingUploads = await getPendingUploads();
    const newUpload: PendingUpload = {
      id: `${itemType}_${itemId}_${Date.now()}`,
      itemId,
      itemType,
      photoUri,
      timestamp: Date.now(),
    };
    
    pendingUploads.push(newUpload);
    await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(pendingUploads));
  } catch (error) {
    console.error('Error queuing photo upload:', error);
  }
}

/**
 * Get all pending uploads
 */
async function getPendingUploads(): Promise<PendingUpload[]> {
  try {
    const data = await AsyncStorage.getItem(PENDING_UPLOADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting pending uploads:', error);
    return [];
  }
}

/**
 * Clear a specific pending upload after successful upload
 */
export async function clearPendingUpload(uploadId: string): Promise<void> {
  try {
    const pendingUploads = await getPendingUploads();
    const filtered = pendingUploads.filter(upload => upload.id !== uploadId);
    await AsyncStorage.setItem(PENDING_UPLOADS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing pending upload:', error);
  }
}

/**
 * Retry all pending uploads when back online
 */
export async function retryPendingUploads(
  uploadFunction: (itemId: string, itemType: 'cigar' | 'bottle', photoUri: string) => Promise<void>
): Promise<{ successful: number; failed: number }> {
  const results = { successful: 0, failed: 0 };
  
  try {
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      console.log('Network not available, skipping retry');
      return results;
    }

    const pendingUploads = await getPendingUploads();
    console.log(`Found ${pendingUploads.length} pending uploads to retry`);

    for (const upload of pendingUploads) {
      try {
        await uploadFunction(upload.itemId, upload.itemType, upload.photoUri);
        await clearPendingUpload(upload.id);
        results.successful++;
      } catch (error) {
        console.error(`Failed to retry upload ${upload.id}:`, error);
        results.failed++;
      }
    }
  } catch (error) {
    console.error('Error retrying pending uploads:', error);
  }

  return results;
}

/**
 * Subscribe to network state changes
 */
export function subscribeToNetworkChanges(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      onOnline();
    } else {
      onOffline();
    }
  });

  return unsubscribe;
}

/**
 * Get current network state
 */
export async function getNetworkState() {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected === true,
      isInternetReachable: state.isInternetReachable === true,
      type: state.type,
      details: state.details,
    };
  } catch (error) {
    console.error('Error getting network state:', error);
    return {
      isConnected: false,
      isInternetReachable: false,
      type: 'unknown',
      details: null,
    };
  }
}

/**
 * Subscribe to network changes and automatically process offline queue
 * This prevents multiple simultaneous processing
 */
let isProcessingQueue = false;
let queueProcessingUnsubscribe: (() => void) | null = null;

export function subscribeToQueueProcessing(): () => void {
  // Prevent multiple subscriptions
  if (queueProcessingUnsubscribe) {
    return queueProcessingUnsubscribe;
  }

  queueProcessingUnsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected && state.isInternetReachable && !isProcessingQueue) {
      isProcessingQueue = true;
      console.log('Network available, processing offline queue');
      
      try {
        await processOfflineQueue();
      } catch (error) {
        console.error('Error processing offline queue:', error);
      } finally {
        isProcessingQueue = false;
      }
    }
  });

  // Process queue immediately if online
  isNetworkAvailable().then(isOnline => {
    if (isOnline && !isProcessingQueue) {
      isProcessingQueue = true;
      processOfflineQueue()
        .catch(error => console.error('Error processing offline queue:', error))
        .finally(() => { isProcessingQueue = false; });
    }
  });

  return () => {
    if (queueProcessingUnsubscribe) {
      queueProcessingUnsubscribe();
      queueProcessingUnsubscribe = null;
    }
  };
}