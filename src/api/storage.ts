import { supabase } from './supabase';

/**
 * Converts a base64 string to ArrayBuffer
 * @param base64 - The base64 string to convert
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Uploads a photo to the appropriate storage bucket
 * @param file - The file to upload (as base64 string or Blob)
 * @param bucket - The bucket name ('cigars' or 'bottles')
 * @param fileName - The name for the uploaded file
 * @returns Promise with the public URL of the uploaded photo
 */
export async function uploadPhoto(
  file: string | Blob,
  bucket: 'cigars' | 'bottles',
  fileName: string
): Promise<string> {
  try {
    let fileData: ArrayBuffer | Blob;
    
    // If file is a base64 string, convert it to ArrayBuffer
    if (typeof file === 'string') {
      // Remove data URL prefix if present
      const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
      fileData = base64ToArrayBuffer(base64Data);
    } else {
      fileData = file;
    }

    // Generate a unique file name with timestamp to avoid conflicts
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Upload the file to the specified bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFileName, fileData, {
        contentType: `image/${fileExtension}`,
        upsert: false
      });

    if (error) {
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded photo');
    }

    return publicUrl;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during photo upload');
  }
}