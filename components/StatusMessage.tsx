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

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(markdownLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (error) {
        console.warn('Clipboard API failed, trying fallback:', error);
      }
    }

    // Fallback: Use textarea method for older browsers or when Clipboard API fails
    try {
      const textarea = document.createElement('textarea');
      textarea.value = markdownLink;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      // Use the older execCommand for broader compatibility
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);

      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Show a more user-friendly error message
      const userMessage = `Failed to copy. The markdown link is:\n\n${markdownLink}\n\nPlease copy it manually.`;
      if (confirm(userMessage + '\n\nClick OK to try again, or Cancel to dismiss.')) {
        // User wants to try again
        handleCopy();
      }
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
