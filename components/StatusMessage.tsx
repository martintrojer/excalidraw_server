'use client';

import { useEffect, useState } from 'react';
import { STATUS_MESSAGE_DURATION_MS } from '@/lib/constants';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  markdownLink?: string;
}

export default function StatusMessage({
  message,
  type,
  onClose,
  markdownLink,
}: StatusMessageProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, STATUS_MESSAGE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleCopy = async () => {
    if (!markdownLink) return;

    try {
      await navigator.clipboard.writeText(markdownLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Failed to copy to clipboard. Please copy manually: ' + markdownLink);
    }
  };

  // Extract just the markdown link text from message if markdownLink not provided
  const displayMessage = markdownLink ? message.replace(markdownLink, '').trim() : message;

  return (
    <div
      className={`status show ${type}`}
      style={{
        position: 'fixed',
        bottom: '70px',
        right: '10px',
        zIndex: 1001,
        background:
          type === 'success'
            ? 'rgba(76, 175, 80, 0.9)'
            : type === 'error'
              ? 'rgba(244, 67, 54, 0.9)'
              : 'var(--overlay)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span>{displayMessage}</span>
      {markdownLink && (
        <button
          onClick={handleCopy}
          onMouseDown={(e) => e.preventDefault()} // Prevent focus issues
          style={{
            background: copied ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '3px',
            color: 'white',
            padding: '4px 8px',
            fontSize: '11px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background 0.2s',
          }}
          title={copied ? 'Copied!' : 'Copy markdown link'}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      )}
    </div>
  );
}
