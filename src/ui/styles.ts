import type { CSSProperties } from 'react'

/*
 * Shared layout styles.
 *
 * Colours are always `var(--token)` from index.css, never literal hex — that is
 * what makes light and dark both work. Anything hardcoded here would be wrong
 * in one of the two modes.
 */

export const page: CSSProperties = {
  // The width limit lives on #root now.
}

export const card: CSSProperties = {
  background: 'var(--surface-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px',
  marginBottom: '12px',
}

/** The one card that matters most on the page. */
export const cardEmphasis: CSSProperties = {
  ...card,
  borderColor: 'var(--accent)',
  background: 'var(--accent-soft)',
}

/** Safety notes and destructive actions. */
export const cardDanger: CSSProperties = {
  ...card,
  borderColor: 'var(--danger-border)',
  background: 'var(--danger-soft)',
}

export const section: CSSProperties = {
  marginBottom: '20px',
}

export const row: CSSProperties = {
  marginBottom: '12px',
}

export const fieldset: CSSProperties = {
  border: 'none',
  padding: 0,
  margin: 0,
}

export const input: CSSProperties = {
  width: '100%',
  maxWidth: '280px',
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
  gap: '12px',
  padding: '10px 0',
  borderBottom: '1px solid var(--border)',
}

/**
 * Secondary text. A real muted colour rather than opacity — opacity on top of
 * a dark surface produced grey-on-grey that failed contrast.
 */
export const muted: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '14px',
}

export const dangerText: CSSProperties = {
  color: 'var(--danger)',
}
