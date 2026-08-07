import type { CSSProperties } from 'react'

/**
 * A soft cluster of organic shapes, purely decorative (aria-hidden). Loosely
 * inspired by igloo.inc's confident use of playful rounded forms — reworked
 * here as a few flat, inline SVG paths in our own palette rather than their
 * custom WebGL scene, since Dahlia is a PWA opened several times a day and
 * has to stay small, fast and fully offline-capable.
 */
export function BlobField({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 420 220"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M78,36 C132,6 196,20 214,64 C232,110 198,152 142,160 C86,168 24,146 18,98 C13,58 26,64 78,36 Z"
        fill="var(--accent-soft)"
      />
      <path
        d="M252,14 C306,-8 366,24 372,72 C378,120 326,154 278,148 C230,142 208,110 214,72 C219,40 208,30 252,14 Z"
        fill="var(--phase-luteal)"
        opacity="0.16"
      />
      <path
        d="M138,96 C180,80 232,102 238,144 C244,186 196,208 154,197 C112,186 101,158 107,126 C111,106 113,106 138,96 Z"
        fill="var(--phase-follicular)"
        opacity="0.13"
      />
      <path
        d="M300,110 C334,98 372,116 376,150 C380,184 344,202 312,194 C280,186 270,164 275,140 C278,124 278,118 300,110 Z"
        fill="var(--phase-ovulation)"
        opacity="0.14"
      />
    </svg>
  )
}

/** One small soft badge, for a compact spot (an empty state, a card corner). */
export function BlobBadge({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" style={style}>
      <path
        d="M14,20 C22,6 44,4 54,18 C64,32 56,52 38,58 C20,64 4,52 4,36 C4,28 8,28 14,20 Z"
        fill="var(--surface-sunken)"
      />
    </svg>
  )
}
