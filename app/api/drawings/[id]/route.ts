import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import {
  loadDrawing,
  loadMetadata,
  getDrawingPath,
  getMetadataPath,
  saveDrawing,
  generateUrl,
  generateMarkdownLink,
} from '@/lib/drawings';
import { isValidDrawingId } from '@/lib/validation';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';
import { parseRequestBody, validateDrawingRequest } from '@/lib/apiHelpers';
import type {
  GetDrawingResponse,
  UpdateDrawingRequest,
  UpdateDrawingResponse,
  DeleteDrawingResponse,
  ApiErrorResponse,
} from '@/lib/types';

// GET /api/drawings/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.INVALID_DRAWING_ID,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const drawing = await loadDrawing(drawingId);

    if (!drawing) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.DRAWING_NOT_FOUND,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Load metadata
    const metadata = await loadMetadata(drawingId);

    const response: GetDrawingResponse = {
      success: true,
      drawingId: drawingId,
      drawing: drawing,
      metadata: metadata,
      url: generateUrl(drawingId),
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error getting drawing:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: getErrorMessage(error),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/drawings/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.INVALID_DRAWING_ID,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Parse and validate request body
    const parseResult = await parseRequestBody<UpdateDrawingRequest>(request);
    if ('error' in parseResult) {
      return parseResult.error;
    }
    const { body } = parseResult;

    // Validate drawing request (title is optional for PUT)
    const validationError = validateDrawingRequest(body, false);
    if (validationError) {
      return validationError;
    }

    const { drawing, title } = body;

    // Check if drawing exists
    const existingDrawing = await loadDrawing(drawingId);
    if (!existingDrawing) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.DRAWING_NOT_FOUND,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // If title is not provided, preserve existing title
    let finalTitle = title;
    if (finalTitle === undefined) {
      const existingMetadata = await loadMetadata(drawingId);
      finalTitle = existingMetadata?.title;
    }

    // Save the drawing using the shared saveDrawing function
    const metadata = await saveDrawing(drawingId, drawing, finalTitle);

    const response: UpdateDrawingResponse = {
      success: true,
      drawingId: drawingId,
      url: generateUrl(drawingId),
      markdownLink: generateMarkdownLink(metadata.title, drawingId),
      metadata: metadata,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error updating drawing:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: getErrorMessage(error),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/drawings/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.INVALID_DRAWING_ID,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const drawingPath = getDrawingPath(drawingId);
    const metadataPath = getMetadataPath(drawingId);

    try {
      await fs.access(drawingPath);
    } catch {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: ERROR_MESSAGES.DRAWING_NOT_FOUND,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    await fs.unlink(drawingPath);
    try {
      await fs.unlink(metadataPath);
    } catch {
      // Metadata file might not exist, that's okay
    }

    const response: DeleteDrawingResponse = {
      success: true,
      message: 'Drawing deleted',
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error deleting drawing:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: getErrorMessage(error),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
