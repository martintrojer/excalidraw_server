import { NextRequest, NextResponse } from 'next/server';
import { isValidTitle, isValidDrawingData } from './validation';
import { ERROR_MESSAGES } from './errorMessages';
import type { ApiErrorResponse, CreateDrawingRequest, UpdateDrawingRequest } from './types';

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
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: ERROR_MESSAGES.INVALID_JSON,
    };
    return {
      error: NextResponse.json(errorResponse, { status: 400 }),
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
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: ERROR_MESSAGES.MISSING_DRAWING_FIELD,
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Validate title
  if (requireTitle) {
    if (!isValidTitle(body.title)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.INVALID_TITLE,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
  } else {
    // For PUT, title is optional but must be valid if provided
    if (body.title !== undefined && !isValidTitle(body.title)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.INVALID_TITLE,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
  }

  // Validate drawing data
  if (!isValidDrawingData(body.drawing)) {
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: ERROR_MESSAGES.INVALID_DRAWING_DATA,
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  return null;
}
