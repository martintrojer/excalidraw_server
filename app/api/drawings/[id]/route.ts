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
import { isValidDrawingId, isValidTitle, isValidDrawingData } from '@/lib/validation';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';

// GET /api/drawings/:id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_DRAWING_ID },
        { status: 400 }
      );
    }

    const drawing = await loadDrawing(drawingId);

    if (!drawing) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DRAWING_NOT_FOUND },
        { status: 404 }
      );
    }

    // Load metadata
    const metadata = await loadMetadata(drawingId);

    return NextResponse.json({
      success: true,
      drawingId: drawingId,
      drawing: drawing,
      metadata: metadata,
      url: generateUrl(drawingId),
    });
  } catch (error: unknown) {
    console.error('Error getting drawing:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// PUT /api/drawings/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_DRAWING_ID },
        { status: 400 }
      );
    }

    // Validate request body exists
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_JSON },
        { status: 400 }
      );
    }

    const { drawing, title } = body;

    // Validate required fields
    if (!drawing) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.MISSING_DRAWING_FIELD },
        { status: 400 }
      );
    }

    // Validate input
    if (title !== undefined && !isValidTitle(title)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_TITLE },
        { status: 400 }
      );
    }

    if (!isValidDrawingData(drawing)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_DRAWING_DATA },
        { status: 400 }
      );
    }

    // Check if drawing exists
    const existingDrawing = await loadDrawing(drawingId);
    if (!existingDrawing) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DRAWING_NOT_FOUND },
        { status: 404 }
      );
    }

    // If title is not provided, preserve existing title
    let finalTitle = title;
    if (finalTitle === undefined) {
      const existingMetadata = await loadMetadata(drawingId);
      finalTitle = existingMetadata?.title;
    }

    // Save the drawing using the shared saveDrawing function
    const metadata = await saveDrawing(drawingId, drawing, finalTitle);

    return NextResponse.json({
      success: true,
      drawingId: drawingId,
      url: generateUrl(drawingId),
      markdownLink: generateMarkdownLink(metadata.title, drawingId),
      metadata: metadata,
    });
  } catch (error: unknown) {
    console.error('Error updating drawing:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE /api/drawings/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: drawingId } = await params;

    // Validate drawing ID
    if (!isValidDrawingId(drawingId)) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_DRAWING_ID },
        { status: 400 }
      );
    }

    const drawingPath = getDrawingPath(drawingId);
    const metadataPath = getMetadataPath(drawingId);

    try {
      await fs.access(drawingPath);
    } catch {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.DRAWING_NOT_FOUND },
        { status: 404 }
      );
    }

    await fs.unlink(drawingPath);
    try {
      await fs.unlink(metadataPath);
    } catch {
      // Metadata file might not exist, that's okay
    }

    return NextResponse.json({ success: true, message: 'Drawing deleted' });
  } catch (error: unknown) {
    console.error('Error deleting drawing:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}
