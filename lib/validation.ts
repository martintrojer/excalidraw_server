// Simple validation helpers for local-only app
import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH } from './constants';

/**
 * Validates a drawing ID to prevent path traversal attacks and ensure valid format
 * @param id - The drawing ID to validate
 * @returns true if the ID is valid, false otherwise
 */
export function isValidDrawingId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Prevent path traversal attacks
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return false;
  // Basic length check (UUIDs are typically 36 chars, but allow some flexibility)
  if (id.length === 0 || id.length > 100) return false;
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validates a drawing title
 * @param title - The title to validate (optional)
 * @returns true if the title is valid or empty (title is optional), false otherwise
 */
export function isValidTitle(title: string | undefined | null): boolean {
  if (!title) return true; // Title is optional
  if (typeof title !== 'string') return false;
  return title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;
}

/**
 * Type guard to validate Excalidraw drawing data structure
 * @param data - The data to validate
 * @returns true if the data is a valid ExcalidrawDrawingData structure, false otherwise
 */
export function isValidDrawingData(data: unknown): data is import('./types').ExcalidrawDrawingData {
  if (!data || typeof data !== 'object') return false;
  const drawing = data as Record<string, unknown>;
  // Check for required Excalidraw fields
  return (
    drawing.type === 'excalidraw' &&
    typeof drawing.version === 'number' &&
    Array.isArray(drawing.elements) &&
    typeof drawing.appState === 'object' &&
    drawing.appState !== null
  );
}
