import type { ReactNode } from 'react'
import { BlobBadge } from './decor'
import { muted } from './styles'

/** A quiet page deserves better than plain grey text — same message, more warmth. */
export default function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <BlobBadge style={{ width: '40px', height: '40px', flexShrink: 0 }} />
      <p style={{ ...muted, margin: 0 }}>{children}</p>
    </div>
  )
}
