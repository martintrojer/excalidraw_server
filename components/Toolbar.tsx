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

  // Update title when initialTitle prop changes (e.g., when drawing loads)
  useEffect(() => {
    if (initialTitle) {
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
        background: '#1e1e1e',
        border: '1px solid #444',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          width: '20px',
          height: '2px',
          background: '#e0e0e0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: toolbarVisible ? 'rotate(45deg) translate(5px, 5px)' : 'none',
        }}
      />
      <span
        style={{
          width: '20px',
          height: '2px',
          background: '#e0e0e0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: toolbarVisible ? 0 : 1,
        }}
      />
      <span
        style={{
          width: '20px',
          height: '2px',
          background: '#e0e0e0',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: toolbarVisible ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
        }}
      />
    </button>
  );

  return (
    <>
      {/* Hamburger button that stays visible when toolbar is hidden */}
      {!toolbarVisible && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            zIndex: 1001,
          }}
        >
          {hamburgerButton}
        </div>
      )}

      {/* Main toolbar */}
      <div
        className="toolbar"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
          background: '#1e1e1e',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          transition: 'transform 0.3s ease-in-out',
          transform: toolbarVisible ? 'translateX(0)' : 'translateX(calc(100% + 20px))',
        }}
      >
        {toolbarVisible && hamburgerButton}
        <button
          onClick={handleNew}
          style={{
            padding: '8px 16px',
            border: '1px solid #444',
            borderRadius: '4px',
            background: '#2d2d2d',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          New
        </button>
        <button
          onClick={onList}
          style={{
            padding: '8px 16px',
            border: '1px solid #444',
            borderRadius: '4px',
            background: '#2d2d2d',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '14px',
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
            border: '1px solid #444',
            borderRadius: '4px',
            background: '#2d2d2d',
            color: '#e0e0e0',
            fontSize: '14px',
            width: '180px',
            flexShrink: 0,
          }}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="primary"
          style={{
            padding: '8px 16px',
            border: '1px solid #4CAF50',
            borderRadius: '4px',
            background: isSaving ? '#66BB6A' : '#4CAF50',
            color: 'white',
            cursor: isSaving ? 'wait' : 'pointer',
            fontSize: '14px',
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {drawingId && drawingId !== 'new' && (
          <button
            onClick={onDelete}
            style={{
              padding: '8px 16px',
              border: '1px solid #f44336',
              borderRadius: '4px',
              background: '#f44336',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Delete
          </button>
        )}
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
    </>
  );
}
