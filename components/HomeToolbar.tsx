'use client';

import { useState } from 'react';

interface HomeToolbarProps {
  onNew: () => void;
  onList: () => void;
}

export default function HomeToolbar({ onNew, onList }: HomeToolbarProps) {
  const [toolbarVisible, setToolbarVisible] = useState(true);

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
            onClick={onNew}
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
            onClick={onList}
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
        </>
      )}
      {hamburgerButton}
    </div>
  );
}
