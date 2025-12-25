// Type definitions for Excalidraw data structures
// Note: @excalidraw/excalidraw doesn't export types directly, so we define types based on
// the Excalidraw data format specification. Runtime validation is handled by isValidDrawingData

/**
 * Excalidraw element types
 * Based on Excalidraw's element types: rectangle, ellipse, diamond, arrow, line, freedraw, text, image
 */
export type ExcalidrawElementType =
  | 'rectangle'
  | 'ellipse'
  | 'diamond'
  | 'arrow'
  | 'line'
  | 'freedraw'
  | 'text'
  | 'image';

/**
 * Base properties common to all Excalidraw elements
 */
interface BaseExcalidrawElement {
  id: string;
  type: ExcalidrawElementType | string; // Allow string for extensibility
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  roughness?: number;
  opacity?: number;
  groupIds?: string[];
  frameId?: string | null;
  roundness?: { type: number } | null;
  seed?: number;
  versionNonce?: number;
  isDeleted?: boolean;
  boundElements?: Array<{ type: string; id: string }>;
  updated?: number;
  link?: string | null;
  locked?: boolean;
}

/**
 * Excalidraw element type definition
 * Extends base properties with index signature for additional properties
 */
export type ExcalidrawElement = BaseExcalidrawElement & {
  [key: string]: unknown;
};

/**
 * Common properties in Excalidraw AppState
 */
interface BaseExcalidrawAppState {
  viewBackgroundColor?: string;
  currentItemStrokeColor?: string;
  currentItemBackgroundColor?: string;
  currentItemFillStyle?: string;
  currentItemStrokeStyle?: string;
  currentItemRoughness?: number;
  currentItemOpacity?: number;
  currentItemFontFamily?: number;
  currentItemFontSize?: number;
  currentItemTextAlign?: string;
  currentItemStrokeWidth?: number;
  currentItemRoundness?: string;
  gridSize?: number | null;
  zoom?: { value: number };
  scrollX?: number;
  scrollY?: number;
  theme?: 'light' | 'dark';
  collaborators?: Array<{
    pointer?: { x: number; y: number };
    button?: string;
    selectedElementIds?: Record<string, boolean>;
    username?: string;
    avatarUrl?: string;
    [key: string]: unknown;
  }>;
  selectedElementIds?: Record<string, boolean>;
  selectedGroupIds?: Record<string, boolean>;
  editingElementId?: string | null;
  editingGroupId?: string | null;
  editingLinearElement?: unknown;
  name?: string;
  shouldCacheIgnoreZoom?: boolean;
  exportBackground?: boolean;
  exportScale?: number;
  exportEmbedScene?: boolean;
}

/**
 * Excalidraw app state type definition
 * Extends base properties with index signature for additional properties
 */
export type ExcalidrawAppState = BaseExcalidrawAppState & {
  [key: string]: unknown;
};

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

// Type for Excalidraw's onChange callback
// Excalidraw passes: (elements, appState, files) => void
export type ExcalidrawChangeHandler = (
  elements: readonly ExcalidrawElement[],
  appState: ExcalidrawAppState,
  files?: unknown
) => void;

// Type for Excalidraw's initialData prop
export interface ExcalidrawInitialData {
  elements?: readonly ExcalidrawElement[];
  appState?: ExcalidrawAppState;
}

// API Response Types
export interface ApiErrorResponse {
  success: false;
  error: string;
}

export interface ApiSuccessResponse {
  success: true;
  [key: string]: unknown;
}

// GET /api/drawings
export interface ListDrawingsResponse extends ApiSuccessResponse {
  drawings: Drawing[];
  count: number;
}

// POST /api/drawings
export interface CreateDrawingRequest {
  drawing: ExcalidrawDrawingData;
  title: string;
}

export interface CreateDrawingResponse extends ApiSuccessResponse {
  drawingId: string;
  url: string;
  markdownLink: string;
  metadata: DrawingMetadata;
}

// GET /api/drawings/:id
export interface GetDrawingResponse extends ApiSuccessResponse {
  drawingId: string;
  drawing: ExcalidrawDrawingData;
  metadata: DrawingMetadata | null;
  url: string;
}

// PUT /api/drawings/:id
export interface UpdateDrawingRequest {
  drawing: ExcalidrawDrawingData;
  title?: string;
}

export interface UpdateDrawingResponse extends ApiSuccessResponse {
  drawingId: string;
  url: string;
  markdownLink: string;
  metadata: DrawingMetadata;
}

// DELETE /api/drawings/:id
export interface DeleteDrawingResponse extends ApiSuccessResponse {
  message: string;
}
