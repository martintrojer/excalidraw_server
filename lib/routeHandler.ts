import { NextRequest, NextResponse } from 'next/server';
import type { ApiErrorResponse } from './types';
import { getErrorMessage } from './errorMessages';
import { ERROR_MESSAGES } from './errorMessages';

/**
 * Wraps an API route handler with consistent error handling
 * This provides a centralized error boundary-like behavior for API routes
 * @param handler - The route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandler<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error: unknown) {
      // Log error for debugging
      console.error('Unhandled error in API route:', error);

      // Return consistent error response
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR,
      };

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.name === 'ValidationError') {
          statusCode = 400;
        } else if (error.name === 'NotFoundError') {
          statusCode = 404;
        }
      }

      return NextResponse.json(errorResponse, { status: statusCode });
    }
  };
}
