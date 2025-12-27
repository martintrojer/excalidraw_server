'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '@/components/Toolbar';
import StatusMessage from '@/components/StatusMessage';
import ErrorBoundary from '@/components/ErrorBoundary';
import ConfirmModal from '@/components/ConfirmModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useDrawing } from '@/hooks/useDrawing';
import { DEFAULT_THEME } from '@/lib/constants';

// Dynamically import Excalidraw with SSR disabled and Suspense support
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading Excalidraw..." />,
});

export default function DrawingPage() {
  const params = useParams();
  const router = useRouter();
  const drawingId = (params?.id as string) || 'new';
  const isNew = drawingId === 'new';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    loading,
    status,
    setStatus,
    initialDataLoaded,
    drawingTitle,
    isSaving,
    notFound,
    handleChange,
    saveDrawing,
    deleteDrawing,
    initialData,
  } = useDrawing({ drawingId, isNew });

  const handleDeleteClick = () => {
    if (isNew || !drawingId) return;
    setShowDeleteConfirm(true);
  };

  const handleNew = () => {
    router.push('/drawing/new');
  };

  const handleList = () => {
    router.push('/');
  };

  const handleStatusClose = () => {
    setStatus(null);
  };

  const handleDeleteConfirm = async () => {
    await deleteDrawing();
    setShowDeleteConfirm(false);
  };

  if (loading || (!isNew && !initialDataLoaded && !notFound)) {
    return <LoadingSpinner message="Loading drawing..." />;
  }

  // Show not found error message
  if (notFound && !isNew) {
    return (
      <ErrorBoundary>
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: '20px',
            gap: '20px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: '500px',
            }}
          >
            <h1
              style={{
                fontSize: '32px',
                margin: '0 0 16px 0',
                color: 'var(--text-primary)',
              }}
            >
              Drawing Not Found
            </h1>
            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                margin: '0 0 30px 0',
                lineHeight: '1.5',
              }}
            >
              The drawing with ID <code style={{ color: 'var(--text-primary)' }}>{drawingId}</code>{' '}
              could not be found. It may have been deleted, the URL is incorrect, or the{' '}
              <code style={{ color: 'var(--text-primary)' }}>DRAWINGS_DIR</code> environment
              variable may not be configured correctly.
            </p>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '0 0 30px 0',
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                maxWidth: '600px',
              }}
            >
              <strong
                style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}
              >
                Troubleshooting:
              </strong>
              <ul style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.6' }}>
                <li>
                  Verify the <code style={{ color: 'var(--text-primary)' }}>DRAWINGS_DIR</code>{' '}
                  environment variable is set correctly in your{' '}
                  <code style={{ color: 'var(--text-primary)' }}>.env</code> file
                </li>
                <li>Ensure the drawings directory exists and contains the drawing file</li>
                <li>
                  Check that the drawing file{' '}
                  <code style={{ color: 'var(--text-primary)' }}>{drawingId}.excalidraw</code>{' '}
                  exists in the configured directory
                </li>
              </ul>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={handleList}
                style={{
                  padding: '12px 24px',
                  background: 'var(--success)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                View All Drawings
              </button>
              <button
                onClick={handleNew}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Create New Drawing
              </button>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
        <Suspense fallback={<LoadingSpinner message="Loading Excalidraw..." />}>
          <Excalidraw
            key={`${drawingId}-${initialDataLoaded ? 'loaded' : 'loading'}`} // Force remount when data loads
            // Type assertion needed because @excalidraw/excalidraw doesn't export types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialData={(initialData || undefined) as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={handleChange as any}
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
        </Suspense>
        <Toolbar
          drawingId={isNew ? 'new' : drawingId}
          initialTitle={drawingTitle}
          onSave={saveDrawing}
          onDelete={handleDeleteClick}
          onNew={handleNew}
          onList={handleList}
          isSaving={isSaving}
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
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonStyle="danger"
        />
      </div>
    </ErrorBoundary>
  );
}
