// Error handling utilities for consistent error management

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode?: number;
    details?: any;
  };
}

/**
 * Handles errors from Supabase operations and returns a consistent error format
 */
export function handleSupabaseError(error: any): ErrorResponse {
  console.error('Supabase error:', error);

  if (error?.message) {
    return {
      error: {
        message: error.message,
        code: error.code || 'SUPABASE_ERROR',
        statusCode: error.status || 500,
        details: error.details || error.hint || undefined,
      },
    };
  }

  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
    },
  };
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return response?.error !== undefined;
}

/**
 * Logs error details for debugging
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}]`, {
    message: error?.message || 'Unknown error',
    code: error?.code,
    stack: error?.stack,
    details: error,
  });
}

/**
 * Creates a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error?.message?.includes('Failed to fetch')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  if (error?.message?.includes('JWT')) {
    return 'Authentication error. Please try logging in again.';
  }
  
  if (error?.message?.includes('duplicate key')) {
    return 'This item already exists.';
  }
  
  if (error?.message?.includes('violates foreign key')) {
    return 'This operation references data that does not exist.';
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}