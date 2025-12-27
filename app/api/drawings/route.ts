import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  listDrawings,
  saveDrawing,
  generateUrl,
  generateMarkdownLink,
  ensureDrawingsDir,
} from '@/lib/drawings';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';
import { parseRequestBody, validateDrawingRequest } from '@/lib/apiHelpers';
import type {
  DrawingMetadata,
  ListDrawingsResponse,
  CreateDrawingRequest,
  CreateDrawingResponse,
  ApiErrorResponse,
} from '@/lib/types';

// Configure caching for this route
export const revalidate = 0; // Always fetch fresh data (no server-side caching)

// GET /api/drawings
export async function GET(request: NextRequest) {
  try {
    await ensureDrawingsDir();

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const search = searchParams.get('search') || undefined;

    // Validate pagination parameters
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(100, limit)); // Cap at 100 items per page

    const result = await listDrawings({
      page: validPage,
      limit: validLimit,
      search,
    });

    const drawingsWithUrls = result.drawings.map((drawing: DrawingMetadata) => ({
      ...drawing,
      url: generateUrl(drawing.id),
      markdownLink: generateMarkdownLink(drawing.title, drawing.id),
    }));

    const response: ListDrawingsResponse = {
      success: true,
      drawings: drawingsWithUrls,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };

    // Add cache headers - short cache time to ensure fresh data
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Error listing drawings:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: getErrorMessage(error),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST /api/drawings
export async function POST(request: NextRequest) {
  try {
    await ensureDrawingsDir();

    // Parse and validate request body
    const parseResult = await parseRequestBody<CreateDrawingRequest>(request);
    if ('error' in parseResult) {
      return parseResult.error;
    }
    const { body } = parseResult;

    // Validate drawing request
    const validationError = validateDrawingRequest(body, true);
    if (validationError) {
      return validationError;
    }

    const { drawing, title } = body;

    const drawingId = uuidv4();
    const metadata = await saveDrawing(drawingId, drawing, title);

    const response: CreateDrawingResponse = {
      success: true,
      drawingId: drawingId,
      url: generateUrl(drawingId),
      markdownLink: generateMarkdownLink(metadata.title, drawingId),
      metadata: metadata,
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating drawing:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: getErrorMessage(error) || ERROR_MESSAGES.INTERNAL_ERROR,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
