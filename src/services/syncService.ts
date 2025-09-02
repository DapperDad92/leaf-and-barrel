import { incrementQuantity } from '../api/inventory';
import { uploadPhoto } from '../api/storage';
import { getQueue, dequeue, removeJob, OfflineJob } from '../store/offlineQueue';
import { isNetworkAvailable, subscribeToNetworkChanges } from '../utils/offline';

let isProcessing = false;
let retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
let networkUnsubscribe: (() => void) | null = null;

/**
 * Process all jobs in the offline queue
 */
export async function processOfflineQueue(): Promise<void> {
  // Prevent multiple simultaneous processing
  if (isProcessing) {
    console.log('Queue processing already in progress');
    return;
  }

  // Check network availability
  const isOnline = await isNetworkAvailable();
  if (!isOnline) {
    console.log('Network not available, skipping queue processing');
    return;
  }

  isProcessing = true;
  console.log('Starting offline queue processing');

  try {
    const queue = await getQueue();
    console.log(`Processing ${queue.length} queued jobs`);

    // Process jobs in FIFO order
    let job: OfflineJob | null;
    while ((job = await dequeue()) !== null) {
      try {
        await processJob(job);
        console.log(`Successfully processed job: ${job.type}`);
      } catch (error) {
        console.error(`Failed to process job: ${job.type}`, error);
        // Re-queue the job for retry with exponential backoff
        await retryJob(job, 1);
      }
    }
  } catch (error) {
    console.error('Error processing offline queue:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a single job
 */
async function processJob(job: OfflineJob): Promise<void> {
  switch (job.type) {
    case 'increment':
      await incrementQuantity(job.itemId, job.by);
      break;
    
    case 'uploadPhoto':
      // Convert singular to plural for bucket name
      const bucket = job.kind === 'cigar' ? 'cigars' : 'bottles';
      await uploadPhoto(job.fileUri, bucket, job.path);
      break;
    
    default:
      throw new Error(`Unknown job type: ${(job as any).type}`);
  }
}

/**
 * Retry a failed job with exponential backoff
 */
async function retryJob(job: OfflineJob, attemptNumber: number): Promise<void> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second
  
  if (attemptNumber > maxRetries) {
    console.error(`Job failed after ${maxRetries} attempts, removing from queue`, job);
    return;
  }

  // Calculate exponential backoff delay
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  const jobKey = getJobKey(job);

  // Clear any existing timeout for this job
  const existingTimeout = retryTimeouts.get(jobKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Schedule retry
  const timeout = setTimeout(async () => {
    retryTimeouts.delete(jobKey);
    
    try {
      await processJob(job);
      console.log(`Successfully processed job on retry attempt ${attemptNumber}: ${job.type}`);
    } catch (error) {
      console.error(`Retry attempt ${attemptNumber} failed for job: ${job.type}`, error);
      await retryJob(job, attemptNumber + 1);
    }
  }, delay);

  retryTimeouts.set(jobKey, timeout);
}

/**
 * Get a unique key for a job
 */
function getJobKey(job: OfflineJob): string {
  switch (job.type) {
    case 'increment':
      return `${job.type}_${job.itemId}_${job.timestamp}`;
    case 'uploadPhoto':
      return `${job.type}_${job.id}_${job.timestamp}`;
    default:
      return `unknown_${Date.now()}`;
  }
}

/**
 * Start the sync service with network monitoring
 */
export function startSyncService(): void {
  console.log('Starting sync service');

  // Process any existing queued jobs
  processOfflineQueue();

  // Subscribe to network changes
  if (!networkUnsubscribe) {
    networkUnsubscribe = subscribeToNetworkChanges(
      () => {
        console.log('Network came online, processing queue');
        processOfflineQueue();
      },
      () => {
        console.log('Network went offline');
      }
    );
  }
}

/**
 * Stop the sync service
 */
export function stopSyncService(): void {
  console.log('Stopping sync service');

  // Unsubscribe from network changes
  if (networkUnsubscribe) {
    networkUnsubscribe();
    networkUnsubscribe = null;
  }

  // Clear all retry timeouts
  retryTimeouts.forEach(timeout => clearTimeout(timeout));
  retryTimeouts.clear();
}

/**
 * Check if the sync service is currently processing
 */
export function isSyncServiceProcessing(): boolean {
  return isProcessing;
}