// Simple validation helpers for local-only app
import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH } from './constants';

// Basic UUID check (simplified for local use)
// Prevents path traversal and ensures valid format
export function isValidDrawingId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Prevent path traversal attacks
  if (id.includes('..') || id.includes('/') || id.includes('\\')) return false;
  // Basic length check (UUIDs are typically 36 chars, but allow some flexibility)
  if (id.length === 0 || id.length > 100) return false;
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

// Basic title validation
export function isValidTitle(title: string | undefined | null): boolean {
  if (!title) return true; // Title is optional
  if (typeof title !== 'string') return false;
  return title.length >= MIN_TITLE_LENGTH && title.length <= MAX_TITLE_LENGTH;
}

// Validate drawing data structure
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
