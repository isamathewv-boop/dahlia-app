import type { CSSProperties } from 'react'

// Plain shared styles so every page looks the same without a CSS framework.
// Real design comes later — this is just so the app is readable.

export const page: CSSProperties = {
  maxWidth: '480px',
}

export const card: CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '16px',
}

export const section: CSSProperties = {
  marginBottom: '20px',
}

export const row: CSSProperties = {
  marginBottom: '10px',
}

export const fieldset: CSSProperties = {
  border: 'none',
  padding: 0,
  margin: 0,
}

export const input: CSSProperties = {
  width: '100%',
  maxWidth: '260px',
  padding: '4px',
}

export const list: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
}

export const listItem: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '8px',
  padding: '8px 0',
  borderBottom: '1px solid #eee',
}

export const muted: CSSProperties = {
  opacity: 0.7,
  fontSize: '13px',
}

export const linkButton: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#a33',
  cursor: 'pointer',
  fontSize: '13px',
}
