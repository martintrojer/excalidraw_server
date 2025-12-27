import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ExcalidrawElement,
  ExcalidrawAppState,
  ExcalidrawDrawingData,
  ExcalidrawChangeHandler,
  ExcalidrawInitialData,
} from '@/lib/types';
import {
  INITIALIZATION_DELAY_MS,
  EXCALIDRAW_TYPE,
  EXCALIDRAW_VERSION,
  EXCALIDRAW_SOURCE,
  DEFAULT_THEME,
  REDIRECT_DELAY_MS,
} from '@/lib/constants';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';

interface Status {
  message: string;
  type: 'success' | 'error' | 'info';
  markdownLink?: string;
}

interface UseDrawingOptions {
  drawingId: string;
  isNew: boolean;
}

/**
 * Custom hook for managing drawing state and operations
 * Handles loading, saving, deleting, and change tracking for Excalidraw drawings
 * @param options - Configuration options for the hook
 * @param options.drawingId - The ID of the drawing (or 'new' for new drawings)
 * @param options.isNew - Whether this is a new drawing
 * @returns Object containing drawing state and handler functions
 */
export function useDrawing({ drawingId, isNew }: UseDrawingOptions) {
  const router = useRouter();

  // UI State - controls loading indicators and user feedback
  const [loading, setLoading] = useState(!isNew);
  const [status, setStatus] = useState<Status | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Drawing Data State - manages the drawing content and metadata
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [drawingTitle, setDrawingTitle] = useState<string>('');
  const [initialData, setInitialData] = useState<ExcalidrawInitialData | null>(null);

  // Refs for performance - avoid re-renders on every Excalidraw change
  // These store the current drawing state without triggering React updates
  const initialDataRef = useRef<{
    elements: readonly ExcalidrawElement[];
    appState: ExcalidrawAppState;
  } | null>(null);
  const currentElementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const currentAppStateRef = useRef<ExcalidrawAppState | null>(null);
  const isInitializingRef = useRef(false); // Prevents onChange during initialization

  // Load drawing if editing existing
  useEffect(() => {
    if (isNew || !drawingId || initialDataLoaded) return;

    async function loadDrawing() {
      try {
        setLoading(true);
        setNotFound(false);
        isInitializingRef.current = true;
        const response = await fetch(`/api/drawings/${drawingId}`);
        const result = await response.json();

        // Handle 404 - drawing not found
        if (
          response.status === 404 ||
          (!result.success && result.error === ERROR_MESSAGES.DRAWING_NOT_FOUND)
        ) {
          setNotFound(true);
          setInitialDataLoaded(false);
          return;
        }

        if (result.success && result.drawing) {
          const loadedElements = result.drawing.elements || [];
          const loadedAppState = {
            ...(result.drawing.appState || {}),
            theme: DEFAULT_THEME,
            collaborators: Array.isArray(result.drawing.appState?.collaborators)
              ? result.drawing.appState.collaborators
              : [],
          };

          const data = {
            elements: loadedElements,
            appState: loadedAppState,
          };

          initialDataRef.current = data;
          setInitialData(data);

          currentElementsRef.current = loadedElements;
          currentAppStateRef.current = loadedAppState;

          if (result.metadata?.title) {
            setDrawingTitle(result.metadata.title);
          }

          setInitialDataLoaded(true);
        } else {
          // Other errors
          setStatus({ message: result.error || ERROR_MESSAGES.LOADING_DRAWING, type: 'error' });
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
        setStatus({ message: ERROR_MESSAGES.LOADING_DRAWING, type: 'error' });
      } finally {
        setLoading(false);
        setTimeout(() => {
          isInitializingRef.current = false;
        }, INITIALIZATION_DELAY_MS);
      }
    }

    loadDrawing();
  }, [drawingId, isNew, initialDataLoaded]);

  const handleChange = useCallback<ExcalidrawChangeHandler>(
    (newElements, newAppState, _files) => {
      if (isInitializingRef.current) return;
      if (!isNew && !initialDataLoaded) return;

      currentElementsRef.current = newElements;
      currentAppStateRef.current = newAppState;
      // Note: files parameter is ignored as we don't handle binary files
    },
    [isNew, initialDataLoaded]
  );

  const saveDrawing = useCallback(
    async (title: string) => {
      if (isSaving) return;

      if (!currentAppStateRef.current) {
        setStatus({ message: 'Error: Drawing state not initialized', type: 'error' });
        return;
      }

      const drawingData: ExcalidrawDrawingData = {
        type: EXCALIDRAW_TYPE,
        version: EXCALIDRAW_VERSION,
        source: EXCALIDRAW_SOURCE,
        elements: currentElementsRef.current,
        appState: currentAppStateRef.current,
      };

      setIsSaving(true);
      try {
        const url = isNew ? '/api/drawings' : `/api/drawings/${drawingId}`;
        const method = isNew ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drawing: drawingData, title }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          if (isNew) {
            router.push(`/drawing/${result.drawingId}`);
          }
          setStatus({
            message: ERROR_MESSAGES.SAVED,
            type: 'success',
            markdownLink: result.markdownLink,
          });
        } else {
          setStatus({ message: `Error: ${result.error}`, type: 'error' });
        }
      } catch (error: unknown) {
        setStatus({
          message: `${ERROR_MESSAGES.SAVING_DRAWING}: ${getErrorMessage(error)}`,
          type: 'error',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [isNew, drawingId, router, isSaving]
  );

  const deleteDrawing = useCallback(async () => {
    if (isNew || !drawingId || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/drawings/${drawingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setStatus({ message: ERROR_MESSAGES.DELETED, type: 'success' });
        setTimeout(() => router.push('/'), REDIRECT_DELAY_MS);
      } else {
        setStatus({ message: `Error: ${result.error}`, type: 'error' });
      }
    } catch (error: unknown) {
      setStatus({
        message: `${ERROR_MESSAGES.DELETING_DRAWING}: ${getErrorMessage(error)}`,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [isNew, drawingId, isDeleting, router]);

  // Initialize initialData for new drawings
  useEffect(() => {
    if (isNew && !initialData) {
      setInitialData({
        appState: {
          theme: DEFAULT_THEME,
          collaborators: [],
        } as ExcalidrawAppState,
      });
    }
  }, [isNew, initialData]);

  return {
    loading,
    status,
    setStatus,
    initialDataLoaded,
    drawingTitle,
    isSaving,
    isDeleting,
    notFound,
    handleChange,
    saveDrawing,
    deleteDrawing,
    initialData,
  };
}
