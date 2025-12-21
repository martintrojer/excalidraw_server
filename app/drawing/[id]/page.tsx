'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '../../../components/Toolbar';
import StatusMessage from '../../../components/StatusMessage';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ConfirmModal from '../../../components/ConfirmModal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import type { ExcalidrawElement, ExcalidrawAppState, ExcalidrawDrawingData } from '@/lib/types';
import {
  INITIALIZATION_DELAY_MS,
  EXCALIDRAW_TYPE,
  EXCALIDRAW_VERSION,
  EXCALIDRAW_SOURCE,
  DEFAULT_THEME,
  REDIRECT_DELAY_MS,
} from '@/lib/constants';
import { ERROR_MESSAGES, getErrorMessage } from '@/lib/errorMessages';

// Dynamically import Excalidraw with SSR disabled
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Excalidraw..." />,
});

export default function DrawingPage() {
  const params = useParams();
  const router = useRouter();
  const drawingId = (params?.id as string) || 'new';
  const isNew = drawingId === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    markdownLink?: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [drawingTitle, setDrawingTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const initialDataRef = useRef<{
    elements: readonly ExcalidrawElement[];
    appState: ExcalidrawAppState;
  } | null>(null);
  const currentElementsRef = useRef<readonly ExcalidrawElement[]>([]);
  const currentAppStateRef = useRef<ExcalidrawAppState | null>(null);
  const isInitializingRef = useRef(false);

  // Load drawing if editing existing
  useEffect(() => {
    if (isNew || !drawingId || initialDataLoaded) return;

    async function loadDrawing() {
      try {
        setLoading(true);
        isInitializingRef.current = true;
        const response = await fetch(`/api/drawings/${drawingId}`);
        const result = await response.json();

        if (result.success && result.drawing) {
          const loadedElements = result.drawing.elements || [];
          const loadedAppState = {
            ...(result.drawing.appState || {}),
            theme: DEFAULT_THEME,
            collaborators: Array.isArray(result.drawing.appState?.collaborators)
              ? result.drawing.appState.collaborators
              : [],
          };

          // Store initial data in ref (only set once)
          initialDataRef.current = {
            elements: loadedElements,
            appState: loadedAppState,
          };

          // Store in refs for save function
          currentElementsRef.current = loadedElements;
          currentAppStateRef.current = loadedAppState;

          // Set title from metadata if available
          if (result.metadata?.title) {
            setDrawingTitle(result.metadata.title);
          }

          setInitialDataLoaded(true);
        }
      } catch (error) {
        console.error('Error loading drawing:', error);
        setStatus({ message: ERROR_MESSAGES.LOADING_DRAWING, type: 'error' });
      } finally {
        setLoading(false);
        // Allow onChange after a brief delay to ensure Excalidraw is initialized
        setTimeout(() => {
          isInitializingRef.current = false;
        }, INITIALIZATION_DELAY_MS);
      }
    }

    loadDrawing();
  }, [drawingId, isNew, initialDataLoaded]);

  // Memoize handleChange to prevent unnecessary re-renders of Excalidraw
  const handleChange = useCallback(
    (newElements: readonly ExcalidrawElement[], newAppState: ExcalidrawAppState) => {
      // Prevent updates during initialization
      if (isInitializingRef.current) return;

      // Only update if we've loaded initial data (for existing drawings)
      if (!isNew && !initialDataLoaded) return;

      // Store in refs for save function (don't trigger re-renders)
      // Note: Excalidraw always passes new object references, so we always update
      currentElementsRef.current = newElements;
      currentAppStateRef.current = newAppState;
    },
    [isNew, initialDataLoaded]
  );

  // Memoize saveDrawing to prevent unnecessary re-renders
  const saveDrawing = useCallback(
    async (title: string) => {
      if (isSaving) return; // Prevent double saves

      // Ensure we have valid appState (should always be set by handleChange)
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
            router.push(`/drawing/${result.drawing_id}`);
          }
          setStatus({
            message: ERROR_MESSAGES.SAVED,
            type: 'success',
            markdownLink: result.markdown_link,
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

  // Memoize handlers to prevent unnecessary re-renders
  const handleDeleteClick = useCallback(() => {
    if (isNew || !drawingId) return;
    setShowDeleteConfirm(true);
  }, [isNew, drawingId]);

  const handleNew = useCallback(() => {
    router.push('/drawing/new');
  }, [router]);

  const handleList = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleStatusClose = useCallback(() => {
    setStatus(null);
  }, []);

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
      setShowDeleteConfirm(false);
    }
  }, [isNew, drawingId, isDeleting, router]);

  // Only provide initialData once when first loaded - MUST be before any conditional returns
  const initialData = useMemo(() => {
    if (isNew) {
      return {
        appState: {
          theme: DEFAULT_THEME,
          collaborators: [],
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any; // Excalidraw will accept partial appState
    }

    // For existing drawings, use the ref data (only set once on load)
    if (initialDataRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return initialDataRef.current as any; // Type assertion needed for Excalidraw compatibility
    }

    // Return empty if not loaded yet
    return null;
  }, [isNew, initialDataLoaded]); // initialDataLoaded needed to trigger re-computation when data loads

  if (loading || (!isNew && !initialDataLoaded)) {
    return <LoadingSpinner message="Loading drawing..." />;
  }

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Excalidraw
          key={drawingId} // Force remount when drawingId changes
          initialData={initialData || undefined}
          onChange={handleChange}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              toggleTheme: false,
            },
            tools: {
              image: false,
            },
          }}
          theme={DEFAULT_THEME}
        />
        <Toolbar
          drawingId={isNew ? 'new' : drawingId}
          initialTitle={drawingTitle}
          onSave={saveDrawing}
          onDelete={handleDeleteClick}
          onNew={handleNew}
          onList={handleList}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
        {status && (
          <StatusMessage
            message={status.message}
            type={status.type}
            onClose={handleStatusClose}
            markdownLink={status.markdownLink}
          />
        )}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Drawing"
          message="Are you sure you want to delete this drawing? This action cannot be undone."
          onConfirm={deleteDrawing}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonStyle="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
