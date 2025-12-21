// Type definitions for Excalidraw data structures
// Import types from Excalidraw library when available, otherwise use our definitions

// Re-export Excalidraw types if available, otherwise define minimal types
// Using 'any' for Excalidraw types to avoid type conflicts - the library types are complex
// and we'll validate the data structure at runtime

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExcalidrawElement = any; // Will be validated by isValidDrawingData
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExcalidrawAppState = any; // Will be validated by isValidDrawingData

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

export interface Drawing {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  url?: string;
  markdown_link?: string;
}
