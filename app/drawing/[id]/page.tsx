'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Toolbar from '../../../components/Toolbar';
import StatusMessage from '../../../components/StatusMessage';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ConfirmModal from '../../../components/ConfirmModal';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useDrawing } from '../../../hooks/useDrawing';
import { DEFAULT_THEME } from '@/lib/constants';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    loading,
    status,
    setStatus,
    initialDataLoaded,
    drawingTitle,
    isSaving,
    isDeleting,
    handleChange,
    saveDrawing,
    deleteDrawing,
    getInitialData,
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

  const initialData = useMemo(() => getInitialData(), [getInitialData]);

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
