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
 * Ensures the drawings directory exists, creating it if necessary
 * @throws {Error} If the directory cannot be created
 */
export async function ensureDrawingsDir() {
  try {
    await fs.mkdir(DRAWINGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating drawings directory:', error);
  }
}

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
  if (!isValidDrawingId(drawingId)) {
    throw new Error('Invalid drawing ID');
  }

  const drawingPath = getDrawingPath(drawingId);

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

  // Save the drawing file
  await fs.writeFile(drawingPath, JSON.stringify(parsedData, null, 2), 'utf-8');

  // Load existing metadata to preserve created_at, or create new
  const existingMetadata = await loadMetadata(drawingId);
  const safeTitle = title && title.trim() ? title.trim() : `Drawing ${drawingId.substring(0, 8)}`;

  const metadata: DrawingMetadata = existingMetadata
    ? {
        ...existingMetadata,
        title: safeTitle,
        updated_at: new Date().toISOString(),
      }
    : {
        id: drawingId,
        title: safeTitle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

  // Save metadata to database
  const db = await getDatabase();
  const existingIndex = db.data.drawings.findIndex((d) => d.id === drawingId);
  if (existingIndex >= 0) {
    db.data.drawings[existingIndex] = metadata;
  } else {
    db.data.drawings.push(metadata);
  }
  await saveDatabase();

  return metadata;
}

/**
 * Lists all drawings from the database
 * @returns Array of drawing metadata, sorted by most recently updated first
 */
export async function listDrawings(): Promise<DrawingMetadata[]> {
  try {
    await ensureDrawingsDir();
    const dbData = await getDatabaseData();

    // Sort by most recently updated first
    return [...dbData.drawings].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  } catch (error) {
    console.error('Error listing drawings:', error);
    return [];
  }
}

/**
 * Generates a URL for a drawing
 * @param drawingId - The drawing ID
 * @returns The full URL to access the drawing
 */
export function generateUrl(drawingId: string) {
  // Read HOST and PORT from environment variables (e.g., from .env file)
  // This allows users to set HOST=excalidraw.local for cleaner URLs in notes
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
