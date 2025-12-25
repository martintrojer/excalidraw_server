'use client';

interface HamburgerButtonProps {
  onClick: () => void;
}

export default function HamburgerButton({ onClick }: HamburgerButtonProps) {
  return (
    <button
      className="hamburger-btn"
      onClick={onClick}
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
}
