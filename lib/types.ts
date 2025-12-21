// Type definitions for Excalidraw data structures
// Note: @excalidraw/excalidraw doesn't export types directly, so we define minimal types
// Runtime validation is handled by isValidDrawingData

// Minimal type definition for Excalidraw elements
// Elements are validated at runtime, so we use a flexible type here
export type ExcalidrawElement = {
  id: string;
  type: string;
  [key: string]: unknown;
};

// Minimal type definition for Excalidraw app state
// AppState is validated at runtime, so we use a flexible type here
// Using Record<string, unknown> to match Excalidraw's AppState index signature
export type ExcalidrawAppState = Record<string, unknown>;

export interface ExcalidrawDrawingData {
  type: 'excalidraw';
  version: number;
  source: string;
  elements: readonly ExcalidrawElement[];
  appState: ExcalidrawAppState;
}

export interface DrawingMetadata {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Drawing extends DrawingMetadata {
  url?: string;
  markdownLink?: string;
}
