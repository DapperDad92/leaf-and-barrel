import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = 'offline_job_queue';

// Define the types of offline jobs
export type OfflineJob =
  | { type: 'increment'; itemId: string; by: number; timestamp: number }
  | { type: 'uploadPhoto'; kind: 'cigar' | 'bottle'; id: string; path: string; fileUri: string; timestamp: number };

/**
 * Enqueue a job to be processed when online
 */
export async function enqueue(job: OfflineJob): Promise<void> {
  try {
    const queue = await getQueue();
    queue.push(job);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error enqueuing job:', error);
    throw error;
  }
}

/**
 * Dequeue the oldest job (FIFO)
 */
export async function dequeue(): Promise<OfflineJob | null> {
  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      return null;
    }
    
    const job = queue.shift();
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return job || null;
  } catch (error) {
    console.error('Error dequeuing job:', error);
    return null;
  }
}

/**
 * Get all queued jobs
 */
export async function getQueue(): Promise<OfflineJob[]> {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
}

/**
 * Clear all jobs from the queue
 */
export async function clearQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing queue:', error);
    throw error;
  }
}

/**
 * Get the size of the queue
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Remove a specific job from the queue
 */
export async function removeJob(job: OfflineJob): Promise<void> {
  try {
    const queue = await getQueue();
    const filteredQueue = queue.filter(j => {
      // Compare jobs based on their properties
      if (j.type !== job.type) return true;
      
      switch (j.type) {
        case 'increment':
          return !(j.itemId === (job as any).itemId && j.timestamp === job.timestamp);
        case 'uploadPhoto':
          return !(j.id === (job as any).id && j.timestamp === job.timestamp);
        default:
          return true;
      }
    });
    
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error removing job:', error);
    throw error;
  }
}

/**
 * Check if a similar job already exists in the queue
 */
export async function hasJob(type: OfflineJob['type'], itemId: string): Promise<boolean> {
  try {
    const queue = await getQueue();
    return queue.some(job => {
      if (job.type !== type) return false;
      
      switch (job.type) {
        case 'increment':
          return job.itemId === itemId;
        case 'uploadPhoto':
          return job.id === itemId;
        default:
          return false;
      }
    });
  } catch (error) {
    console.error('Error checking job existence:', error);
    return false;
  }
}