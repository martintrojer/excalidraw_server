import fs from 'fs/promises';
import path from 'path';
import { isValidDrawingId } from './validation';
import type { DrawingMetadata } from './types';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';
import { getDrawingsDir } from './env';
import { getDatabase, getDatabaseData, saveDatabase } from './db';

// Get drawings directory from environment variable (validated at module load)
const DRAWINGS_DIR = getDrawingsDir();

/**
 * Gets the file path for a drawing by ID
 * @param drawingId - The drawing ID
 * @returns The file path for the drawing
 * @throws {Error} If the drawing ID is invalid
 */
export function getDrawingPath(drawingId: string) {
  if (!isValidDrawingId(drawingId)) {
    throw new Error('Invalid drawing ID');
  }
  // Validation already ensures safe ID (no path traversal)
  return path.join(DRAWINGS_DIR, `${drawingId}.excalidraw`);
}

/**
 * Loads a drawing from the file system
 * @param drawingId - The drawing ID to load
 * @returns The drawing data, or null if not found or invalid
 */
export async function loadDrawing(drawingId: string) {
  if (!isValidDrawingId(drawingId)) {
    return null;
  }
  try {
    const drawingPath = getDrawingPath(drawingId);
    const data = await fs.readFile(drawingPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Distinguish between file not found and other errors
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // File doesn't exist
    }
    console.error('Error loading drawing:', error);
    throw error; // Re-throw other errors
  }
}

/**
 * Loads drawing metadata from the database
 * @param drawingId - The drawing ID
 * @returns The metadata, or null if not found or invalid
 */
export async function loadMetadata(drawingId: string): Promise<DrawingMetadata | null> {
  if (!isValidDrawingId(drawingId)) {
    return null;
  }
  try {
    const dbData = await getDatabaseData();
    const metadata = dbData.drawings.find((d) => d.id === drawingId);
    return metadata || null;
  } catch (error) {
    console.error('Error loading metadata:', error);
    return null;
  }
}

/**
 * Saves a drawing and its metadata to the file system
 * @param drawingId - The drawing ID
 * @param drawingData - The drawing data to save
 * @param title - Optional title for the drawing
 * @returns The saved metadata
 * @throws {Error} If the drawing ID is invalid or saving fails
 */
export async function saveDrawing(
  drawingId: string,
  drawingData: unknown,
  title?: string | null
): Promise<DrawingMetadata> {
  // Ensure drawingData is an object
  let parsedData: unknown = drawingData;
  if (typeof drawingData === 'string') {
    try {
      parsedData = JSON.parse(drawingData);
    } catch {
      throw new Error('Invalid drawing data format');
    }
  }

  if (!parsedData || typeof parsedData !== 'object') {
    throw new Error('Drawing data must be an object');
  }

  // Initialize database first (creates directory if needed)
  const db = await getDatabase();

  // Write the drawing file
  const drawingPath = getDrawingPath(drawingId);
  await fs.writeFile(drawingPath, JSON.stringify(parsedData, null, 2), 'utf-8');

  // Build metadata (upsert)
  const existingIndex = db.data.drawings.findIndex((d) => d.id === drawingId);
  const existingMetadata = existingIndex >= 0 ? db.data.drawings[existingIndex] : null;
  const safeTitle = title?.trim() || `Drawing ${drawingId.substring(0, 8)}`;
  const now = new Date().toISOString();

  const metadata: DrawingMetadata = existingMetadata
    ? { ...existingMetadata, title: safeTitle, updated_at: now }
    : { id: drawingId, title: safeTitle, created_at: now, updated_at: now };

  if (existingIndex >= 0) {
    db.data.drawings[existingIndex] = metadata;
  } else {
    db.data.drawings.push(metadata);
  }
  await saveDatabase();

  return metadata;
}

/**
 * Lists drawings from the database with pagination and optional search
 * @param options - Pagination and search options
 * @returns Object containing paginated drawings and metadata
 */
export async function listDrawings(options?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{
  drawings: DrawingMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    // getDatabaseData() ensures the directory exists via getDatabase()
    const dbData = await getDatabaseData();

    // Sort by most recently updated first
    let drawings = [...dbData.drawings].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    // Apply search filter if provided
    if (options?.search && options.search.trim()) {
      const searchLower = options.search.toLowerCase().trim();
      drawings = drawings.filter((drawing) => drawing.title.toLowerCase().includes(searchLower));
    }

    const total = drawings.length;
    const page = options?.page || 1;
    const limit = options?.limit || 12;
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDrawings = drawings.slice(startIndex, endIndex);

    return {
      drawings: paginatedDrawings,
      total,
      page,
      limit,
      totalPages,
    };
  } catch (error) {
    console.error('Error listing drawings:', error);
    return {
      drawings: [],
      total: 0,
      page: options?.page || 1,
      limit: options?.limit || 12,
      totalPages: 0,
    };
  }
}

/**
 * Generates a URL for a drawing
 * @param drawingId - The drawing ID
 * @returns The full URL to access the drawing
 */
export function generateUrl(drawingId: string) {
  const host = process.env.HOST || DEFAULT_HOST;
  const port = process.env.PORT || DEFAULT_PORT;
  return `http://${host}:${port}/drawing/${drawingId}`;
}

/**
 * Generates a markdown link for a drawing
 * @param title - The drawing title
 * @param drawingId - The drawing ID
 * @returns A markdown-formatted link string
 */
export function generateMarkdownLink(title: string, drawingId: string) {
  const url = generateUrl(drawingId);
  return `[${title}](${url})`;
}
