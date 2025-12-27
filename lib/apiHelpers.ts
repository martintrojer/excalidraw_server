import { NextRequest, NextResponse } from 'next/server';
import { isValidTitle, isValidDrawingData, isValidDrawingId } from './validation';
import { ERROR_MESSAGES } from './errorMessages';
import type { ApiErrorResponse, CreateDrawingRequest, UpdateDrawingRequest } from './types';

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Validates a drawing ID and returns an error response if invalid
 */
export function validateDrawingId(drawingId: string): NextResponse<ApiErrorResponse> | null {
  if (!isValidDrawingId(drawingId)) {
    return createErrorResponse(ERROR_MESSAGES.INVALID_DRAWING_ID, 400);
  }
  return null;
}

/**
 * Validates and parses the JSON request body
 * @param request - The Next.js request object
 * @returns Parsed body or error response
 */
export async function parseRequestBody<T extends CreateDrawingRequest | UpdateDrawingRequest>(
  request: NextRequest
): Promise<{ body: T } | { error: NextResponse<ApiErrorResponse> }> {
  try {
    const body = (await request.json()) as T;
    return { body };
  } catch {
    return {
      error: createErrorResponse(ERROR_MESSAGES.INVALID_JSON, 400),
    };
  }
}

/**
 * Validates drawing data from request body
 * @param body - Request body containing drawing and optional title
 * @param requireTitle - Whether title is required (true for POST, false for PUT)
 * @returns Error response if validation fails, null if valid
 */
export function validateDrawingRequest(
  body: CreateDrawingRequest | UpdateDrawingRequest,
  requireTitle: boolean
): NextResponse<ApiErrorResponse> | null {
  // Validate required fields
  if (!body.drawing) {
    return createErrorResponse(ERROR_MESSAGES.MISSING_DRAWING_FIELD, 400);
  }

  // Validate title
  if (requireTitle) {
    if (!isValidTitle(body.title)) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TITLE, 400);
    }
  } else {
    // For PUT, title is optional but must be valid if provided
    if (body.title !== undefined && !isValidTitle(body.title)) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_TITLE, 400);
    }
  }

  // Validate drawing data
  if (!isValidDrawingData(body.drawing)) {
    return createErrorResponse(ERROR_MESSAGES.INVALID_DRAWING_DATA, 400);
  }

  return null;
}
