import type { CSSProperties } from 'react';

/**
 * Shared button style constants to reduce duplication across components
 */

export const baseButtonStyle: CSSProperties = {
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
};

export const primaryButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: '1px solid var(--success)',
  background: 'var(--success)',
  color: 'white',
};

export const primaryButtonDisabledStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: 'var(--success-hover)',
  cursor: 'wait',
  opacity: 0.7,
};

export const dangerButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  border: '1px solid var(--danger)',
  background: 'var(--danger)',
  color: 'white',
};

export const disabledButtonStyle: CSSProperties = {
  ...baseButtonStyle,
  background: '#1a1a1a',
  color: '#666',
  cursor: 'not-allowed',
};

/**
 * Creates a button style with optional overrides
 * @param baseStyle - Base style to extend
 * @param overrides - Style overrides to apply
 * @returns Combined style object
 */
export function createButtonStyle(
  baseStyle: CSSProperties,
  overrides?: CSSProperties
): CSSProperties {
  return { ...baseButtonStyle, ...baseStyle, ...overrides };
}
