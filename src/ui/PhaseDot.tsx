import type { Phase } from '../data/cycle'
import { PHASE_COLORS } from '../data/cycle'

/**
 * A small colour cue next to a phase label. Decorative only — the phase name
 * is always printed alongside it, so colour is never the only signal.
 */
export default function PhaseDot({ phase }: { phase: Phase }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        background: PHASE_COLORS[phase],
        marginRight: '6px',
        verticalAlign: 'middle',
      }}
    />
  )
}
