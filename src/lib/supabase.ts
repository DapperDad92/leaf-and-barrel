import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import type { Database } from '../types/database';
import { isNetworkAvailable } from '../utils/offline';

// User-friendly error messages
const ERROR_MESSAGES = {
  MISSING_ENV: 'The app is not properly configured. Please contact support if this issue persists.',
  INVALID_URL: 'The app configuration appears to be incorrect. Please reinstall the app or contact support.',
  INVALID_KEY: 'Unable to connect to the server. Please try again later or contact support.',
  NETWORK_ERROR: 'No internet connection. Some features may be limited.',
};

// Environment guard to ensure Supabase credentials are valid
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  throw new Error(ERROR_MESSAGES.MISSING_ENV);
}

// Additional validation to ensure URL is valid
try {
  new URL(SUPABASE_URL);
} catch (error) {
  console.error('Invalid SUPABASE_URL format:', SUPABASE_URL);
  throw new Error(ERROR_MESSAGES.INVALID_URL);
}

// Validate that the anon key is not empty and has reasonable length
if (SUPABASE_ANON_KEY.length < 30) {
  console.error('Invalid SUPABASE_ANON_KEY length:', SUPABASE_ANON_KEY.length);
  throw new Error(ERROR_MESSAGES.INVALID_KEY);
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Export the client type for use in other files
export type SupabaseClient = typeof supabase;

// Helper function to check if we can connect to Supabase
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    // First check network availability
    const isOnline = await isNetworkAvailable();
    if (!isOnline) {
      console.log('No network connection available');
      return false;
    }

    // Try a simple query to test connection
    const { error } = await supabase.from('cigars').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
}

// Export error messages for consistent use across the app
export { ERROR_MESSAGES };

// Debug function to test Supabase connection and permissions
export async function debugSupabaseConnection() {
  console.log('[DEBUG] Testing Supabase connection...');
  
  // Check auth state
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  console.log('[DEBUG] Auth check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    error: authError?.message,
  });
  
  // Test SELECT
  console.log('[DEBUG] Testing SELECT on cigars table...');
  const { data: selectData, error: selectError } = await supabase
    .from('cigars')
    .select('id')
    .limit(1);
  
  console.log('[DEBUG] SELECT result:', {
    success: !selectError,
    rowCount: selectData?.length || 0,
    error: selectError?.message,
  });
  
  // Test INSERT with minimal data
  console.log('[DEBUG] Testing INSERT on cigars table...');
  const testCigar = {
    brand: 'TEST_BRAND_' + Date.now(),
    line: null,
    vitola: null,
    size_ring_gauge: null,
    size_length_in: null,
    wrapper: null,
    strength: null,
    photo_url: null,
    notes: null,
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('cigars')
    .insert(testCigar)
    .select()
    .single();
  
  console.log('[DEBUG] INSERT result:', {
    success: !insertError,
    insertedId: insertData?.id,
    error: insertError?.message,
    errorDetails: insertError?.details,
    errorHint: insertError?.hint,
  });
  
  // Clean up test data if insert was successful
  if (insertData?.id) {
    const { error: deleteError } = await supabase
      .from('cigars')
      .delete()
      .eq('id', insertData.id);
    
    console.log('[DEBUG] Cleanup:', {
      success: !deleteError,
      error: deleteError?.message,
    });
  }
  
  return {
    authOk: !authError,
    selectOk: !selectError,
    insertOk: !insertError,
  };
}