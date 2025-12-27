import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import {
  loadDrawing,
  loadMetadata,
  getDrawingPath,
  saveDrawing,
  generateUrl,
  generateMarkdownLink,
} from '@/lib/drawings';
import { getDatabase, saveDatabase } from '@/lib/db';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';
import {
  parseRequestBody,
  validateDrawingRequest,
  createErrorResponse,
  validateDrawingId,
} from '@/lib/apiHelpers';
import type {
  GetDrawingResponse,
  UpdateDrawingRequest,
  UpdateDrawingResponse,
  DeleteDrawingResponse,
} from '@/lib/types';

// GET /api/drawings/:id
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    const idValidationError = validateDrawingId(drawingId);
    if (idValidationError) {
      return idValidationError;
    }

    const drawing = await loadDrawing(drawingId);

    if (!drawing) {
      return createErrorResponse(ERROR_MESSAGES.DRAWING_NOT_FOUND, 404);
    }

    // Load metadata
    const metadata = await loadMetadata(drawingId);

    const response: GetDrawingResponse = {
      success: true,
      drawingId,
      drawing,
      metadata,
      url: generateUrl(drawingId),
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error getting drawing:', error);
    return createErrorResponse(getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}

// PUT /api/drawings/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    const idValidationError = validateDrawingId(drawingId);
    if (idValidationError) {
      return idValidationError;
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
      return createErrorResponse(ERROR_MESSAGES.DRAWING_NOT_FOUND, 404);
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
      drawingId,
      url: generateUrl(drawingId),
      markdownLink: generateMarkdownLink(metadata.title, drawingId),
      metadata,
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error updating drawing:', error);
    return createErrorResponse(getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR, 500);
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
    const idValidationError = validateDrawingId(drawingId);
    if (idValidationError) {
      return idValidationError;
    }

    const drawingPath = getDrawingPath(drawingId);

    try {
      await fs.access(drawingPath);
    } catch {
      return createErrorResponse(ERROR_MESSAGES.DRAWING_NOT_FOUND, 404);
    }

    // Delete the drawing file
    await fs.unlink(drawingPath);

    // Remove metadata from database
    const db = await getDatabase();
    db.data.drawings = db.data.drawings.filter((d) => d.id !== drawingId);
    await saveDatabase();

    const response: DeleteDrawingResponse = {
      success: true,
      message: 'Drawing deleted',
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Error deleting drawing:', error);
    return createErrorResponse(getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR, 500);
  }
}
