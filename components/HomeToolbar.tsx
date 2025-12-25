'use client';

import { useState } from 'react';
import HamburgerButton from './HamburgerButton';
import { baseButtonStyle } from '@/lib/buttonStyles';

interface HomeToolbarProps {
  onNew: () => void;
  onList: () => void;
}

export default function HomeToolbar({ onNew, onList }: HomeToolbarProps) {
  const [toolbarVisible, setToolbarVisible] = useState(true);

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
          <button onClick={onNew} style={baseButtonStyle}>
            New
          </button>
          <button onClick={onList} style={baseButtonStyle}>
            All Drawings
          </button>
        </>
      )}
      <HamburgerButton onClick={() => setToolbarVisible(!toolbarVisible)} />
    </div>
  );
}
