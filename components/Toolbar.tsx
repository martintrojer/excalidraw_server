'use client';

import { useState, useEffect, useCallback } from 'react';
import ConfirmModal from './ConfirmModal';

interface ToolbarProps {
  drawingId: string | null;
  initialTitle?: string;
  onSave: (title: string) => void;
  onDelete: () => void;
  onNew: () => void;
  onList: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export default function Toolbar({
  drawingId,
  initialTitle = '',
  onSave,
  onDelete,
  onNew,
  onList,
  isSaving = false,
}: ToolbarProps) {
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [title, setTitle] = useState(initialTitle);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showListConfirm, setShowListConfirm] = useState(false);

  // Update title when initialTitle prop changes (e.g., when drawing loads)
  // This is intentional - we need to sync prop changes to local state for editing
  useEffect(() => {
    if (initialTitle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // Extract title generation logic
  const getFinalTitle = useCallback(() => {
    return title.trim() || `Drawing ${new Date().toISOString().slice(0, 10)}`;
  }, [title]);

  const handleSave = useCallback(() => {
    onSave(getFinalTitle());
  }, [onSave, getFinalTitle]);

  const handleNew = () => {
    setShowNewConfirm(true);
  };

  const handleNewConfirm = () => {
    setShowNewConfirm(false);
    onNew();
  };

  const handleList = () => {
    // Only show confirmation if we're in excalidraw mode (drawingId is not null)
    if (drawingId !== null) {
      setShowListConfirm(true);
    } else {
      // Already on list page, no confirmation needed
      onList();
    }
  };

  const handleListConfirm = () => {
    setShowListConfirm(false);
    onList();
  };

  // Keyboard shortcut: Ctrl+S or Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave(getFinalTitle());
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, getFinalTitle]);

  const hamburgerButton = (
    <button
      className="hamburger-btn"
      onClick={() => setToolbarVisible(!toolbarVisible)}
      style={{
        width: '40px',
        height: '40px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          width: '20px',
          height: '2px',
          background: 'var(--text-primary)',
          borderRadius: '2px',
        }}
      />
      <span
        style={{
          width: '20px',
          height: '2px',
          background: 'var(--text-primary)',
          borderRadius: '2px',
        }}
      />
      <span
        style={{
          width: '20px',
          height: '2px',
          background: 'var(--text-primary)',
          borderRadius: '2px',
        }}
      />
    </button>
  );

  return (
    <>
      {/* Toolbar - hamburger always visible, other elements when open */}
      <div
        className="toolbar"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1001,
          background: 'var(--bg-primary)',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        {toolbarVisible && (
          <>
            <button
              onClick={handleNew}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              New
            </button>
            <button
              onClick={handleList}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              All Drawings
            </button>
            <input
              type="text"
              placeholder="Drawing title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '180px',
                flexShrink: 0,
                height: '40px',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="primary"
              style={{
                padding: '8px 16px',
                border: `1px solid var(--success)`,
                borderRadius: '4px',
                background: isSaving ? 'var(--success-hover)' : 'var(--success)',
                color: 'white',
                cursor: isSaving ? 'wait' : 'pointer',
                fontSize: '14px',
                opacity: isSaving ? 0.7 : 1,
                whiteSpace: 'nowrap',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {drawingId && drawingId !== 'new' && (
              <button
                onClick={onDelete}
                style={{
                  padding: '8px 16px',
                  border: `1px solid var(--danger)`,
                  borderRadius: '4px',
                  background: 'var(--danger)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Delete
              </button>
            )}
          </>
        )}
        {hamburgerButton}
      </div>

      <ConfirmModal
        isOpen={showNewConfirm}
        title="Create New Drawing"
        message="Create a new drawing? Current changes will be lost if not saved."
        onConfirm={handleNewConfirm}
        onCancel={() => setShowNewConfirm(false)}
        confirmText="Create New"
        cancelText="Cancel"
        confirmButtonStyle="primary"
      />
      <ConfirmModal
        isOpen={showListConfirm}
        title="View All Drawings"
        message="Go to all drawings? Current changes will be lost if not saved."
        onConfirm={handleListConfirm}
        onCancel={() => setShowListConfirm(false)}
        confirmText="View All"
        cancelText="Cancel"
        confirmButtonStyle="primary"
      />
    </>
  );
}
