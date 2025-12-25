'use client';

import { useEffect } from 'react';
import { baseButtonStyle, primaryButtonStyle, dangerButtonStyle } from '@/lib/buttonStyles';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'primary',
}: ConfirmModalProps) {
  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#1e1e1e',
          border: '1px solid #444',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 16px 0',
            color: '#e0e0e0',
            fontSize: '20px',
            fontWeight: '600',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '0 0 24px 0',
            color: '#b0b0b0',
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              ...baseButtonStyle,
              border: '1px solid #444',
              background: '#2d2d2d',
              color: '#e0e0e0',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...(confirmButtonStyle === 'danger' ? dangerButtonStyle : primaryButtonStyle),
              border: 'none',
              fontWeight: '500',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
