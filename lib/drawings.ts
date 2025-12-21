import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isValidDrawingId } from './validation';
import type { DrawingMetadata } from './types';
import { DEFAULT_HOST, DEFAULT_PORT } from './constants';

// Get drawings directory from environment variable (required)
// DRAWINGS_DIR must be set in .env file (can be absolute or relative to project root)
const getDrawingsDir = (): string => {
  if (!process.env.DRAWINGS_DIR) {
    console.error('ERROR: DRAWINGS_DIR environment variable is not set!');
    console.error('Please create a .env file in the project root with:');
    console.error('  DRAWINGS_DIR=/path/to/your/drawings');
    console.error('Or see .env.example for a template.');
    process.exit(1);
  }

  const drawingsDir = process.env.DRAWINGS_DIR.trim();

  if (!drawingsDir) {
    console.error('ERROR: DRAWINGS_DIR is set but empty!');
    process.exit(1);
  }

  // If it's an absolute path, use it as-is
  if (path.isAbsolute(drawingsDir)) {
    return drawingsDir;
  }

  // If it's relative, resolve it relative to the project root (process.cwd())
  return path.resolve(process.cwd(), drawingsDir);
};

const DRAWINGS_DIR = getDrawingsDir();

// Ensure drawings directory exists
export async function ensureDrawingsDir() {
  try {
    await fs.mkdir(DRAWINGS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating drawings directory:', error);
  }
}

export function getDrawingPath(drawingId: string) {
  if (!isValidDrawingId(drawingId)) {
    throw new Error('Invalid drawing ID');
  }
  // Validation already ensures safe ID (no path traversal)
  return path.join(DRAWINGS_DIR, `${drawingId}.excalidraw`);
}

export function getMetadataPath(drawingId: string) {
  if (!isValidDrawingId(drawingId)) {
    throw new Error('Invalid drawing ID');
  }
  // Validation already ensures safe ID (no path traversal)
  return path.join(DRAWINGS_DIR, `${drawingId}.meta.json`);
}

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

export async function loadMetadata(drawingId: string): Promise<DrawingMetadata | null> {
  if (!isValidDrawingId(drawingId)) {
    return null;
  }
  try {
    const metadataPath = getMetadataPath(drawingId);
    const metadataData = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(metadataData) as DrawingMetadata;
  } catch (error) {
    // If metadata doesn't exist, return null (caller should handle defaults)
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error('Error loading metadata:', error);
    return null;
  }
}

export async function saveDrawing(
  drawingId: string,
  drawingData: unknown,
  title?: string | null
): Promise<DrawingMetadata> {
  if (!isValidDrawingId(drawingId)) {
    throw new Error('Invalid drawing ID');
  }

  const drawingPath = getDrawingPath(drawingId);
  const metadataPath = getMetadataPath(drawingId);

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

  // Save the drawing
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

  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  return metadata;
}

export async function listDrawings(): Promise<DrawingMetadata[]> {
  try {
    await ensureDrawingsDir();
    const files = await fs.readdir(DRAWINGS_DIR);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

    const drawings = await Promise.all(
      metaFiles.map(async (file) => {
        try {
          const data = await fs.readFile(path.join(DRAWINGS_DIR, file), 'utf-8');
          return JSON.parse(data) as DrawingMetadata;
        } catch (error) {
          console.error(`Error reading ${file}:`, error);
          return null;
        }
      })
    );

    return drawings
      .filter((d): d is DrawingMetadata => d !== null)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch (error) {
    console.error('Error listing drawings:', error);
    return [];
  }
}

export function generateUrl(drawingId: string) {
  // Read HOST and PORT from environment variables (e.g., from .env file)
  // This allows users to set HOST=excalidraw.local for cleaner URLs in notes
  const host = process.env.HOST || DEFAULT_HOST;
  const port = process.env.PORT || DEFAULT_PORT;
  return `http://${host}:${port}/drawing/${drawingId}`;
}

export function generateMarkdownLink(title: string, drawingId: string) {
  const url = generateUrl(drawingId);
  return `[${title}](${url})`;
}

export { uuidv4 };
