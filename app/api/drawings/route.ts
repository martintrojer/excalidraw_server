import { NextRequest, NextResponse } from 'next/server';
import {
  listDrawings,
  saveDrawing,
  uuidv4,
  generateUrl,
  generateMarkdownLink,
  ensureDrawingsDir,
} from '@/lib/drawings';
import { isValidTitle, isValidDrawingData } from '@/lib/validation';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';
import type { DrawingMetadata } from '@/lib/types';

// GET /api/drawings
export async function GET() {
  try {
    await ensureDrawingsDir();
    const drawings = await listDrawings();

    const drawingsWithUrls = drawings.map((drawing: DrawingMetadata) => ({
      ...drawing,
      url: generateUrl(drawing.id),
      markdown_link: generateMarkdownLink(drawing.title, drawing.id),
    }));

    return NextResponse.json({
      success: true,
      drawings: drawingsWithUrls,
      count: drawingsWithUrls.length,
    });
  } catch (error: unknown) {
    console.error('Error listing drawings:', error);
    return NextResponse.json({ success: false, error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST /api/drawings
export async function POST(request: NextRequest) {
  try {
    await ensureDrawingsDir();

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
    if (!isValidTitle(title)) {
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

    const drawingId = uuidv4();
    const metadata = await saveDrawing(drawingId, drawing, title);

    return NextResponse.json(
      {
        success: true,
        drawing_id: drawingId,
        url: generateUrl(drawingId),
        markdown_link: generateMarkdownLink(metadata.title, drawingId),
        metadata: metadata,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating drawing:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR },
      { status: 500 }
    );
  }
}
